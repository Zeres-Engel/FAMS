import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.nn import CrossEntropyLoss
from tqdm import tqdm
import logging
import time

from .network import build_model
from .header import build_head
from .evaluate import EvalMetric
from .metrics import InsightFaceMetric
from .lr_scheduler import PolynomialLRWarmup
from .draw import plot_metric, plot_metric_v2, plot_metrics_combined
from .callback import CallBackCheckPoint

class Trainer(nn.Module):
    def __init__(self, train_loader, valid_loader, valid_path, val_targets, model_name, head_type, embedding_size, class_num, lr_milestones, lr_gamma, lr, num_epochs, device, optimizer, num_gpus, output_path, checkpoint_path=None):
        super(Trainer, self).__init__()
        self.train_loader = train_loader
        self.valid_loader = valid_loader
        self.val_targets = val_targets
        self.valid_path = valid_path
        self.num_gpus = num_gpus
        self.device = torch.device(device if torch.cuda.is_available() else "cpu")
        self.model = build_model(model_name=model_name)
        self.head = build_head(head_type=head_type, embedding_size=embedding_size, class_num=class_num)
        
        if checkpoint_path is not None:
            self.load_checkpoint(checkpoint_path, head=True)
        
        self.cross_entropy_loss = CrossEntropyLoss()
        self.model.to(self.device)
        self.head.to(self.device)
        self.num_epochs = num_epochs
        self.epoch = 0
        self.current_epoch = 0
        kernel = self.head.kernel
        paras_wo_bn, paras_only_bn = self.split_parameters(self.model)
        
        if optimizer == 'adam':
            self.optimizer = optim.Adam([{'params': paras_wo_bn + [kernel], 'weight_decay': 5e-4}, {'params': paras_only_bn}], lr=lr)
        elif optimizer == 'adamw':
            self.optimizer = optim.AdamW([{'params': paras_wo_bn + [kernel], 'weight_decay': 5e-4}, {'params': paras_only_bn}], lr=lr)
        elif optimizer == 'sgd':
            self.optimizer = optim.SGD([{'params': paras_wo_bn + [kernel], 'weight_decay': 5e-4}, {'params': paras_only_bn}], lr=lr, momentum=0.9)
        else:
            raise ValueError("Unsupported optimizer choice. Choose between 'adam', 'adamw', or 'sgd'.")
        
        batch_size = self.train_loader.batch_size
        total_batch_size = batch_size * num_gpus
        num_images = len(self.train_loader.dataset)
        warmup_epochs = num_epochs // 10
        warmup_steps = (num_images // total_batch_size) * warmup_epochs
        total_steps = (num_images // total_batch_size) * num_epochs

        if optimizer in ['adam', 'adamw']:
            self.scheduler = PolynomialLRWarmup(optimizer=self.optimizer, warmup_iters=warmup_steps, total_iters=total_steps)
        elif optimizer == 'sgd':
            self.scheduler = torch.optim.lr_scheduler.MultiStepLR(self.optimizer, milestones=lr_milestones, gamma=lr_gamma)
        
        if checkpoint_path is not None:
            self.load_checkpoint(checkpoint_path, optimizer=True, scheduler=True)
        
        self.checkpoint_callback = CallBackCheckPoint(dirpath=output_path, monitor='val_accuracy', mode='max', save_best_only=True, verbose=1)
        
        if self.num_gpus >= 2:
            self.model = nn.DataParallel(self.model)
            self.head = nn.DataParallel(self.head)
        
        self.model.train()
        self.head.train()
        
        self.eval_metric = EvalMetric(val_loader=self.valid_loader, valid_path=self.valid_path, device=self.device)
        self.insightface_metric = InsightFaceMetric(valid_path=self.valid_path, val_targets=self.val_targets, device=self.device)
        self.output_path = output_path
        if not os.path.exists(self.output_path):
            os.makedirs(self.output_path)
        self.logger = self.setup_logger()
        self.start_time = time.time()
        self.total_steps = self.num_epochs * len(self.train_loader)

    def setup_logger(self):
        logger = logging.getLogger(__name__)
        logger.setLevel(logging.INFO)
        if not os.path.exists(self.output_path):
            os.makedirs(self.output_path)
        log_file = os.path.join(self.output_path, 'training.log')
        file_handler = logging.FileHandler(log_file)
        formatter = logging.Formatter(
            '%(asctime)s - %(levelname)s - %(message)s')
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        return logger

    def split_parameters(self, module):
        params_decay = []
        params_no_decay = []
        for m in module.modules():
            if isinstance(m, torch.nn.modules.batchnorm._BatchNorm):
                params_no_decay.extend([*m.parameters()])
            elif len(list(m.children())) == 0:
                params_decay.extend([*m.parameters()])
            else:
                for p in m.parameters(recurse=False):
                    if p.requires_grad:
                        if any(p is q for q in params_decay) or any(p is q for q in params_no_decay):
                            continue
                        params_decay.append(p)

        assert len(list(module.parameters())) == len(params_decay) + len(params_no_decay), "Parameter split is not covering all parameters"
        return params_decay, params_no_decay
    
    def forward(self, images, labels):
        embeddings, norms = self.model(images)
        cos_thetas = self.head(embeddings, norms, labels)
        if isinstance(cos_thetas, tuple):
            cos_thetas, bad_grad = cos_thetas
            labels[bad_grad.squeeze(-1)] = -100

        return cos_thetas, norms, embeddings, labels
    
    def training_step(self, images, labels, global_step):
        self.train()
        global_step += 1
        start_time = time.time()
    
        cos_thetas, norms, embeddings, labels = self.forward(images, labels)
                
        loss = self.cross_entropy_loss(cos_thetas, labels)

        self.optimizer.zero_grad()
        loss.backward()
        self.optimizer.step()
        
        if isinstance(self.scheduler, PolynomialLRWarmup):
            self.scheduler.step()
        
        _, predicted = torch.max(cos_thetas, 1)  
        correct = (predicted == labels).sum().item()
        accuracy = correct / labels.size(0)

        end_time = time.time()
        duration = end_time - start_time
        speed = labels.size(0) / duration
        
        learning_rate = self.get_current_lr()
        
        log_info = (
            f'Speed: {speed:.2f} samples/sec, '
            f'Loss: {loss.item():.4f}, '
            f'Accuracy: {accuracy:.4f}, '
            f'Learning Rate: {learning_rate:.6f}, '
            f'Epoch: {self.current_epoch}, '
            f'Global Step: {global_step}'
        )
        
        self.logger.info(log_info)
        
        return loss.item(), accuracy, speed, learning_rate, global_step
    
    def train_epoch(self, epoch, global_step):
        total_loss = total_accuracy = total_speed = total_learning_rate = 0.0
        accuracies_per_step, losses_per_step = [], []
        
        with tqdm(self.train_loader, desc=f'Epoch {epoch+1}') as tepoch:
            for _, (images, labels) in enumerate(tepoch):
                images, labels = images.to(self.device), labels.to(self.device)
                loss, accuracy, speed, learning_rate, global_step = self.training_step(images, labels, global_step)
                total_loss += loss
                total_accuracy += accuracy
                total_speed += speed 
                total_learning_rate += learning_rate
                accuracies_per_step.append(accuracy)
                losses_per_step.append(loss)
        
        avg_loss = total_loss / len(self.train_loader)
        avg_accuracy = total_accuracy / len(self.train_loader)
        avg_speed = total_speed / len(self.train_loader)
        avg_learning_rate = total_learning_rate / len(self.train_loader)
        avg_step = global_step / len(self.train_loader)

        self.checkpoint_callback(epoch, self.model, self.head, self.optimizer, self.scheduler, val_accuracy=avg_accuracy)

        return avg_loss, avg_accuracy, avg_speed, avg_learning_rate, avg_step, accuracies_per_step, losses_per_step, global_step

    def get_current_lr(self):
        return self.scheduler.get_last_lr()[0]

    def load_checkpoint(self, checkpoint_path, head=False, optimizer=False, scheduler=False):
        ckpt = torch.load(checkpoint_path, map_location=self.device)
        if 'state_dict' in ckpt:
            if any('model.' in key for key in ckpt['state_dict']):
                self.model.load_state_dict({key.replace('model.', ''): val for key, val in ckpt['state_dict'].items() if 'model.' in key})
            elif any('module.' in key for key in ckpt['state_dict']):
                self.model.load_state_dict({key.replace('module.', ''): val for key, val in ckpt['state_dict'].items() if 'module.' in key})
            else:
                self.model.load_state_dict(ckpt['state_dict'])
            print("Model state loaded successfully.")
            
            if 'head' in ckpt and head:
                if any('head.' in key for key in ckpt['head']):
                    self.head.load_state_dict({key.replace('head.', ''): val for key, val in ckpt['head'].items() if 'head.' in key})
                elif any('module.' in key for key in ckpt['head']):
                    self.head.load_state_dict({key.replace('module.', ''): val for key, val in ckpt['head'].items() if 'module.' in key})
                else:
                    self.head.load_state_dict(ckpt['head'])
                print("Head state loaded successfully.")
            else:
                print("Checkpoint does not contain 'head' state.")
            
            if 'optimizer' in ckpt and optimizer:
                self.optimizer.load_state_dict(ckpt['optimizer'])
                print("Optimizer state loaded successfully.")
                
            if 'scheduler' in ckpt and scheduler:
                self.scheduler.load_state_dict(ckpt['scheduler'])
                print("Scheduler state loaded successfully.")

            if 'epoch' in ckpt:
                self.epoch = ckpt['epoch']
                print(f"Epoch loaded successfully, continuing from epoch {self.epoch}.")
        else:
            print("Checkpoint does not contain 'state_dict'.")

    def validate(self, epoch):
        print("---------------------------------------------------------------------------------------------------------------------")
        self.eval()

        aka_acc = aka_precision = aka_recall = aka_selectivity = aka_auc = 0
        isf_acc = isf_auc = acc_cbs = cbs = 0

        if self.valid_loader is not None:
            try:
                aka_acc, aka_precision, aka_recall, aka_selectivity, aka_auc = self.eval_metric.eval(model=self.model)
            except Exception as e:
                print(f"An error occurred during the AkaCam evaluation: {e}")
        
        if self.val_targets is not None:
            try:
                isf_acc, isf_auc, acc_cbs, cbs = self.insightface_metric.eval(model=self.model)
            except Exception as e:
                print(f"An error occurred during the InsightFace evaluation: {e}")

        self.logger.info(
            f'[AkaCam] | Accuracy: {aka_acc:.6f} | Precision: {aka_precision:.6f} | Recall: {aka_recall:.6f} | Selectivity: {aka_selectivity:.6f} | AUC: {aka_auc:.6f}'
        )
        self.logger.info(
            f'[InsightFace] | Accuracy: {isf_acc:.6f} | AUC: {isf_auc:.6f} | Accuracy Combination: {acc_cbs:.6f} | Combination Score: {cbs:.6f}'
        )
        
        print(f"[AkaCam] | Accuracy: {aka_acc:.6f} | Precision: {aka_precision:.6f} | Recall: {aka_recall:.6f} | Selectivity: {aka_selectivity:.6f} | AUC: {aka_auc:.6f}")
        print(f"[InsightFace] | Accuracy: {isf_acc:.6f} | AUC: {isf_auc:.6f} | Accuracy Combination: {acc_cbs:.6f} | Combination Score: {cbs:.6f}")
        print("---------------------------------------------------------------------------------------------------------------------")
        
        return aka_acc, aka_auc, isf_acc, isf_auc, acc_cbs, cbs

    def train_model(self):
        losses, losses_train_step, accuracies_train, accuracies_train_step, accuracies, auc_scores, combination_scores = [], [], [], [], [], [], []
        best_avg_accuracy = 0.0
        global_step = 0
        for epoch in range(self.num_epochs):
            self.train()
            
            self.current_epoch = epoch + 1
            self.logger.info(f'Starting epoch {self.current_epoch}')
            
            avg_loss, avg_accuracy, avg_speed, avg_learning_rate, avg_step, accuracies_per_step, losses_per_step, global_step = self.train_epoch(epoch, global_step)
            
            if isinstance(self.scheduler, torch.optim.lr_scheduler.MultiStepLR):
                self.scheduler.step()
                    
            print("Running evaluation...")
            print(
            f'Epoch {self.current_epoch}:, '
            f'Avg Speed: {avg_speed:.2f} samples/sec, '
            f'Avg Loss: {avg_loss:.4f}, '
            f'Avg Accuracy: {avg_accuracy:.4f}, '
            f'Avg Learning Rate: {avg_learning_rate:.6f}, '
            f'Avg Global Step: {avg_step}'
            )
            
            self.logger.info(
            f'Epoch: {self.current_epoch}, '
            f'Avg Speed: {avg_speed:.2f} samples/sec, '
            f'Avg Loss: {avg_loss:.4f}, '
            f'Avg Accuracy: {avg_accuracy:.4f}, '
            f'Avg Learning Rate: {avg_learning_rate:.6f}, '
            f'Avg Global Step: {avg_step}'
            )
        
            aka_acc, aka_auc, isf_acc, isf_auc, acc_cbs, cbs = self.validate(epoch)
                            
            acc = (aka_acc + isf_acc)/2
            auc = (aka_auc + isf_auc)/2
            cb_overall = (acc + auc)/2
            
            self.logger.info(
                f"|[Total]|   [AkaCam] Accuracy: {aka_acc:.6f} | [AkaCam] AUC: {aka_auc:.6f} | [Total] Accuracy: {acc:.6f} | [Total] AUC: {auc:.6f}"
            )
            
            print("---------------------------------------------------------------------------------------------------------------------")
            print(f"|[Total]|   [AkaCam] Accuracy: {aka_acc:.6f} | [AkaCam] AUC: {aka_auc:.6f} | [Total] Accuracy: {acc:.6f} | [Total] AUC: {auc:.6f}")
            print("---------------------------------------------------------------------------------------------------------------------")

            losses.append(avg_loss)
            losses_train_step.extend(losses_per_step)
            accuracies_train.append(avg_accuracy)
            accuracies_train_step.extend(accuracies_per_step)
            
            accuracies.append(acc)
            auc_scores.append(auc)
            combination_scores.append(cbs)
            
            self.checkpoint_callback(epoch, self.model, self.head, self.optimizer, self.scheduler, val_accuracy=avg_accuracy)
            
            epochs = range(1, epoch + 2)
            
            plot_metric_v2(self, epochs, losses, losses_train_step, 'Epoch', 'Loss', 'Loss over Time', 'loss_training.png')
            
            plot_metric_v2(self, epochs, accuracies_train, accuracies_train_step, 'Epoch', 'Accuracy', 'Accuracy over Time', 'accuracy_training.png')
            
            plot_metric(self, epochs, accuracies, 'Accuracy', 'Epoch', 'Accuracy', 'Accuracy over Time', 'accuracy_plot.png')
            
            plot_metric(self, epochs, auc_scores, 'AUC Score', 'Epoch', 'AUC Score', 'AUC Score over Time', 'auc_score_plot.png')
            
            plot_metric(self, epochs, combination_scores, 'Combination Score', 'Epoch', 'Combination Score', 'Combination Score over Time', 'combination_score.png')
            
            plot_metrics_combined(self, epochs, accuracies, auc_scores, combination_scores, 'Accuracy', 'AUC Score', 'Combination Score', 'Epoch', 'Metric Scores', 'Metrics Combined over Time', 'metrics_combined_plot.png')

        self.logger.info("Training completed. Model and plots saved.")

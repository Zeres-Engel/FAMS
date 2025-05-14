import os
import numpy as np

import torch
from torch.utils.data import DataLoader, TensorDataset

from sklearn import metrics

from sklearn.metrics import roc_curve, auc

from sklearn.model_selection import KFold
from tqdm import tqdm
import pickle
import cv2

class InsightFaceMetric:
    def __init__(self, valid_path, val_targets, device, thresholds=np.arange(0, 1, 0.01)):
        if not val_targets:
            print("Error: val_targets is empty. Please provide valid targets.")
            return

        self.device = device
        self.thresholds = thresholds
        self.val_targets = val_targets
        self.valid_path = valid_path

    def load_dataset(self, target):
        file_path = os.path.join(self.valid_path, f"{target}.bin")
        if os.path.exists(file_path):
            return self.load_bin(file_path, (112, 112))
        else:
            print(f"Warning: Dataset file for {target} not found at {file_path}. This dataset will be skipped.")
            return None, None

    def eval(self, model):
        model.eval()
        acc = auc = acc_cbs = cbs = 0.0
        for target in self.val_targets:
            loader, issame = self.load_dataset(target)
            if loader is None:
                continue

            embeddings, issame_list = self.extract_embeddings_bins(loader, issame, model, flip=False)
            accuracy, auc_score, precision, recall, f1_score, selectivity, accuracy_cbs, combination_score = self.insightface_strategy(embeddings, issame_list)
            
            embeddings, issame_list = self.extract_embeddings_bins(loader, issame, model, flip=True)
            accuracy_flip, auc_score_flip, precision_flip, recall_flip, f1_score_flip, selectivity_flip, accuracy_cbs_flip, combination_score_flip = self.insightface_strategy(embeddings, issame_list)
            
            diff_acc = abs(accuracy - accuracy_flip)
            diff_auc = abs(auc_score - auc_score_flip)
            diff_acc_cbs = abs(accuracy_cbs - accuracy_cbs_flip)
            diff_cbs = abs(combination_score - combination_score_flip)
            
            acc += accuracy
            auc += auc_score
            acc_cbs += accuracy_cbs
            cbs += combination_score
            
            print(f"[{target.upper()}]   Accuracy: ({accuracy:.6f} - {diff_acc:.4f}),   AUC: ({auc_score:.6f} - {diff_auc:.4f})")
            print(f"[{target.upper()}]   Accuracy Combination: ({accuracy_cbs:.6f} - {diff_acc_cbs:.4f}),   Combination Score: ({combination_score:.6f} - {diff_cbs:.4f})")

        num_datasets = len(self.val_targets)
        avg_acc = acc / num_datasets
        avg_auc = auc / num_datasets
        avg_acc_cbs = acc_cbs / num_datasets
        avg_cbs = cbs / num_datasets

        return avg_acc, avg_auc, avg_acc_cbs, avg_cbs
    
    def extract_embeddings_bins(self, data, issame_list, model, flip=False, batch_size=32, shuffle=False):
        if flip is True:
            data_tensor = data[1]
        else:
            data_tensor = data[0]
            
        dataset = TensorDataset(data_tensor)
        dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=shuffle)

        model = model.to(self.device)

        embeddings_list = []
        with torch.no_grad():
            for batch, in dataloader:
                batch = batch.to(self.device)
                embeddings = model(batch)
                if isinstance(embeddings, tuple):
                    embeddings = embeddings[0]
                embeddings_list.append(embeddings.cpu())
        embeddings = torch.cat(embeddings_list, dim=0).numpy()
        return embeddings, issame_list
    
    def load_bin(self, path, image_size, batch_size=8):
        try:
            with open(path, 'rb') as f:
                bins, issame_list = pickle.load(f)
        except UnicodeDecodeError:
            with open(path, 'rb') as f:
                bins, issame_list = pickle.load(f, encoding='bytes')
        data_list = []
        for flip in [0, 1]:
            data = torch.empty((len(issame_list) * 2, 3, image_size[0], image_size[1]))
            data_list.append(data)
        for i in tqdm(range(0, len(issame_list) * 2, batch_size), desc="Loading bins"):
            for j in range(i, min(i + batch_size, len(issame_list) * 2)):
                _bin = bins[j]
                img = cv2.imdecode(np.frombuffer(_bin, np.uint8), cv2.IMREAD_COLOR)
                img = cv2.resize(img, (image_size[1], image_size[0]))
                img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                img_tensor = torch.from_numpy(img).permute(2, 0, 1).float() / 255.0
                for flip in [0, 1]:
                    if flip == 1:
                        img_flipped = torch.flip(img_tensor, [2]).clone()
                        data_list[flip][j] = img_flipped
                    else:
                        data_list[flip][j] = img_tensor
        return data_list, issame_list

    
    def batched_dot_product(self, a, b, batch_size=1000):
        result = []
        for i in range(0, len(a), batch_size):
            batch_a = a[i:i+batch_size]
            batch_b = b[i:i+batch_size]
            result.append(np.sum(np.multiply(batch_a, batch_b), axis=1))
        return np.concatenate(result)

    def insightface_strategy(self, embeddings, issame_list, nrof_folds=10, flip=False, batch_size=1000, shuffle=False):
        embeddings1 = embeddings[0::2]
        embeddings2 = embeddings[1::2]
        
        actual_issame = np.asarray(issame_list)
        
        dot_product = self.batched_dot_product(embeddings1, embeddings2, batch_size)
        
        norm_embeddings1 = np.linalg.norm(embeddings1, axis=1)
        norm_embeddings2 = np.linalg.norm(embeddings2, axis=1)
        
        cosine_similarity = dot_product / (norm_embeddings1 * norm_embeddings2)
        distances = 1 - cosine_similarity


        test_accuracy = test_precision = test_recall = test_f1_score = test_selectivity = test_combination_score = test_acc_cbs = 0
        
        nrof_thresholds = len(self.thresholds)
        
        kfold = KFold(n_splits=nrof_folds, shuffle=False)
        
        acc_vol = 0
        cbs_vol = 0
        
        for fold_idx, (train_idx, test_idx) in enumerate(kfold.split(distances)):
            
            
            #* Get threshold for accuracy max and combinaiton score max
            best_acc_threshold = best_acc = best_cbs_threshold = best_cbs = 0
            for idx, threshold in enumerate(self.thresholds):
                
                predicted_similar = distances[train_idx] < threshold
                
                TP = np.sum(predicted_similar & actual_issame[train_idx])
                FP = np.sum(predicted_similar & ~actual_issame[train_idx])
                TN = np.sum(~predicted_similar & ~actual_issame[train_idx])
                FN = np.sum(~predicted_similar & actual_issame[train_idx])
                
                precision = TP / (TP + FP) if TP + FP > 0 else 0
                recall = TP / (TP + FN) if TP + FN > 0 else 0
                f1_score = 2 * precision * recall / (precision + recall) if precision + recall > 0 else 0
                selectivity = TN / (TN + FP) if TN + FP > 0 else 0
                accuracy = (TP + TN) / (TP + TN + FP + FN)
                
                if accuracy >= best_acc:
                    best_acc = accuracy
                    best_acc_threshold = threshold
                    
                combination_score = (precision + recall + f1_score + selectivity + accuracy)/5
                
                if combination_score > best_cbs:
                    best_cbs = combination_score
                    best_cbs_threshold = threshold
                
            #* Calculate InsightFace Metrics
            predicted_similar = distances[test_idx] < best_acc_threshold
            
            TP = np.sum(predicted_similar & actual_issame[test_idx])
            FP = np.sum(predicted_similar & ~actual_issame[test_idx])
            TN = np.sum(~predicted_similar & ~actual_issame[test_idx])
            FN = np.sum(~predicted_similar & actual_issame[test_idx])
            
            precision = TP / (TP + FP) if TP + FP > 0 else 0
            recall = TP / (TP + FN) if TP + FN > 0 else 0
            f1_score = 2 * precision * recall / (precision + recall) if precision + recall > 0 else 0
            selectivity = TN / (TN + FP) if TN + FP > 0 else 0
            accuracy = (TP + TN) / (TP + TN + FP + FN)

            test_accuracy += accuracy
            test_precision += precision
            test_recall += recall
            test_f1_score += f1_score
            test_selectivity += selectivity
            
            #* Calculate AkaCam Metrics
            predicted_similar = distances[test_idx] < best_cbs_threshold
                
            TP = np.sum(predicted_similar & actual_issame[test_idx])
            FP = np.sum(predicted_similar & ~actual_issame[test_idx])
            TN = np.sum(~predicted_similar & ~actual_issame[test_idx])
            FN = np.sum(~predicted_similar & actual_issame[test_idx])
            
            precision_cbs = TP / (TP + FP) if TP + FP > 0 else 0
            recall_cbs = TP / (TP + FN) if TP + FN > 0 else 0
            f1_score_cbs = 2 * precision * recall / (precision + recall) if precision + recall > 0 else 0
            selectivity_cbs = TN / (TN + FP) if TN + FP > 0 else 0
            accuracy_cbs = (TP + TN) / (TP + TN + FP + FN)
                
            combination_score = (precision_cbs + recall_cbs + f1_score_cbs + selectivity_cbs + accuracy_cbs)/5
            
            test_combination_score += combination_score
            test_acc_cbs += accuracy_cbs
                
        fpr, tpr, _ = roc_curve(actual_issame, 1 - distances)
        auc_score = auc(fpr, tpr)

        accuracy = test_accuracy / nrof_folds
        precision = test_precision / nrof_folds

        recall = test_recall / nrof_folds
        selectivity = test_selectivity / nrof_folds
        f1_score = test_f1_score / nrof_folds
        
        accuracy_cbs = test_acc_cbs /  nrof_folds
        combination_score = test_combination_score / nrof_folds
        
        return accuracy, auc_score, precision, recall, f1_score, selectivity, accuracy_cbs, combination_score
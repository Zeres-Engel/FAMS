import os
import argparse
import torch
import random
from torchvision import datasets, transforms
from torch.utils.data import DataLoader, Subset
import logging
from app import EvalMetric, InsightFaceMetric, CustomImageFolderDataset, LocNXEval
from app.adaface import network as adaface_network
from app.arcface import network as arcface_network

def parse_args():
    parser = argparse.ArgumentParser(description="Train a model on a dataset.")
    parser.add_argument("--valid_path", type=str, default=None, help="Path to the validation dataset.")
    parser.add_argument("--model_name", type=str, default="ir_50", help="Name of the model.")
    parser.add_argument("--val_targets", nargs='+', help="List of validation targets.")
    parser.add_argument("--checkpoint_path", type=str, help="Path to a pre-trained model checkpoint.")
    parser.add_argument("--batch_size", type=int, default=128, help="Batch size for evaluating.")
    parser.add_argument("--low_res_augmentation_prob", type=float, default=0.0, help="Probability of applying low resolution augmentation.")
    parser.add_argument("--crop_augmentation_prob", type=float, default=0.0, help="Probability of applying crop augmentation.")
    parser.add_argument("--photometric_augmentation_prob", type=float, default=0.0, help="Probability of applying photometric augmentation.")
    parser.add_argument("--swap_color_channel", action='store_true', help="Set True to swap RGB to BGR.")
    parser.add_argument("--output_path", type=str, default=".", help="Path to save the results")
    parser.add_argument("--limit_samples", type=int, default=0, help="Number of IDs to be used for evaluation.")
    parser.add_argument("--random_seed", type=int, default=12, help="Seed for random number generator.")
    parser.add_argument("--model_type", type=str, choices=["adaface", "arcface"], default="arcface", help="Type of model to use: adaface or arcface.")
    return parser.parse_args()

def setup_logger(output_path):
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    if not os.path.exists(output_path):
        os.makedirs(output_path)
    log_file = os.path.join(output_path, 'eval.log')
    file_handler = logging.FileHandler(log_file)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)
    return logger

def load_adaface_model(model_name, checkpoint_path, device):
    model = adaface_network.build_model(model_name=model_name)
    model.to(device)
    ckpt = torch.load(checkpoint_path, map_location=device)
    if 'state_dict' in ckpt:
        if any('model.' in key for key in ckpt['state_dict']):
            model.load_state_dict({key.replace('model.', ''):val
                                for key,val in ckpt['state_dict'].items() if 'model.' in key})
        elif any('module.' in key for key in ckpt['state_dict']):
            model.load_state_dict({key.replace('module.', ''):val
                                for key,val in ckpt['state_dict'].items() if 'module.' in key})
        else:
            model.load_state_dict(ckpt['state_dict'])
        print("Model state loaded successfully.")
    else:
        print("Checkpoint does not contain 'state_dict'.")
    
    return model

def load_arcface_model(model_name, checkpoint_path, device):
    if model_name == 'ir_50':
        model = arcface_network.iresnet50()
    elif model_name == 'ir_100':
        model = arcface_network.iresnet100()
    else:
        raise ValueError("Model not created. Please check the model name.")
    model.to(device)
    checkpoint = torch.load(checkpoint_path, map_location=device, weights_only=True)
    if "state_dict_backbone" in checkpoint:
        model.load_state_dict(checkpoint["state_dict_backbone"])
    else:
        model.load_state_dict(checkpoint)
    return model

def main():
    args = parse_args()
    logger = setup_logger(args.output_path)
    
    # Set the seed for the random number generator
    random.seed(args.random_seed)

    pre_transforms = transforms.Compose([
        transforms.Resize((112, 112)),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
    ])
    valid_loader = None

    try:
        valid_dataset = CustomImageFolderDataset(
            root=args.valid_path,
            transform=pre_transforms,
            low_res_augmentation_prob=args.low_res_augmentation_prob,
            crop_augmentation_prob=args.crop_augmentation_prob,
            photometric_augmentation_prob=args.photometric_augmentation_prob,
            swap_color_channel=args.swap_color_channel,
            output_dir=args.output_path
        )

        # Get all the IDs
        ids = valid_dataset.classes

        # If the number of IDs is greater than or equal to limit_samples, randomly select limit_samples IDs
        if len(ids) >= args.limit_samples and args.limit_samples != 0:
            ids = random.sample(ids, args.limit_samples)
            indices = [i for i, (path, target) in enumerate(valid_dataset.samples) if valid_dataset.classes[target] in ids]
            valid_dataset = Subset(valid_dataset, indices)
        valid_loader = DataLoader(valid_dataset, batch_size=args.batch_size, shuffle=True)
        logger.info(f"Validation dataset: {len(ids)} IDs with a total of {len(valid_dataset)} images.")
    except Exception as e:
        logger.error(f"No validation dataset provided. Error: {e}")

    device = 'cuda:0' if torch.cuda.is_available() else 'cpu'
    model = None
    try:
        if args.model_type == "arcface":
            model = load_arcface_model(args.model_name, args.checkpoint_path, device)
        elif args.model_type == "adaface":
            model = load_adaface_model(args.model_name, args.checkpoint_path, device)
        else:
            logger.error("Unsupported model type.")
            return
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        return

    logger.info(f"Using device: {device}")
    logger.info(f"Model type: {args.model_type}, Checkpoint path: {args.checkpoint_path}, Model name: {args.model_name}")

    aka_acc = aka_precision = aka_recall = aka_selectivity = aka_auc = 0
    isf_acc = isf_auc = acc_cbs = cbs = 0

    if valid_loader is not None:
        try:
            eval_metric = EvalMetric(val_loader=valid_loader, valid_path=args.valid_path, device=device)
            aka_acc, aka_precision, aka_recall, aka_selectivity, aka_auc = eval_metric.eval(model=model)
        except Exception as e:
            logger.error(f"An error occurred during the AkaCam evaluation: {e}")

    if args.val_targets is not None:
        try:
            insightface_metric = InsightFaceMetric(valid_path=args.valid_path, val_targets=args.val_targets, device=device)
            isf_acc, isf_auc, acc_cbs, cbs = insightface_metric.eval(model=model)
        except Exception as e:
            logger.error(f"An error occurred during the InsightFace evaluation: {e}")
    
    #* LocNX eval
    # print('LocNX Metrics')
    # eval_metric = LocNXEval(num_classes = 10, val_loader=valid_loader, output_path = './')
    # eval_metric.run(backbone=model, graph_name='m')

    logger.info(f"[AkaCam] | Accuracy: {aka_acc:.6f} | Precision: {aka_precision:.6f} | Recall: {aka_recall:.6f} | Selectivity: {aka_selectivity:.6f} | AUC: {aka_auc:.6f}")
    logger.info(f"[InsightFace] | Accuracy: {isf_acc:.6f} | AUC: {isf_auc:.6f} | Accuracy Combination: {acc_cbs:.6f} | Combination Score: {cbs:.6f}")
    print(f"[AkaCam] | Accuracy: {aka_acc:.6f} | Precision: {aka_precision:.6f} | Recall: {aka_recall:.6f} | Selectivity: {aka_selectivity:.6f} | AUC: {aka_auc:.6f}")
    print(f"[InsightFace] | Accuracy: {isf_acc:.6f} | AUC: {isf_auc:.6f} | Accuracy Combination: {acc_cbs:.6f} | Combination Score: {cbs:.6f}")

if __name__ == '__main__':
    main()

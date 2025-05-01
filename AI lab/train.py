import os
import argparse
from torchvision import transforms
from torch.utils.data import DataLoader

from app import Trainer, Augmenter, CustomImageFolderDataset

def parse_args():
    parser = argparse.ArgumentParser(description="Train a model on a dataset.")
    parser.add_argument("--train_path", type=str, required=True, help="Path to the training dataset.")
    parser.add_argument("--valid_path", type=str, default=None, help="Path to the validation dataset.")
    parser.add_argument("--model_name", type=str, default="ir_50", help="Name of the model.")
    parser.add_argument("--head_type", type=str, default="adaface", help="Type of head used in the model.")
    parser.add_argument("--embedding_size", type=int, default=512, help="Size of the embedding.")
    parser.add_argument("--lr", type=float, default=1e-1, help="Learning rate.")
    parser.add_argument('--lr_milestones', default='8,12,14', type=str, help='epochs for reducing LR')
    parser.add_argument('--lr_gamma', default=0.1, type=float, help='multiply when reducing LR')
    parser.add_argument("--num_epochs", type=int, default=24, help="Number of epochs to train.")
    parser.add_argument("--num_gpus", type=int, default=1, help="Number of GPUs to use.")
    parser.add_argument("--batch_size", type=int, default=128, help="Batch size for training.")
    parser.add_argument("--val_targets", nargs='+', help="List of validation targets.")
    parser.add_argument("--optimizer", type=str, default="adamw", help="The optimizer to use (sgd, adam, adamw)")
    parser.add_argument("--output_path", type=str, default=".", help="Path to save the trained model and logs.")
    parser.add_argument("--checkpoint_path", type=str, help="Path to a pre-trained model checkpoint.")
    parser.add_argument("--low_res_augmentation_prob", type=float, default=0.0, help="Probability of applying low resolution augmentation.")
    parser.add_argument("--crop_augmentation_prob", type=float, default=0.0, help="Probability of applying crop augmentation.")
    parser.add_argument("--photometric_augmentation_prob", type=float, default=0.0, help="Probability of applying photometric augmentation.")
    parser.add_argument("--swap_color_channel", action='store_true', help="Set True to swap RGB to BGR.")
    parser.add_argument("--device", type=str, default="cuda:0", help="Device to use for training (e.g., 'cuda:0', 'cuda:1', 'cpu')")
    return parser.parse_args()

def main():
    args = parse_args()
    args.lr_milestones = [int(x) for x in args.lr_milestones.split(',')]

    pre_transforms = transforms.Compose([
        transforms.Resize((112, 112)),
        transforms.ToTensor(),
        transforms.Normalize([0.5, 0.5, 0.5], [0.5, 0.5, 0.5])
    ])

    train_dataset = CustomImageFolderDataset(
        root=args.train_path,
        transform=pre_transforms,
        low_res_augmentation_prob=args.low_res_augmentation_prob,
        crop_augmentation_prob=args.crop_augmentation_prob,
        photometric_augmentation_prob=args.photometric_augmentation_prob,
        swap_color_channel=args.swap_color_channel,
        output_dir=args.output_path
    )
    
    train_loader = DataLoader(train_dataset, batch_size=args.batch_size, shuffle=True)
    print(f"Train dataset: {len(train_dataset.classes)} IDs with a total of {len(train_dataset)} images.")
    
    valid_dataset = None
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
        valid_loader = DataLoader(valid_dataset, batch_size=args.batch_size, shuffle=False)
        print(f"Validation dataset: {len(valid_dataset.classes)} IDs with a total of {len(valid_dataset)} images.")
    except:
        print("No validation dataset provided.")

    trainer = Trainer(
        train_loader=train_loader,
        valid_loader=valid_loader,
        valid_path=args.valid_path,
        val_targets=args.val_targets,
        model_name=args.model_name,
        head_type=args.head_type,
        embedding_size=args.embedding_size,
        class_num=len(train_dataset.classes),
        lr=args.lr,
        lr_milestones=args.lr_milestones, 
        lr_gamma=args.lr_gamma,
        num_epochs=args.num_epochs,
        num_gpus=args.num_gpus,
        optimizer=args.optimizer,
        output_path=args.output_path,
        checkpoint_path=args.checkpoint_path,
        device=args.device
    )
    
    trainer.train_model()

if __name__ == '__main__':
    main()

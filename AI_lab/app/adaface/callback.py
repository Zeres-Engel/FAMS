import os
import torch

class CallBackCheckPoint:
    def __init__(self, dirpath, monitor='val_accuracy', mode='max', save_best_only=True, verbose=1):
        self.dirpath = dirpath
        self.monitor = monitor
        self.mode = mode
        self.save_best_only = save_best_only
        self.verbose = verbose
        self.best_score = None
        self.monitor_op = max if mode == 'max' else min

    def __call__(self, epoch, model, head, optimizer, scheduler, **kwargs):
        current_score = kwargs.get(self.monitor)

        if current_score is None:
            print(f"Warning: Metric '{self.monitor}' not found. Checkpoint not saved.")
            return

        if self.best_score is None or self.monitor_op(current_score, self.best_score) == current_score:
            self.best_score = current_score
            self.save_checkpoint(epoch, model, head, optimizer, scheduler, current_score)

    def save_checkpoint(self, epoch, model, head, optimizer, scheduler, score):
        checkpoint = {
            'epoch': epoch,
            'state_dict': model.state_dict(),
            'head': head.state_dict(),
            'optimizer': optimizer.state_dict(),
            'scheduler': scheduler.state_dict(),
            self.monitor: score
        }
        filename = os.path.join(self.dirpath, f'checkpoint.pth')
        torch.save(checkpoint, filename)
        if self.verbose:
            print(f"Checkpoint saved at epoch {epoch} with {self.monitor}: {score:.4f}")
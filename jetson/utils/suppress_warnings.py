import torch
import gc

def setup_gpu():
    """Setup GPU for optimal performance"""
    if torch.cuda.is_available():
        # Empty CUDA cache
        torch.cuda.empty_cache()
        
        # Run garbage collector
        gc.collect()
        
        # Set CUDA device
        torch.cuda.set_device(0)
        
        # Enable cuDNN autotuner
        torch.backends.cudnn.benchmark = True
        
        # Use TF32 for better performance on Ampere GPUs
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        
        print(f"GPU setup complete. Using: {torch.cuda.get_device_name(0)}")
        print(f"Available GPU memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.2f} GB")
    else:
        print("No GPU available") 
import warnings
import logging

def suppress_warnings():
    """Suppress common warnings in the application"""
    # Suppress specific warning categories
    warnings.filterwarnings("ignore", category=FutureWarning)
    warnings.filterwarnings("ignore", category=UserWarning)
    
    # Suppress timm import warnings
    warnings.filterwarnings(
        "ignore",
        message="Importing from timm.models.layers is deprecated"
    )
    
    # Suppress CUDA provider warnings
    warnings.filterwarnings(
        "ignore",
        message="Specified provider 'CUDAExecutionProvider' is not in available provider names"
    )
    
    # Set logging level for specific modules
    logging.getLogger("torch.hub").setLevel(logging.ERROR)
    logging.getLogger("timm").setLevel(logging.ERROR)
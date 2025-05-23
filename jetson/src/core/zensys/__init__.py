# Import the main class from the module
from src.core.zensys.zensys import ZenSys

# Make the parent module's functions available without causing circular imports
import os
import sys
from pathlib import Path

# Add project root to Python path if needed
project_root = str(Path(__file__).parent.parent.parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

# Export public API
__all__ = ['ZenSys']

# Note: create_zensys_instance and get_default_instance should be imported directly from src.core.zensys
# This avoids the circular import that was causing maximum recursion depth errors
import os
# Fix OpenMP runtime issues
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
os.environ['OMP_NUM_THREADS'] = '4'

import sys
from pathlib import Path

# Add project root to Python path
project_root = str(Path(__file__).parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from src.zensys import ZenSys
from utils.config_utils import config

def main():
    # Initialize face recognition system
    face_system = ZenSys()
    
    # Process gallery if database doesn't exist
    if not os.path.exists(os.path.join(config.db_path, "face_index.faiss")):
        face_system.process_gallery()
    
    # Load database
    face_system.load_database()
    
    print("Starting webcam...")
    face_system.run_webcam()

if __name__ == "__main__":
    main() 
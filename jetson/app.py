import os
# Fix OpenMP runtime issues
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
os.environ['OMP_NUM_THREADS'] = '4'

import sys
import argparse
from pathlib import Path
import time
import cv2
from datetime import datetime
import json
import requests

# Add project root to Python path
project_root = str(Path(__file__).parent)
if project_root not in sys.path:
    sys.path.append(project_root)

# Import required modules
from api.attendance_api import AttendanceSystem
from api.rfid_api import RFIDAPIClient


def run_gui():
    """Run the GUI application"""
    from PySide6.QtWidgets import QApplication
    from src.gui import MainWindow

    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())



def main():
    """Main entry point"""
    url = "'http://fams.io.vn/api-nodejs'"
    run_gui()
    
if __name__ == "__main__":
    main()
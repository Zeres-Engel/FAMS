import os
import json
import time
import datetime
import cv2
from pathlib import Path
import sys

# Add project root to Python path
project_root = str(Path(__file__).parent.parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from utils.config_utils import config

class AttendanceLogger:
    def __init__(self, base_path=None):
        """
        Initialize the attendance logger
        
        Args:
            base_path: Base directory to save attendance data and face images
        """
        self.base_path = base_path or config.data.attendance_dir
        self.classroom_id = config.logging.classroom_id if hasattr(config, 'logging') else 1
        self._ensure_directories()
        
    def _ensure_directories(self):
        """Ensure necessary directories exist"""
        Path(self.base_path).mkdir(parents=True, exist_ok=True)
        
    def _get_user_dir(self, user_id):
        """Get directory for a specific user"""
        user_dir = os.path.join(self.base_path, user_id)
        Path(user_dir).mkdir(exist_ok=True)
        return user_dir
        
    def log_attendance(self, user_id, rfid_id, face_image=None, classroom_id=None, status="SUCCESS"):
        """
        Log a user attendance event and save face image
        
        Args:
            user_id: User identifier (name)
            rfid_id: RFID card ID
            face_image: Face image as numpy array (optional)
            classroom_id: Classroom identifier (default=from config)
            status: Status of verification (SUCCESS or FAILED)
            
        Returns:
            dict: Attendance record information
        """
        # Use classroom_id from parameter or from config
        classroom_id = classroom_id or self.classroom_id
        
        # Create timestamp
        timestamp = datetime.datetime.now()
        formatted_time = timestamp.strftime("%Y-%m-%d_%H-%M-%S")
        
        # Save face image if provided
        image_path = None
        if face_image is not None and face_image.size > 0:
            user_dir = self._get_user_dir(user_id)
            image_filename = f"{formatted_time}.jpg"
            image_path = os.path.join(user_dir, image_filename)
            
            try:
                cv2.imwrite(image_path, face_image)
            except Exception as e:
                print(f"Error saving face image: {e}", flush=True)
                image_path = None
        
        # Create attendance record - chính xác định dạng mà người dùng muốn
        attendance_record = {
            "classroomId": classroom_id,
            "userId": user_id,
            "RFID_ID": rfid_id,
            "CheckIn": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "CheckInFace": image_path if image_path else "No image saved"
        }
        
        # Chỉ hiển thị JSON đơn giản, không có phần trang trí
        print(json.dumps(attendance_record, indent=2, ensure_ascii=False), flush=True)
        
        return attendance_record 
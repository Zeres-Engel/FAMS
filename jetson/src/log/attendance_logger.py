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
    """
    Logger chuyên dụng cho việc ghi nhận điểm danh.
    Lưu thông tin điểm danh dưới dạng JSON và lưu ảnh khuôn mặt.
    """
    
    def __init__(self, base_path=None):
        """
        Initialize the attendance logger
        
        Args:
            base_path: Base directory to save attendance data and face images
        """
        self.base_path = base_path or config.data.attendance_dir
        self.device_id = config.logging.device_id if hasattr(config, 'logging') else 1
        self._ensure_directories()
        
    def _ensure_directories(self):
        """Ensure necessary directories exist"""
        Path(self.base_path).mkdir(parents=True, exist_ok=True)
        
    def _get_user_dir(self, user_id):
        """Get directory for a specific user"""
        user_dir = os.path.join(self.base_path, user_id)
        Path(user_dir).mkdir(exist_ok=True)
        return user_dir
        
    def log_attendance(self, user_id, rfid_id, face_image=None, device_id=None, status="SUCCESS"):
        """
        Log a user attendance event and save face image
        
        Args:
            user_id: User identifier (name)
            rfid_id: RFID card ID
            face_image: Face image as numpy array (optional)
            device_id: Device identifier (default=from config)
            status: Status of verification (SUCCESS or FAILED)
            
        Returns:
            dict: Attendance record information
        """
        # Use device_id from parameter or from config
        device_id = device_id or self.device_id
        
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
            "deviceId": device_id,
            "userId": user_id,
            "RFID_ID": rfid_id,
            "CheckIn": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "CheckInFace": image_path if image_path else "No image saved"
        }
        
        # Chỉ hiển thị JSON đơn giản, không có phần trang trí
        print(json.dumps(attendance_record, indent=2, ensure_ascii=False), flush=True)
        
        return attendance_record
        
    def save_log_to_file(self, attendance_record, log_dir=None):
        """
        Lưu attendance_record vào file JSON
        
        Args:
            attendance_record: Thông tin điểm danh
            log_dir: Thư mục lưu trữ log (mặc định: data/logs)
        
        Returns:
            str: Đường dẫn tới file log
        """
        if log_dir is None:
            log_dir = os.path.join(self.base_path, "../logs")
            
        Path(log_dir).mkdir(parents=True, exist_ok=True)
        
        # Tạo tên file theo ngày
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        log_file = os.path.join(log_dir, f"attendance_{today}.json")
        
        # Đọc log hiện tại nếu đã tồn tại
        logs = []
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    logs = json.load(f)
            except:
                logs = []
        
        # Thêm log mới
        logs.append(attendance_record)
        
        # Ghi lại vào file
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(logs, indent=2, ensure_ascii=False, fp=f)
            
        return log_file 
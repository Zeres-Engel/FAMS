import os
import json
import datetime
from pathlib import Path
import sys

# Add project root to Python path
project_root = str(Path(__file__).parent.parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from utils.config_utils import config

class RFIDLogger:
    """
    Logger chuyên dụng cho việc ghi nhận thao tác RFID.
    Theo dõi các lần quẹt thẻ RFID và kết quả xác thực.
    """
    
    def __init__(self, log_dir=None):
        """
        Initialize the RFID logger
        
        Args:
            log_dir: Thư mục lưu trữ log (mặc định: data/logs/rfid)
        """
        if log_dir is None:
            base_dir = getattr(config.data, 'attendance_dir', 'data/attendance')
            self.log_dir = os.path.join(os.path.dirname(base_dir), "logs", "rfid")
        else:
            self.log_dir = log_dir
            
        self.classroom_id = config.logging.classroom_id if hasattr(config, 'logging') else 1
        self._ensure_directories()
        
    def _ensure_directories(self):
        """Ensure necessary directories exist"""
        Path(self.log_dir).mkdir(parents=True, exist_ok=True)
        
    def log_rfid_scan(self, rfid_id, registered_name="Unknown"):
        """
        Ghi nhận lần quẹt thẻ RFID
        
        Args:
            rfid_id: ID của thẻ RFID
            registered_name: Tên người đăng ký của thẻ RFID
            
        Returns:
            dict: Thông tin quẹt thẻ
        """
        timestamp = datetime.datetime.now()
        
        rfid_scan_info = {
            "event_type": "RFID_SCAN",
            "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "RFID_ID": rfid_id,
            "registered_name": registered_name,
            "classroomId": self.classroom_id
        }
        
        # Lưu vào file
        self._save_to_file(rfid_scan_info)
        
        return rfid_scan_info
        
    def log_verification_result(self, rfid_id, face_name, is_match, face_score, is_live_face=True):
        """
        Ghi nhận kết quả xác thực
        
        Args:
            rfid_id: ID của thẻ RFID
            face_name: Tên người được nhận diện
            is_match: Kết quả xác thực (True/False)
            face_score: Điểm tương đồng của khuôn mặt
            is_live_face: Kết quả anti-spoofing
            
        Returns:
            dict: Thông tin kết quả xác thực
        """
        timestamp = datetime.datetime.now()
        
        verification_info = {
            "event_type": "VERIFICATION",
            "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "RFID_ID": rfid_id,
            "face_name": face_name,
            "is_match": is_match,
            "face_score": face_score,
            "is_live_face": is_live_face,
            "classroomId": self.classroom_id
        }
        
        # Lưu vào file
        self._save_to_file(verification_info)
        
        return verification_info
    
    def _save_to_file(self, log_data):
        """
        Lưu log vào file JSON
        
        Args:
            log_data: Dữ liệu log cần lưu
            
        Returns:
            str: Đường dẫn tới file log
        """
        # Tạo tên file theo ngày
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        log_file = os.path.join(self.log_dir, f"rfid_{today}.json")
        
        # Đọc log hiện tại nếu đã tồn tại
        logs = []
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    logs = json.load(f)
            except:
                logs = []
        
        # Thêm log mới
        logs.append(log_data)
        
        # Ghi lại vào file
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(logs, indent=2, ensure_ascii=False, fp=f)
            
        return log_file 
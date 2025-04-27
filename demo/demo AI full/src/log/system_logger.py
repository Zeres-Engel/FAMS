import os
import json
import datetime
import logging
from pathlib import Path
import sys

# Add project root to Python path
project_root = str(Path(__file__).parent.parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from utils.config_utils import config

class SystemLogger:
    """
    Logger cho hệ thống, ghi lại các thông báo hệ thống và lỗi.
    """
    
    # Class variable to track if logger has been initialized
    _logger_initialized = False
    
    def __init__(self, log_dir=None, log_level=logging.INFO):
        """
        Initialize the system logger
        
        Args:
            log_dir: Thư mục lưu trữ log (mặc định: data/logs/system)
            log_level: Mức độ log (mặc định: INFO)
        """
        if log_dir is None:
            base_dir = getattr(config.data, 'attendance_dir', 'data/attendance')
            self.log_dir = os.path.join(os.path.dirname(base_dir), "logs", "system")
        else:
            self.log_dir = log_dir
            
        self._ensure_directories()
        
        # Setup Python logger
        self.logger = logging.getLogger("zensys")
        
        # Only configure the logger once to prevent duplicate logs
        if not SystemLogger._logger_initialized:
            self.logger.setLevel(log_level)
            
            # Remove existing handlers if any
            while self.logger.handlers:
                self.logger.handlers.pop()
            
            # Tạo file handler
            today = datetime.datetime.now().strftime("%Y-%m-%d")
            log_file = os.path.join(self.log_dir, f"system_{today}.log")
            
            file_handler = logging.FileHandler(log_file, encoding='utf-8')
            file_handler.setLevel(log_level)
            
            # Tạo console handler
            console_handler = logging.StreamHandler()
            console_handler.setLevel(log_level)
            
            # Định dạng log
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            file_handler.setFormatter(formatter)
            console_handler.setFormatter(formatter)
            
            # Thêm handlers
            self.logger.addHandler(file_handler)
            self.logger.addHandler(console_handler)
            
            # Mark the logger as initialized
            SystemLogger._logger_initialized = True
        
    def _ensure_directories(self):
        """Ensure necessary directories exist"""
        Path(self.log_dir).mkdir(parents=True, exist_ok=True)
        
    def info(self, message):
        """Log thông tin"""
        self.logger.info(message)
        
    def warning(self, message):
        """Log cảnh báo"""
        self.logger.warning(message)
        
    def error(self, message):
        """Log lỗi"""
        self.logger.error(message)
        
    def debug(self, message):
        """Log debug"""
        self.logger.debug(message)
        
    def log_system_event(self, event_type, details=None):
        """
        Ghi nhận sự kiện hệ thống (khởi động, tắt, ...)
        
        Args:
            event_type: Loại sự kiện (startup, shutdown, ...)
            details: Chi tiết bổ sung
            
        Returns:
            dict: Thông tin sự kiện
        """
        timestamp = datetime.datetime.now()
        
        event_info = {
            "event_type": event_type,
            "timestamp": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "details": details or {}
        }
        
        # Log thông tin
        self.info(f"System event: {event_type} - {json.dumps(details or {})}")
        
        return event_info 
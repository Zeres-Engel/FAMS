import time
import os
from datetime import datetime
from src.log.attendance_logger import AttendanceLogger
from src.core.zensys_factory import get_attendance_service, get_message_manager

class AttendanceManager:
    """
    Quản lý điểm danh và ghi log
    """
    
    def __init__(self):
        """
        Khởi tạo Attendance Manager
        """
        self.attendance_logger = AttendanceLogger()
        self.last_log_time = 0  # Thời gian log cuối cùng để tránh log quá nhiều lần
        self.device_id = int(os.getenv('DEVICE_ID', '1'))
    
    def log_attendance(self, user_id, rfid_id, face_image, status="SUCCESS"):
        """
        Ghi log điểm danh
        
        Args:
            user_id: ID của người dùng (thường là tên)
            rfid_id: ID của thẻ RFID
            face_image: Ảnh khuôn mặt đã crop
            status: Trạng thái ("SUCCESS" hoặc "FAILED")
            
        Returns:
            dict: Kết quả ghi log
        """
        # Cập nhật thời gian log cuối
        self.last_log_time = time.time()
        
        # Ghi log điểm danh
        attendance_result = self.attendance_logger.log_attendance(
            user_id=user_id,
            rfid_id=rfid_id,
            face_image=face_image,
            status=status
        )
        
        # Chỉ gửi dữ liệu nếu điểm danh thành công
        if status == "SUCCESS" and attendance_result:
            self._send_attendance_data(attendance_result)
        
        return attendance_result
    
    def _send_attendance_data(self, attendance_data):
        """
        Gửi dữ liệu điểm danh đến API và Kafka
        
        Args:
            attendance_data: Dữ liệu điểm danh
        """
        try:
            # Lấy đường dẫn lưu ảnh khuôn mặt
            check_in_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            
            # Tạo dữ liệu để gửi
            api_data = {
                "deviceId": self.device_id,
                "userId": attendance_data.get("userId"),
                "RFID_ID": attendance_data.get("RFID_ID"),
                "CheckIn": check_in_time,
                "CheckInFace": attendance_data.get("CheckInFace", "")
            }
            
            # Gửi dữ liệu đến API
            attendance_service = get_attendance_service()
            api_result = attendance_service.send_attendance(api_data)
            
            # Gửi dữ liệu đến Kafka
            message_manager = get_message_manager()
            message_manager.send_attendance_event(api_data)
            
            # Ghi log kết quả gửi API
            if not api_result.success:
                print(f"Failed to send attendance data: {api_result.message}")
                
        except Exception as e:
            print(f"Error sending attendance data: {str(e)}")
    
    def get_attendance_history(self, user_id, from_date=None, to_date=None):
        """
        Lấy lịch sử điểm danh từ API
        
        Args:
            user_id: ID của người dùng
            from_date: Ngày bắt đầu (định dạng YYYY-MM-DD)
            to_date: Ngày kết thúc (định dạng YYYY-MM-DD)
            
        Returns:
            Result: Kết quả truy vấn
        """
        attendance_service = get_attendance_service()
        return attendance_service.get_attendance_history(
            user_id=user_id,
            from_date=from_date,
            to_date=to_date
        )
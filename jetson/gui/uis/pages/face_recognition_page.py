from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel, QFrame
from PySide6.QtCore import Qt

from gui.widgets.py_face_recognition import FaceRecognitionWidget
from gui.widgets.py_notification_popup import NotificationPopup

class FaceRecognitionPage(QWidget):
    def __init__(self):
        super().__init__()
        
        # SET LAYOUT
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(0, 0, 0, 0)
        self.layout.setSpacing(0)
        
        # CREATE ZENSYS FACE RECOGNITION WIDGET
        self.face_widget = FaceRecognitionWidget()
        
        # CREATE NOTIFICATION POPUP
        self.notification = NotificationPopup(self)
        
        # ADD WIDGET TO LAYOUT
        self.layout.addWidget(self.face_widget)
        
        # CONNECT SIGNALS
        self.setup_connections()
    
    def setup_connections(self):
        """Kết nối signals với slots"""
        # Kết nối callback từ FaceRecognitionWidget
        self.face_widget.verification_complete.connect(self.show_verification_result)
    
    def show_verification_result(self, result):
        """Hiển thị kết quả xác thực bằng popup"""
        # Kiểm tra kết quả xác thực
        if not result:
            return
        
        is_match = result.get("match", False)
        rfid_id = result.get("rfid_id", "")
        face_name = result.get("face_name", "Unknown")
        match_score = result.get("match_score", 0)
        
        # Lấy thời gian hiện tại
        from datetime import datetime
        current_time = datetime.now().strftime("%H:%M:%S - %d/%m/%Y")
        
        if is_match:
            title = "✅ XÁC THỰC THÀNH CÔNG"
            info_text = f"ID: {rfid_id}\nTên: {face_name}\nĐiểm số: {match_score:.2f}\nThời gian: {current_time}"
            self.notification.show_popup(title, info_text, True)
        else:
            title = "❌ XÁC THỰC THẤT BẠI"
            info_text = f"ID: {rfid_id}\nKhuôn mặt không khớp với người dùng\nĐiểm số: {match_score:.2f}\nThời gian: {current_time}"
            self.notification.show_popup(title, info_text, False) 
from model.RFID.rfid import RFID
from src.log.rfid_logger import RFIDLogger

class RFIDManager:
    """
    Quản lý chức năng RFID
    """
    
    def __init__(self, debug_mode=True, show_keys=False):
        """
        Khởi tạo RFID Manager
        
        Args:
            debug_mode: Bật chế độ debug cho RFID
            show_keys: Hiển thị từng phím được nhấn (mặc định False)
        """
        self.rfid_system = RFID()
        self.rfid_logger = RFIDLogger()
        self.current_rfid = None
        self.rfid_changed_callback = None
        
        # Bật chế độ debug nhưng không hiển thị từng phím
        if debug_mode:
            self.rfid_system.enable_debug(True, show_keys)
    
    def start_listening(self):
        """
        Bắt đầu lắng nghe RFID
        """
        self.rfid_system.set_callback(self.on_rfid_scanned)
        self.rfid_system.start_listening()
        print("RFID Manager started listening for cards")
    
    def stop_listening(self):
        """
        Dừng lắng nghe RFID
        """
        self.rfid_system.stop_listening()
        print("RFID Manager stopped listening")
    
    def set_rfid_changed_callback(self, callback):
        """
        Đặt callback khi RFID thay đổi để cập nhật UI
        
        Args:
            callback: Hàm callback(rfid_id, rfid_name)
        """
        self.rfid_changed_callback = callback
        print("RFID change callback registered")
    
    def on_rfid_scanned(self, rfid_id):
        """
        Callback khi RFID được quét
        
        Args:
            rfid_id: ID của thẻ RFID
        """
        # Lưu RFID hiện tại
        old_rfid = self.current_rfid
        self.current_rfid = rfid_id
        
        # Log sự kiện quẹt thẻ RFID
        rfid_name = self.rfid_system.get_name_from_id(rfid_id)
        self.rfid_logger.log_rfid_scan(rfid_id, rfid_name)
        
        print(f"RFID MANAGER: New card detected - ID: {rfid_id}, Name: {rfid_name}")
        
        # Gọi callback nếu có để cập nhật UI
        if self.rfid_changed_callback:
            try:
                self.rfid_changed_callback(rfid_id, rfid_name)
                print("UI update callback executed")
            except Exception as e:
                print(f"Error in RFID UI callback: {e}")
    
    def verify_identity(self, rfid_id, face_name):
        """
        Xác thực danh tính giữa RFID và khuôn mặt
        
        Args:
            rfid_id: ID của thẻ RFID
            face_name: Tên được nhận diện từ khuôn mặt
            
        Returns:
            dict: Kết quả xác thực
        """
        print(f"Verifying identity - RFID: {rfid_id}, Face: {face_name}")
        return self.rfid_system.verify_identity(rfid_id, face_name)
    
    def log_verification_result(self, rfid_id, face_name, is_match, score, is_live_face):
        """
        Ghi log kết quả xác thực
        
        Args:
            rfid_id: ID của thẻ RFID
            face_name: Tên được nhận diện từ khuôn mặt
            is_match: Có khớp không
            score: Điểm tương đồng
            is_live_face: Có phải khuôn mặt thật không
        """
        print(f"Logging verification - Match: {is_match}, Score: {score:.2f}, Live: {is_live_face}")
        self.rfid_logger.log_verification_result(
            rfid_id,
            face_name,
            is_match,
            float(score),
            is_live_face
        )
        
    def clear_current_rfid(self):
        """
        Xóa RFID hiện tại sau khi xử lý xong
        """
        self.current_rfid = None
        print("Current RFID cleared") 
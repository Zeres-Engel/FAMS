import numpy as np
from model.FaceAnti.face_anti import FaceAntiSpoofing

class AntiSpoofingManager:
    """
    Quản lý chức năng chống giả mạo khuôn mặt
    """
    
    def __init__(self):
        """
        Khởi tạo Anti-Spoofing Manager
        """
        self.face_anti = FaceAntiSpoofing()
        self.depth_face_crop = None
        self.anti_spoofing_result = None
        self.depth_variance = None
        self.mean_gradient = None
        self.min_depth = None
        self.max_depth = None
        self.depth_range = None
        self.criteria_status = None
    
    def process_depth_anti_spoofing(self, depth_map, face):
        """
        Xử lý depth map cho face anti-spoofing
        
        Args:
            depth_map: Bản đồ độ sâu
            face: Đối tượng Face cần kiểm tra
            
        Returns:
            dict: Kết quả anti-spoofing hoặc None nếu không thể xử lý
        """
        if depth_map is None or face is None:
            return None
            
        # Sử dụng face_anti để xử lý depth map
        result = self.face_anti.process_depth_map(depth_map, face.bbox)
        
        if result is not None:
            # Lưu depth face crop và kết quả anti-spoofing
            self.depth_face_crop = result["depth_visualization"]
            self.anti_spoofing_result = result["detection_result"]
            
            # Lưu các giá trị thống kê
            if "depth_variance" in result:
                self.depth_variance = result["depth_variance"]
            if "mean_gradient" in result:
                self.mean_gradient = result["mean_gradient"]
            if "min_depth" in result:
                self.min_depth = result["min_depth"]
            if "max_depth" in result:
                self.max_depth = result["max_depth"]
            if "depth_range" in result:
                self.depth_range = result["depth_range"]
            if "criteria_status" in result:
                self.criteria_status = result["criteria_status"]
            
        return result
    
    def is_live_face(self):
        """
        Kiểm tra xem khuôn mặt có phải là thật hay không
        
        Returns:
            bool: True nếu là khuôn mặt thật, False nếu là giả mạo hoặc chưa xác định
        """
        if self.face_anti.enable and self.anti_spoofing_result is not None:
            return self.anti_spoofing_result == "LIVE"
        return True  # Mặc định trả về True nếu không bật anti-spoofing 
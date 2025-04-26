import numpy as np
from model.MiDaS.DepthModel import DepthPredictor

class DepthManager:
    """
    Quản lý ước lượng độ sâu sử dụng MiDaS
    """
    
    def __init__(self, model_type="DPT_Large"):
        """
        Khởi tạo Depth Manager
        
        Args:
            model_type: Loại mô hình depth MiDaS ("DPT_Large", "DPT_Hybrid", v.v.)
        """
        self.depth_predictor = DepthPredictor(model_type=model_type)
        self.last_depth_map = None
        self.last_colored_depth = None
    
    def predict_depth(self, image):
        """
        Dự đoán bản đồ độ sâu từ ảnh
        
        Args:
            image: Ảnh đầu vào dạng numpy array
            
        Returns:
            dict: Kết quả dự đoán độ sâu với các trường:
                - depth_map: Bản đồ độ sâu gốc
                - colored_depth: Biểu diễn bản đồ độ sâu dưới dạng màu sắc
        """
        depth_result = self.depth_predictor.predict_depth(image)
        
        # Lưu kết quả cuối cùng
        if 'depth_map' in depth_result:
            self.last_depth_map = depth_result['depth_map'] 
        if 'colored_depth' in depth_result:
            self.last_colored_depth = depth_result['colored_depth']
            
        return depth_result 
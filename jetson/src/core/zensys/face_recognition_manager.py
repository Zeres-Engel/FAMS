import numpy as np
from src.core.zen_face import ZenFace
from src.core.faiss_manager import FaceDatabase

class FaceRecognitionManager:
    """
    Quản lý nhận diện khuôn mặt sử dụng ZenFace và FAISS
    """
    
    def __init__(self, ctx_id=0):
        """
        Khởi tạo Face Recognition Manager
        
        Args:
            ctx_id: Context ID cho thiết bị tính toán (GPU ID)
        """
        # Khởi tạo ZenFace
        self.face_analyzer = ZenFace(allowed_modules=['detection', 'recognition'])
        self.face_analyzer.prepare(ctx_id=ctx_id)
        
        # Khởi tạo Face Database
        self.face_db = FaceDatabase()
        
    def initialize_database(self):
        """
        Đảm bảo database được tải hoặc khởi tạo
        
        Returns:
            bool: True nếu database đã sẵn sàng
        """
        return self.face_db.ensure_database(self.face_analyzer)
    
    def detect_faces(self, image, max_num=0):
        """
        Phát hiện khuôn mặt từ ảnh
        
        Args:
            image: Ảnh đầu vào dạng numpy array
            max_num: Số lượng khuôn mặt tối đa (0 = không giới hạn)
            
        Returns:
            list: Danh sách các đối tượng Face
        """
        return self.face_analyzer.get(image, max_num=max_num)
    
    def recognize_face(self, face_embedding, threshold=None):
        """
        Nhận diện khuôn mặt từ embedding
        
        Args:
            face_embedding: Vector embedding khuôn mặt
            threshold: Ngưỡng nhận diện
            
        Returns:
            tuple: (name, score) - Tên người và độ tương đồng
        """
        return self.face_db.recognize_face(face_embedding, threshold) 
import numpy as np

class Face:
    """
    Đại diện cho một khuôn mặt được phát hiện.
    Chứa các thông tin như:
    - Bounding box (bbox)
    - Landmarks (kps)
    - Điểm nhận diện (det_score)
    - Embedding vector
    """
    
    def __init__(self, bbox=None, kps=None, det_score=None, embedding=None):
        """
        Khởi tạo đối tượng Face
        
        Args:
            bbox: Tọa độ bounding box [x1, y1, x2, y2]
            kps: Landmarks, các điểm đặc trưng trên khuôn mặt
            det_score: Điểm nhận diện
            embedding: Vector embedding
        """
        self.bbox = bbox
        self.kps = kps
        self.det_score = det_score
        self.embedding = embedding
        self.img = None  # Lưu ảnh gốc để sử dụng khi cắt khuôn mặt
        
    @property
    def normed_embedding(self):
        """
        Trả về embedding đã được normalize
        """
        if self.embedding is None:
            return None
            
        # L2 normalize embedding
        norm = np.linalg.norm(self.embedding)
        if norm == 0:
            return self.embedding
        return self.embedding / norm
        
    def get_area(self):
        """
        Tính diện tích bounding box
        
        Returns:
            float: Diện tích bounding box
        """
        if self.bbox is None:
            return 0
            
        width = self.bbox[2] - self.bbox[0]
        height = self.bbox[3] - self.bbox[1]
        return width * height
        
    def get_center(self):
        """
        Trả về tọa độ trung tâm của khuôn mặt
        
        Returns:
            tuple: (cx, cy) - tọa độ trung tâm
        """
        if self.bbox is None:
            return (0, 0)
            
        cx = (self.bbox[0] + self.bbox[2]) / 2
        cy = (self.bbox[1] + self.bbox[3]) / 2
        return (cx, cy) 
import onnxruntime
import numpy as np

from model.model_loader_onnx import model_zoo
from utils.config_utils import config
from src.core.zen_face.face_operator import Face

class ZenFace:
    """
    Pipeline ZenFace để thực hiện face detection và recognition.
    """
    
    def __init__(self, allowed_modules=None, **kwargs):
        """
        Khởi tạo ZenFace pipeline với các modules được chỉ định.
        
        Args:
            allowed_modules: List các modules cần kích hoạt ['detection', 'recognition']
            **kwargs: Các tham số bổ sung
        """
        onnxruntime.set_default_logger_severity(3)
        self.models = {}
        
        # Load models từ config
        if allowed_modules and 'detection' in allowed_modules:
            det_model = model_zoo.get_model(config.detection_model)
            if det_model is not None:
                self.models['detection'] = det_model
                print(f"Loaded detection model from: {config.detection_model}")
            else:
                raise FileNotFoundError(f"Detection model not found at {config.detection_model}")
        
        if allowed_modules and 'recognition' in allowed_modules:
            rec_model = model_zoo.get_model(config.recognition_model)
            if rec_model is not None:
                self.models['recognition'] = rec_model
                print(f"Loaded recognition model from: {config.recognition_model}")
            else:
                raise FileNotFoundError(f"Recognition model not found at {config.recognition_model}")
                
        assert 'detection' in self.models, "Detection model is required"
        self.det_model = self.models['detection']

    def prepare(self, ctx_id, det_thresh=None, det_size=None):
        """
        Chuẩn bị các models với các tham số cần thiết.
        
        Args:
            ctx_id: Context ID cho thiết bị tính toán (GPU ID)
            det_thresh: Ngưỡng cho detection model
            det_size: Kích thước đầu vào cho detection model
        """
        self.det_thresh = det_thresh or config.det_threshold
        self.det_size = det_size or config.det_size
        print('set det-size:', self.det_size)
        
        for taskname, model in self.models.items():
            if taskname == 'detection':
                model.prepare(ctx_id, input_size=self.det_size, det_thresh=self.det_thresh)
            else:
                model.prepare(ctx_id)

    def get(self, img, max_num=0):
        """
        Thực hiện face detection và recognition trên ảnh đầu vào.
        
        Quy trình:
        1. Detect khuôn mặt bằng RetinaFace (bbox + keypoints)
        2. Chỉ xử lý khuôn mặt lớn nhất (diện tích bbox lớn nhất)
        3. Thực hiện recognition nếu cần
        
        Args:
            img: Ảnh đầu vào dạng numpy array
            max_num: Số lượng khuôn mặt tối đa cần phát hiện (0 = không giới hạn)
        
        Returns:
            List các đối tượng Face, hoặc danh sách rỗng nếu không phát hiện được mặt nào
        """
        # Bước 1: Face Detection - Sử dụng RetinaFace để phát hiện khuôn mặt
        bboxes, kpss = self.det_model.detect(img, max_num=max_num, metric='default')
        
        # Nếu không phát hiện được khuôn mặt nào
        if bboxes.shape[0] == 0:
            return []
        
        # Chỉ xử lý khuôn mặt lớn nhất (area của bbox lớn nhất)
        if bboxes.shape[0] > 1:
            # Tính diện tích các bbox
            areas = []
            for i in range(bboxes.shape[0]):
                bbox = bboxes[i, 0:4]
                area = (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])
                areas.append(area)
            
            # Lấy index của bbox lớn nhất
            largest_idx = np.argmax(areas)
            
            # Chỉ giữ lại bbox lớn nhất
            bbox = bboxes[largest_idx, 0:4]
            det_score = bboxes[largest_idx, 4]
            kps = None if kpss is None else kpss[largest_idx]
            
            # Tạo đối tượng Face với thông tin từ detection
            face = Face(bbox=bbox, kps=kps, det_score=det_score)
            face.img = img  # Lưu ảnh gốc để sử dụng khi cần
            
            # Thực hiện recognition nếu cần
            for taskname, model in self.models.items():
                if taskname == 'detection':
                    continue
                model.get(img, face)
                
            return [face]  # Trả về list chỉ chứa khuôn mặt lớn nhất
        else:
            # Nếu chỉ có 1 khuôn mặt, xử lý như bình thường
            bbox = bboxes[0, 0:4]
            det_score = bboxes[0, 4]
            kps = None if kpss is None else kpss[0]
            
            # Tạo đối tượng Face với thông tin từ detection
            face = Face(bbox=bbox, kps=kps, det_score=det_score)
            face.img = img  # Lưu ảnh gốc để sử dụng khi cần
            
            # Thực hiện recognition nếu cần
            for taskname, model in self.models.items():
                if taskname == 'detection':
                    continue
                model.get(img, face)
                
            return [face]  # Trả về list chỉ chứa khuôn mặt duy nhất 
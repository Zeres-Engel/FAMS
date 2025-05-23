import numpy as np
import cv2
import os
from model.MiDaS.DepthModel import DepthPredictor
from pathlib import Path
import torch

class DepthManager:
    """
    Quản lý ước lượng độ sâu sử dụng MiDaS và tích hợp với check-in
    """
    
    def __init__(self, model_type="MidasSmall", custom_model_path=None):
        """
        Khởi tạo Depth Manager
        
        Args:
            model_type: Loại mô hình depth MiDaS ("DPT_Large", "DPT_Hybrid", "MidasSmall", hoặc "Custom")
            custom_model_path: Đường dẫn tùy chỉnh đến mô hình, nếu model_type là "Custom"
        """
        # Cấu hình sử dụng repo local
        weights_dir = str(Path(os.getcwd()) / 'assets' / 'weights')
        os.environ['TORCH_HOME'] = weights_dir
        torch.hub.set_dir(weights_dir)
        
        # Kiểm tra file checkpoint có tồn tại không
        checkpoint_path = Path(weights_dir) / "checkpoints" / "midas_v21_small_256.pt"
        model_exists = os.path.exists(checkpoint_path)
        
        # Nếu cố gắng sử dụng custom model
        if model_type == "Custom":
            if model_exists:
                print(f"Sử dụng checkpoint MiDaS từ: {checkpoint_path}")
                model_path = str(checkpoint_path)
                # Chỉ định model_type là "MidasSmall" thay vì "Custom" để tránh lỗi
                self.depth_predictor = DepthPredictor(model_type="MidasSmall", model_path=model_path)
            else:
                print(f"Không tìm thấy checkpoint tại {checkpoint_path}, sử dụng MidasSmall từ hub")
                self.depth_predictor = DepthPredictor(model_type="MidasSmall")
        # Nếu không chỉ định đường dẫn tùy chỉnh nhưng model_type là "Custom", sử dụng mô hình mặc định
        elif model_type == "MidasSmall" and model_exists:
            print(f"Sử dụng local checkpoint MiDaS Small từ: {checkpoint_path}")
            model_path = str(checkpoint_path)
            self.depth_predictor = DepthPredictor(model_type="MidasSmall", model_path=model_path)
        else:
            # Khởi tạo predictor với kiểu mô hình và path tùy chỉnh (nếu có)
            self.depth_predictor = DepthPredictor(model_type=model_type, model_path=custom_model_path)
            
        self.last_depth_map = None
        self.last_colored_depth = None
        self.last_raw_depth = None
        
        # Ngưỡng phát hiện liveness từ depth map
        self.depth_variance_threshold = 5000.0
        self.depth_range_threshold = 30.0
        self.min_depth_threshold = 50.0
        self.max_depth_threshold = 200.0
    
    def predict_depth(self, image):
        """
        Dự đoán bản đồ độ sâu từ ảnh
        
        Args:
            image: Ảnh đầu vào dạng numpy array
            
        Returns:
            dict: Kết quả dự đoán độ sâu với các trường:
                - depth_map: Bản đồ độ sâu gốc
                - colored_depth: Biểu diễn bản đồ độ sâu dưới dạng màu sắc
                - raw_depth: Dữ liệu độ sâu thô
                - depth_metrics: Các chỉ số đánh giá từ depth map (nếu tính toán)
        """
        depth_result = self.depth_predictor.predict_depth(image)
        
        # Lưu kết quả cuối cùng
        if 'depth_map' in depth_result:
            self.last_depth_map = depth_result['depth_map'] 
        if 'colored_depth' in depth_result:
            self.last_colored_depth = depth_result['colored_depth']
        if 'raw_depth' in depth_result:
            self.last_raw_depth = depth_result['raw_depth']
            
        return depth_result
    
    def get_depth_metrics(self, face_region=None):
        """
        Tính toán các chỉ số từ bản đồ độ sâu, có thể giới hạn trong vùng khuôn mặt
        
        Args:
            face_region: Tuple (x1, y1, x2, y2) xác định vùng khuôn mặt, hoặc None để xử lý toàn bộ ảnh
            
        Returns:
            dict: Các chỉ số đánh giá từ depth map
        """
        if self.last_raw_depth is None:
            return None
            
        # Tạo mask nếu có face_region
        if face_region is not None:
            x1, y1, x2, y2 = face_region
            # Đảm bảo tọa độ nằm trong giới hạn của ảnh
            h, w = self.last_raw_depth.shape
            x1 = max(0, min(x1, w-1))
            y1 = max(0, min(y1, h-1))
            x2 = max(0, min(x2, w-1))
            y2 = max(0, min(y2, h-1))
            
            # Trích xuất vùng khuôn mặt từ depth map
            depth_face = self.last_raw_depth[y1:y2, x1:x2]
        else:
            depth_face = self.last_raw_depth
            
        # Tính toán các chỉ số
        metrics = {
            'min_depth': float(np.min(depth_face)),
            'max_depth': float(np.max(depth_face)),
            'mean_depth': float(np.mean(depth_face)),
            'median_depth': float(np.median(depth_face)),
            'std_depth': float(np.std(depth_face)),
            'variance': float(np.var(depth_face)),
            'depth_range': float(np.max(depth_face) - np.min(depth_face))
        }
        
        # Tính toán gradient để phát hiện biên
        if face_region is not None and depth_face.size > 0:
            try:
                # Tính Sobel gradient
                sobelx = cv2.Sobel(depth_face, cv2.CV_64F, 1, 0, ksize=3)
                sobely = cv2.Sobel(depth_face, cv2.CV_64F, 0, 1, ksize=3)
                gradient_magnitude = np.sqrt(sobelx**2 + sobely**2)
                metrics['mean_gradient'] = float(np.mean(gradient_magnitude))
                metrics['max_gradient'] = float(np.max(gradient_magnitude))
            except Exception as e:
                print(f"Error calculating depth gradients: {e}")
                metrics['mean_gradient'] = 0.0
                metrics['max_gradient'] = 0.0
            
        return metrics
    
    def extract_face_depth_for_checkin(self, face_region):
        """
        Trích xuất thông tin độ sâu của khuôn mặt để tích hợp với quá trình check-in
        
        Args:
            face_region: Tuple (x1, y1, x2, y2) xác định vùng khuôn mặt
            
        Returns:
            dict: Thông tin độ sâu của khuôn mặt cho quá trình check-in
        """
        # Tính toán các chỉ số depth cho khuôn mặt
        depth_metrics = self.get_depth_metrics(face_region)
        
        if depth_metrics is None:
            return {
                'status': 'failed',
                'message': 'No depth map available'
            }
            
        # Trích xuất vùng khuôn mặt từ depth map có màu
        if self.last_colored_depth is not None and face_region is not None:
            x1, y1, x2, y2 = face_region
            h, w = self.last_colored_depth.shape[:2]
            x1 = max(0, min(x1, w-1))
            y1 = max(0, min(y1, h-1))
            x2 = max(0, min(x2, w-1))
            y2 = max(0, min(y2, h-1))
            
            depth_face_image = self.last_colored_depth[y1:y2, x1:x2]
        else:
            depth_face_image = None
            
        # Đánh giá liveness dựa trên các ngưỡng
        is_live = (
            depth_metrics['variance'] > self.depth_variance_threshold and
            depth_metrics['depth_range'] > self.depth_range_threshold and
            depth_metrics['min_depth'] > self.min_depth_threshold and
            depth_metrics['max_depth'] < self.max_depth_threshold
        )
            
        return {
            'status': 'success',
            'metrics': depth_metrics,
            'depth_face_image': depth_face_image,
            'is_live_face': is_live
        }
        
    def set_thresholds(self, variance_thresh=None, range_thresh=None, min_thresh=None, max_thresh=None):
        """
        Thiết lập các ngưỡng cho việc đánh giá liveness
        """
        if variance_thresh is not None:
            self.depth_variance_threshold = float(variance_thresh)
        if range_thresh is not None:
            self.depth_range_threshold = float(range_thresh)
        if min_thresh is not None:
            self.min_depth_threshold = float(min_thresh)
        if max_thresh is not None:
            self.max_depth_threshold = float(max_thresh) 
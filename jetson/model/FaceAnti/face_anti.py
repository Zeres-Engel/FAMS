import cv2
import numpy as np
from utils.config_utils import config
from types import SimpleNamespace

class FaceAntiSpoofing:
    def __init__(self, var_thresh=None, grad_thresh=None, normalize_method=None, 
                 depth_range_thresh=None, min_depth_thresh=None, max_depth_thresh=None,
                 enable=None):
        """
        Initialize face anti-spoofing detector with configurable thresholds.
        
        Args:
            var_thresh: Threshold for depth variance (default: from config)
            grad_thresh: Threshold for gradient magnitude (default: from config)
            normalize_method: Phương pháp chuẩn hóa ("min_max", "global", "local")
            depth_range_thresh: Ngưỡng khoảng cách giữa min và max depth
            min_depth_thresh: Ngưỡng tối thiểu cho điểm sâu nhất 
            max_depth_thresh: Ngưỡng tối đa cho điểm cao nhất
            enable: Bật/tắt tính năng anti-spoofing
        """
        # Lấy giá trị threshold từ config nếu không được cung cấp, hoặc sử dụng giá trị mặc định
        try:
            self.enable = enable if enable is not None else config.anti_spoofing.enable
            self.var_thresh = var_thresh if var_thresh is not None else config.anti_spoofing.var_thresh
            self.grad_thresh = grad_thresh if grad_thresh is not None else config.anti_spoofing.grad_thresh
            self.normalize_method = normalize_method if normalize_method is not None else config.anti_spoofing.normalize_method
            self.depth_range_thresh = depth_range_thresh if depth_range_thresh is not None else config.anti_spoofing.depth_range_thresh
            self.min_depth_thresh = min_depth_thresh if min_depth_thresh is not None else config.anti_spoofing.min_depth_thresh
            self.max_depth_thresh = max_depth_thresh if max_depth_thresh is not None else config.anti_spoofing.max_depth_thresh
        except AttributeError:
            # Nếu không có trong config, sử dụng giá trị mặc định
            self.enable = enable if enable is not None else True
            self.var_thresh = var_thresh if var_thresh is not None else 0.0005
            self.grad_thresh = grad_thresh if grad_thresh is not None else 0.7
            self.normalize_method = normalize_method if normalize_method is not None else "min_max"
            self.depth_range_thresh = depth_range_thresh if depth_range_thresh is not None else 30.0
            self.min_depth_thresh = min_depth_thresh if min_depth_thresh is not None else 50.0
            self.max_depth_thresh = max_depth_thresh if max_depth_thresh is not None else 200.0
            print(f"Warning: Using default thresholds for anti-spoofing")
        
        # Lưu trữ các giá trị min/max toàn cục cho phương pháp "global"
        self.global_min_depth = None
        self.global_max_depth = None
        
        print(f"Anti-spoofing feature is {'enabled' if self.enable else 'disabled'}")
    
    def normalize_depth_map(self, depth_map, min_depth=None, max_depth=None):
        """
        Chuẩn hóa depth map sử dụng các phương pháp khác nhau.
        
        Args:
            depth_map: Depth map cần chuẩn hóa
            min_depth: Giá trị nhỏ nhất (nếu None thì sử dụng giá trị nhỏ nhất trong depth map)
            max_depth: Giá trị lớn nhất (nếu None thì sử dụng giá trị lớn nhất trong depth map)
            
        Returns:
            Depth map đã được chuẩn hóa về dải [0, 1]
        """
        # Chuyển sang grayscale nếu là RGB
        if len(depth_map.shape) == 3:
            depth_gray = cv2.cvtColor(depth_map, cv2.COLOR_BGR2GRAY)
        else:
            depth_gray = depth_map.copy()
        
        # Chuẩn hóa dựa trên phương pháp đã chọn
        if self.normalize_method == "min_max":
            # Chuẩn hóa min-max dựa trên giá trị trong depth map hiện tại
            local_min = np.min(depth_gray)
            local_max = np.max(depth_gray)
            
            # Tránh trường hợp chia cho 0
            if local_max == local_min:
                return np.zeros_like(depth_gray, dtype=np.float32)
            
            # Chuẩn hóa về dải [0, 1]
            normalized = (depth_gray.astype(np.float32) - local_min) / (local_max - local_min)
            
        elif self.normalize_method == "global":
            # Cập nhật giá trị min/max toàn cục nếu chưa có
            if self.global_min_depth is None or self.global_max_depth is None:
                self.global_min_depth = np.min(depth_gray)
                self.global_max_depth = np.max(depth_gray)
            else:
                # Cập nhật giá trị min/max toàn cục theo thời gian
                self.global_min_depth = min(self.global_min_depth, np.min(depth_gray))
                self.global_max_depth = max(self.global_max_depth, np.max(depth_gray))
            
            # Tránh trường hợp chia cho 0
            if self.global_max_depth == self.global_min_depth:
                return np.zeros_like(depth_gray, dtype=np.float32)
            
            # Chuẩn hóa về dải [0, 1] sử dụng giá trị min/max toàn cục
            normalized = (depth_gray.astype(np.float32) - self.global_min_depth) / (self.global_max_depth - self.global_min_depth)
            
        elif self.normalize_method == "local":
            # Chuẩn hóa cục bộ sử dụng CLAHE (Contrast Limited Adaptive Histogram Equalization)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            normalized = clahe.apply(depth_gray)
            normalized = normalized.astype(np.float32) / 255.0
            
        else:
            # Mặc định: chuẩn hóa min-max đơn giản
            min_val = min_depth if min_depth is not None else np.min(depth_gray)
            max_val = max_depth if max_depth is not None else np.max(depth_gray)
            
            if max_val == min_val:
                return np.zeros_like(depth_gray, dtype=np.float32)
            
            normalized = (depth_gray.astype(np.float32) - min_val) / (max_val - min_val)
        
        return normalized
    
    def process_depth_map(self, depth_map, bbox):
        """
        Process depth map within the given bounding box for visualization and analysis.
        
        Args:
            depth_map: The depth map array
            bbox: Bounding box [x1, y1, x2, y2]
            
        Returns:
            Dictionary containing processed depth map and visualization
        """
        if depth_map is None or bbox is None:
            return None
            
        # Convert bbox to square using max dimension
        x1, y1, x2, y2 = [int(b) for b in bbox]
        width = x2 - x1
        height = y2 - y1
        max_side = max(width, height)
        
        # Calculate center point
        center_x = (x1 + x2) // 2
        center_y = (y1 + y2) // 2
        
        # Create square bbox with 10% expansion
        expansion = 0.1
        half_side = int(max_side * (1 + expansion) / 2)
        
        # Calculate new coordinates with bounds checking
        new_x1 = max(0, center_x - half_side)
        new_y1 = max(0, center_y - half_side)
        new_x2 = min(depth_map.shape[1], center_x + half_side)
        new_y2 = min(depth_map.shape[0], center_y + half_side)
        
        # Crop depth map
        depth_crop = depth_map[new_y1:new_y2, new_x1:new_x2].copy()
        
        # Process for visualization
        depth_vis = self.enhance_depth_visualization(depth_crop)
        
        # Process for anti-spoofing
        result, depth_stats = self.detect_spoofing(depth_crop)
        
        # Thêm thông tin vào kết quả trả về
        result_dict = {
            "depth_crop": depth_crop,
            "depth_visualization": depth_vis,
            "is_real": result == "live",
            "detection_result": result,
            **depth_stats  # Mở rộng dictionary với các thông số stats
        }
        
        return result_dict
    
    def enhance_depth_visualization(self, depth_crop):
        """
        Enhance depth map visualization by removing background
        """
        # Convert to grayscale if it's in RGB format
        if len(depth_crop.shape) == 3:
            depth_gray = cv2.cvtColor(depth_crop, cv2.COLOR_RGB2GRAY)
        else:
            depth_gray = depth_crop.copy()
            
        # Apply Gaussian blur to smooth
        depth_smooth = cv2.GaussianBlur(depth_gray, (5, 5), 0)
        
        # Calculate min, max, and average depth
        min_depth = np.min(depth_smooth)
        max_depth = np.max(depth_smooth)
        avg_depth = np.mean(depth_smooth)
        
        # Set all points below average to black (0)
        mask = depth_smooth < avg_depth
        depth_enhanced = depth_smooth.copy()
        depth_enhanced[mask] = 0
        
        # Chuẩn hóa cho việc hiển thị tốt hơn
        norm_depth = self.normalize_depth_map(depth_enhanced)
        depth_vis_uint8 = (norm_depth * 255).astype(np.uint8)
            
        # Convert back to color for visualization
        depth_vis = cv2.applyColorMap(depth_vis_uint8, cv2.COLORMAP_JET)
        
        return depth_vis
    
    def detect_spoofing(self, depth_crop):
        """
        Detect if a face is real or spoofed based on depth map analysis
        
        Returns:
            - result: "spoof" hoặc "live"
            - dict: từ điển chứa các giá trị thống kê
        """
        # Nếu tính năng anti-spoofing bị tắt, luôn trả về "live"
        if not self.enable:
            # Vẫn tính toán các giá trị thống kê để hiển thị, nhưng không dùng để phát hiện spoofing
            if len(depth_crop.shape) == 3:
                depth_gray = cv2.cvtColor(depth_crop, cv2.COLOR_BGR2GRAY)
            else:
                depth_gray = depth_crop.copy()
            
            # Lấy giá trị min/max thực tế của depth map
            raw_min_depth = float(np.min(depth_gray))
            raw_max_depth = float(np.max(depth_gray))
            raw_depth_range = raw_max_depth - raw_min_depth
                
            # Chuẩn hóa depth map sử dụng phương pháp đã chọn
            depth_norm = self.normalize_depth_map(depth_gray)
            
            # Chuyển về uint8 cho các bước xử lý tiếp theo
            depth_norm_uint8 = (depth_norm * 255).astype(np.uint8)
                
            # Apply Gaussian blur to smooth
            depth_smooth = cv2.GaussianBlur(depth_norm_uint8, (5, 5), 0)
            
            # Calculate depth variance
            depth_variance = float(np.var(depth_smooth))
            
            # Calculate gradient magnitude using Sobel filters
            grad_x = cv2.Sobel(depth_smooth, cv2.CV_64F, 1, 0, ksize=3)
            grad_y = cv2.Sobel(depth_smooth, cv2.CV_64F, 0, 1, ksize=3)
            grad_mag = np.sqrt(grad_x**2 + grad_y**2)
            mean_grad = float(np.mean(grad_mag))
            
            # Tất cả các tiêu chí đều pass vì anti-spoofing đã bị tắt
            criteria_status = {
                "variance_pass": True,
                "gradient_pass": True,
                "depth_range_pass": True,
                "min_depth_pass": True,
                "max_depth_pass": True
            }
            
            # Tạo từ điển với các giá trị thống kê (vẫn giữ để hiển thị)
            stats = {
                "depth_variance": depth_variance,
                "mean_gradient": mean_grad,
                "min_depth": raw_min_depth,
                "max_depth": raw_max_depth,
                "depth_range": raw_depth_range,
                "criteria_status": criteria_status
            }
            
            return "live", stats
            
        # Convert to grayscale if it's in RGB format
        if len(depth_crop.shape) == 3:
            depth_gray = cv2.cvtColor(depth_crop, cv2.COLOR_BGR2GRAY)
        else:
            depth_gray = depth_crop.copy()
        
        # Lấy giá trị min/max thực tế của depth map
        raw_min_depth = float(np.min(depth_gray))
        raw_max_depth = float(np.max(depth_gray))
        raw_depth_range = raw_max_depth - raw_min_depth
            
        # Chuẩn hóa depth map sử dụng phương pháp đã chọn
        depth_norm = self.normalize_depth_map(depth_gray)
        
        # Chuyển về uint8 cho các bước xử lý tiếp theo
        depth_norm_uint8 = (depth_norm * 255).astype(np.uint8)
            
        # Apply Gaussian blur to smooth
        depth_smooth = cv2.GaussianBlur(depth_norm_uint8, (5, 5), 0)
        
        # Calculate depth variance
        depth_variance = float(np.var(depth_smooth))
        
        # Calculate gradient magnitude using Sobel filters
        grad_x = cv2.Sobel(depth_smooth, cv2.CV_64F, 1, 0, ksize=3)
        grad_y = cv2.Sobel(depth_smooth, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = np.sqrt(grad_x**2 + grad_y**2)
        mean_grad = float(np.mean(grad_mag))
        
        # Trạng thái phát hiện cho từng tiêu chí (True = pass, False = spoof)
        criteria_status = {
            "variance_pass": depth_variance >= self.var_thresh,
            "gradient_pass": mean_grad >= self.grad_thresh,
            "depth_range_pass": raw_depth_range >= self.depth_range_thresh,
            "min_depth_pass": raw_min_depth >= self.min_depth_thresh,
            "max_depth_pass": raw_max_depth <= self.max_depth_thresh
        }
        
        # Nếu bất kỳ tiêu chí nào không đạt, phát hiện spoof
        is_live = all(criteria_status.values())
        
        result = "live" if is_live else "spoof"
        
        # Tạo từ điển với các giá trị thống kê
        stats = {
            "depth_variance": depth_variance,
            "mean_gradient": mean_grad,
            "min_depth": raw_min_depth,
            "max_depth": raw_max_depth,
            "depth_range": raw_depth_range,
            "criteria_status": criteria_status
        }
        
        return result, stats

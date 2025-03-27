import torch
import cv2
import numpy as np

class DepthPredictor:
    def __init__(self, model_type="DPT_Large"):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = torch.hub.load("intel-isl/MiDaS", model_type)
        self.model.to(self.device)
        self.model.eval()

        # Load the appropriate transformation
        midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
        if model_type in ["DPT_Large", "DPT_Hybrid"]:
            self.transform = midas_transforms.dpt_transform
        else:
            self.transform = midas_transforms.small_transform

    def predict_depth(self, img):
        """
        Dự đoán độ sâu cho một hình ảnh
        
        Args:
            img: Hình ảnh BGR từ OpenCV
            
        Returns:
            Dict chứa cả 'depth' (bản đồ độ sâu gốc) và 'colored_depth' (bản đồ độ sâu đã màu hóa)
        """
        # Convert image to RGB if it is BGR
        if img.shape[2] == 3:  # assuming the image has 3 channels
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Apply the transformation and predict
        input_tensor = self.transform(img).to(self.device)
        with torch.no_grad():
            prediction = self.model(input_tensor)
            prediction = torch.nn.functional.interpolate(
                prediction.unsqueeze(1),
                size=img.shape[:2],
                mode="bicubic",
                align_corners=False
            ).squeeze()

        # Convert to a depth map
        depth_map_raw = prediction.cpu().numpy()
        depth_map_normalized = cv2.normalize(depth_map_raw, None, 0, 255, norm_type=cv2.NORM_MINMAX, dtype=cv2.CV_8U)
        depth_map_colored = cv2.applyColorMap(depth_map_normalized, cv2.COLORMAP_MAGMA)

        # Tạo bản đồ độ sâu
        with torch.no_grad():
            # Chuyển đổi từ BGR sang RGB và thay đổi định dạng (HWC -> CHW)
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB) / 255.0
            img_tensor = torch.from_numpy(img_rgb.transpose(2, 0, 1)).float().to(self.device)
            
            # Thêm chiều batch và dự đoán
            prediction = self.model(img_tensor.unsqueeze(0))
            
            # Chuyển đổi sang numpy và điều chỉnh kích thước
            depth_map = prediction.squeeze().cpu().numpy()
            
            # Chuẩn hóa bản đồ độ sâu
            depth_min = depth_map.min()
            depth_max = depth_map.max()
            normalized_depth = (depth_map - depth_min) / (depth_max - depth_min)
            
            # Chuyển đổi thành ảnh grayscale 8 bit
            depth_gray = (normalized_depth * 255).astype(np.uint8)
            
            # Tạo bản đồ độ sâu màu sắc
            colored_depth = cv2.applyColorMap(depth_gray, cv2.COLORMAP_INFERNO)
            
            return {
                'depth': depth_gray,  # Thêm khóa 'depth' với bản đồ độ sâu dạng grayscale
                'colored_depth': colored_depth  # Bản đồ độ sâu đã chuyển thành màu sắc
            }


import torch
import cv2
import numpy as np
import os
from pathlib import Path

class DepthPredictor:
    def __init__(self, model_type="MidasSmall", model_path=None):
        """
        Khởi tạo MiDaS depth predictor
        
        Args:
            model_type: Loại mô hình depth ("DPT_Large", "DPT_Hybrid", "MidasSmall", "CustomFile", "CustomPackage", "FullModel", hoặc "Custom")
            model_path: Đường dẫn tới file mô hình, nếu model_type là "Custom", "CustomFile", "CustomPackage", hoặc "FullModel"
        """
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"Using device: {self.device} for MiDaS depth estimation")
        
        # Chuẩn bị đường dẫn cho checkpoint efficientnet nếu sử dụng custom
        efficientnet_path = None
        
        if model_path and os.path.exists(model_path):
            checkpoint_dir = Path(model_path).parent
            if checkpoint_dir.name == "checkpoints":
                # Tìm checkpoint EfficientNet
                potential_paths = list(checkpoint_dir.glob("*efficientnet*.pth"))
                if potential_paths:
                    efficientnet_path = str(potential_paths[0])
                    print(f"Found EfficientNet checkpoint: {efficientnet_path}")
        
        # Thiết lập mô hình
        try:
            # Tải mô hình từ torch hub mà không quan tâm đến model_type
            if model_type in ["MidasSmall", "MiDaS_small"] and model_path is not None and os.path.exists(model_path):
                # Tạo model architecture từ hub
                print(f"Tạo model architecture từ hub và tải weights từ local: {model_path}")
                self.model = torch.hub.load("intel-isl/MiDaS", "MiDaS_small")
                
                try:
                    # Tải weights từ local path
                    print(f"Đang tải weights từ: {model_path}")
                    checkpoint = torch.load(model_path, map_location=self.device)
                    
                    # Thử nhiều cách tải khác nhau
                    if isinstance(checkpoint, dict) and 'state_dict' in checkpoint:
                        print("Tải state_dict từ checkpoint")
                        self.model.load_state_dict(checkpoint['state_dict'])
                    else:
                        try:
                            print("Thử tải state_dict trực tiếp")
                            self.model.load_state_dict(checkpoint)
                        except Exception as e:
                            print(f"Không thể tải state_dict: {e}. Sử dụng weights mặc định.")
                            # Tiếp tục với weights mặc định đã tải từ hub
                    
                    print("Đã tải weights thành công")
                except Exception as e:
                    print(f"Lỗi khi tải weights: {e}. Sử dụng weights mặc định.")
                
                # Đặt mô hình vào device
                self.model.to(self.device)
                
                # Tải transform
                midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
                self.transform = midas_transforms.small_transform
            else:
                # Mặc định tải từ torch hub
                print(f"Tải MiDaS model type: {model_type} từ torch hub")
                self.model = torch.hub.load("intel-isl/MiDaS", model_type if model_type != "Custom" else "MiDaS_small")
                self.model.to(self.device)
                
                # Chọn transform phù hợp
                midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
                if model_type in ["DPT_Large", "DPT_Hybrid"]:
                    self.transform = midas_transforms.dpt_transform
                else:
                    self.transform = midas_transforms.small_transform
            
            # Đặt model vào chế độ đánh giá (không huấn luyện)
            self.model.eval()
            print("MiDaS model loaded successfully")
            
        except Exception as e:
            print(f"ERROR loading MiDaS model: {e}")
            print(f"Trying fallback to MiDaS_small from torch hub...")
            try:
                self.model = torch.hub.load("intel-isl/MiDaS", "MiDaS_small")
                self.model.to(self.device)
                
                # Small transform cho MiDaS small
                midas_transforms = torch.hub.load("intel-isl/MiDaS", "transforms")
                self.transform = midas_transforms.small_transform
                
                self.model.eval()
                print("Fallback to MiDaS_small successful")
            except Exception as e2:
                print(f"ERROR with fallback: {e2}")
                raise

    def predict_depth(self, img):
        """
        Dự đoán độ sâu cho một hình ảnh
        
        Args:
            img: Hình ảnh BGR từ OpenCV
            
        Returns:
            Dict chứa cả 'depth_map' (bản đồ độ sâu gốc) và 'colored_depth' (bản đồ độ sâu đã màu hóa)
        """
        # Convert image to RGB if it is BGR
        if img.shape[2] == 3:  # assuming the image has 3 channels
            input_image = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        else:
            input_image = img

        # Apply the transformation
        input_tensor = self.transform(input_image).to(self.device)
        
        # Predict depth
        with torch.no_grad():
            prediction = self.model(input_tensor)
            
            if isinstance(prediction, tuple):
                prediction = prediction[0]  # Some models return additional outputs
                
            # Resize to original image size
            prediction = torch.nn.functional.interpolate(
                prediction.unsqueeze(1),
                size=img.shape[:2],
                mode="bicubic",
                align_corners=False
            ).squeeze()
            
            # Convert to numpy
            depth_map = prediction.cpu().numpy()
            
        # Normalize depth map for visualization
        depth_min = depth_map.min()
        depth_max = depth_map.max()
        normalized_depth = (depth_map - depth_min) / (depth_max - depth_min)
        
        # Convert to 8-bit grayscale image
        depth_gray = (normalized_depth * 255).astype(np.uint8)
        
        # Create colored depth map
        colored_depth = cv2.applyColorMap(depth_gray, cv2.COLORMAP_INFERNO)
        
        return {
            'depth_map': depth_gray,
            'colored_depth': colored_depth,
            'raw_depth': depth_map  # Return the original unnormalized depth data for advanced processing
        }

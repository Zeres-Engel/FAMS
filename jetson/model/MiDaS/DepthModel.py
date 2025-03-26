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

        return {
            'raw_depth': depth_map_raw,
            'colored_depth': depth_map_colored
        }
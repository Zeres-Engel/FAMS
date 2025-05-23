import numpy as np
import cv2
import onnx
import onnxruntime
from model.utils import face_align

class AdaFace:
    def __init__(self, model_file=None, session=None):
        assert model_file is not None
        self.model_file = model_file
        self.session = session
        self.taskname = "recognition"
        find_sub = False
        find_mul = False
        model = onnx.load(self.model_file)
        graph = model.graph
        for nid, node in enumerate(graph.node[:8]):
            if node.name.startswith("Sub") or node.name.startswith("_minus"):
                find_sub = True
            if node.name.startswith("Mul") or node.name.startswith("_mul"):
                find_mul = True
        if find_sub and find_mul:
            input_mean = 0.0
            input_std = 1.0
        else:
            input_mean = 127.5
            input_std = 127.5
        self.input_mean = input_mean
        self.input_std = input_std
        print('input mean and std:', self.input_mean, self.input_std)
        if self.session is None:
            self.session = onnxruntime.InferenceSession(self.model_file, providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
        input_cfg = self.session.get_inputs()[0]
        input_shape = input_cfg.shape
        input_name = input_cfg.name
        self.input_size = tuple(input_shape[2:4][::-1])
        self.input_shape = input_shape
        outputs = self.session.get_outputs()
        output_names = []
        for out in outputs:
            output_names.append(out.name)
        self.input_name = input_name
        self.output_names = output_names
        assert len(self.output_names) == 1
        self.output_shape = outputs[0].shape

    def prepare(self, ctx_id, **kwargs):
        if ctx_id < 0:
            self.session.set_providers(["CPUExecutionProvider"])

    def get(self, img, face):
        """
        Thực hiện face alignment và tạo embedding cho khuôn mặt.
        
        Quy trình:
        1. Sử dụng 5 điểm landmarks (keypoints) để thực hiện face alignment
        2. Chuẩn hóa ảnh khuôn mặt thành kích thước cố định (norm_crop)
        3. Đưa ảnh đã chuẩn hóa vào mô hình để tạo vector embedding
        
        Kết quả:
        - Lưu vector embedding vào đối tượng face
        - Trả về vector embedding
        """
        # Bước 1 & 2: Face alignment sử dụng 5 điểm landmarks
        aimg = face_align.norm_crop(
            img, landmark=face.kps, image_size=self.input_size[0]
        )
        
        # Bước 3: Tạo vector embedding
        face.embedding = self.get_feat(aimg).flatten()
        return face.embedding
    
    def compute_sim(self, feat1, feat2):
        from sklearn.metrics.pairwise import cosine_similarity
        sim = cosine_similarity(feat1.reshape(1, -1), feat2.reshape(1, -1))[0][0]
        return sim

    def get_feat(self, imgs):
        if not isinstance(imgs, list):
            imgs = [imgs]
        input_size = self.input_size

        blob = cv2.dnn.blobFromImages(
            imgs,
            1.0 / self.input_std,
            input_size,
            (self.input_mean, self.input_mean, self.input_mean),
            swapRB=True,
        )
        net_out = self.session.run(self.output_names, {self.input_name: blob})[0]
        return net_out

    def forward(self, batch_data):
        blob = (batch_data - self.input_mean) / self.input_std
        net_out = self.session.run(self.output_names, {self.input_name: blob})[0]
        return net_out
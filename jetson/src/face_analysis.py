import glob
import os.path as osp
import os
import onnxruntime
from src.model_zoo import model_zoo

from numpy.linalg import norm as l2norm

class Face(dict):

    def __init__(self, d=None, **kwargs):
        if d is None:
            d = {}
        if kwargs:
            d.update(**kwargs)
        for k, v in d.items():
            setattr(self, k, v)

    def __setattr__(self, name, value):
        if isinstance(value, (list, tuple)):
            value = [self.__class__(x)
                    if isinstance(x, dict) else x for x in value]
        elif isinstance(value, dict) and not isinstance(value, self.__class__):
            value = self.__class__(value)
        super(Face, self).__setattr__(name, value)
        super(Face, self).__setitem__(name, value)

    __setitem__ = __setattr__

    def __getattr__(self, name):
        return None

    @property
    def embedding_norm(self):
        if self.embedding is None:
            return None
        return l2norm(self.embedding)

    @property 
    def normed_embedding(self):
        if self.embedding is None:
            return None
        return self.embedding / self.embedding_norm

    @property 
    def sex(self):
        if self.gender is None:
            return None
        return 'M' if self.gender==1 else 'F'

class ZeFace:
    def __init__(self, allowed_modules=None, **kwargs):
        onnxruntime.set_default_logger_severity(3)
        self.models = {}
        
        # Cập nhật đường dẫn tới thư mục weights trong assets
        current_dir = os.path.dirname(os.path.abspath(__file__))
        base_dir = os.path.dirname(current_dir)
        self.weights_dir = os.path.join(base_dir, 'assets', 'weights')
        
        # Load models từ weights
        if 'detection' in allowed_modules:
            det_path = os.path.join(self.weights_dir, 'retinaface.onnx')
            if os.path.exists(det_path):
                det_model = model_zoo.get_model(det_path)
                if det_model is not None:
                    self.models['detection'] = det_model
                    print(f"Loaded detection model from: {det_path}")
            else:
                raise FileNotFoundError(f"Detection model not found at {det_path}")
        
        if 'recognition' in allowed_modules:
            rec_path = os.path.join(self.weights_dir, 'adaface.onnx')
            if os.path.exists(rec_path):
                rec_model = model_zoo.get_model(rec_path)
                if rec_model is not None:
                    self.models['recognition'] = rec_model
                    print(f"Loaded recognition model from: {rec_path}")
            else:
                raise FileNotFoundError(f"Recognition model not found at {rec_path}")
                
        assert 'detection' in self.models
        self.det_model = self.models['detection']

    def prepare(self, ctx_id, det_thresh=0.5, det_size=(640, 640)):
        self.det_thresh = det_thresh
        print('set det-size:', det_size)
        self.det_size = det_size
        for taskname, model in self.models.items():
            if taskname=='detection':
                model.prepare(ctx_id, input_size=det_size, det_thresh=det_thresh)
            else:
                model.prepare(ctx_id)

    def get(self, img, max_num=0):
        bboxes, kpss = self.det_model.detect(img,
                                             max_num=max_num,
                                             metric='default')
        if bboxes.shape[0] == 0:
            return []
        ret = []
        for i in range(bboxes.shape[0]):
            bbox = bboxes[i, 0:4]
            det_score = bboxes[i, 4]
            kps = None
            if kpss is not None:
                kps = kpss[i]
            face = Face(bbox=bbox, kps=kps, det_score=det_score)
            for taskname, model in self.models.items():
                if taskname=='detection':
                    continue
                model.get(img, face)
            ret.append(face)
        return ret

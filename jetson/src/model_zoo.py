import os
import os.path as osp
import glob
import onnxruntime
import sys

# Add model directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
base_dir = os.path.dirname(current_dir)
model_dir = os.path.join(base_dir, 'model')
sys.path.append(model_dir)
sys.path.append(base_dir)  # Add base directory to path

from model.AdaFace.adaface_onnx import AdaFace
from model.RetinaFace.retinaface import RetinaFace

class PickableInferenceSession(onnxruntime.InferenceSession): 
    # This is a wrapper to make the current InferenceSession class pickable.
    def __init__(self, model_path, **kwargs):
        super().__init__(model_path, **kwargs)
        self.model_path = model_path

    def __getstate__(self):
        return {'model_path': self.model_path}

    def __setstate__(self, values):
        model_path = values['model_path']
        self.__init__(model_path)

class ModelRouter:
    def __init__(self, onnx_file):
        self.onnx_file = onnx_file

    def get_model(self, **kwargs):
        session = PickableInferenceSession(self.onnx_file, **kwargs)
        print(f'Applied providers: {session._providers}, with options: {session._provider_options}')
        inputs = session.get_inputs()
        input_cfg = inputs[0]
        input_shape = input_cfg.shape
        outputs = session.get_outputs()

        if len(outputs)>=5:
            return RetinaFace(model_file=self.onnx_file, session=session)
        else:
            return AdaFace(model_file=self.onnx_file, session=session)

def find_onnx_file(dir_path):
    if not os.path.exists(dir_path):
        return None
    paths = glob.glob("%s/*.onnx" % dir_path)
    if len(paths) == 0:
        return None
    paths = sorted(paths)
    return paths[-1]

def get_default_providers():
    return ['CUDAExecutionProvider', 'CPUExecutionProvider']

def get_default_provider_options():
    return None

class ModelZoo:
    @staticmethod
    def get_model(name, **kwargs):
        if not name.endswith('.onnx'):
            raise ValueError("Model file must be .onnx format")
            
        if not os.path.exists(name):
            raise ValueError(f"Model file not found: {name}")
            
        router = ModelRouter(name)
        providers = kwargs.get('providers', get_default_providers())
        provider_options = kwargs.get('provider_options', get_default_provider_options())
        model = router.get_model(providers=providers, provider_options=provider_options)
        return model

# Create a singleton instance
model_zoo = ModelZoo()


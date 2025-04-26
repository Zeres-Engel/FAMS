import os
import os.path as osp
import glob
import onnxruntime

from model.AdaFace.adaface_onnx import AdaFace
from model.RetinaFace.retinaface import RetinaFace

class PickableInferenceSession(onnxruntime.InferenceSession): 
    """
    A pickable version of the ONNX InferenceSession for serialization.
    """
    def __init__(self, model_path, **kwargs):
        super().__init__(model_path, **kwargs)
        self.model_path = model_path

    def __getstate__(self):
        return {'model_path': self.model_path}

    def __setstate__(self, values):
        model_path = values['model_path']
        self.__init__(model_path)

class ModelRouter:
    """
    Determines the correct model implementation based on the ONNX file structure.
    """
    def __init__(self, onnx_file):
        self.onnx_file = onnx_file

    def get_model(self, **kwargs):
        """
        Returns the appropriate model implementation based on the ONNX file.
        
        Args:
            **kwargs: Additional arguments to pass to the ONNX session
        
        Returns:
            A model object (RetinaFace or AdaFace)
        """
        session = PickableInferenceSession(self.onnx_file, **kwargs)
        print(f'Applied providers: {session._providers}, with options: {session._provider_options}')
        
        inputs = session.get_inputs()
        input_cfg = inputs[0]
        input_shape = input_cfg.shape
        outputs = session.get_outputs()

        # Determine model type based on output count
        if len(outputs) >= 5:
            return RetinaFace(model_file=self.onnx_file, session=session)
        else:
            return AdaFace(model_file=self.onnx_file, session=session)

def find_onnx_file(dir_path):
    """
    Find the latest ONNX file in a directory.
    
    Args:
        dir_path: Path to directory to search
        
    Returns:
        Path to the latest ONNX file, or None if none found
    """
    if not os.path.exists(dir_path):
        return None
    paths = glob.glob("%s/*.onnx" % dir_path)
    if len(paths) == 0:
        return None
    paths = sorted(paths)
    return paths[-1]

def get_default_providers():
    """
    Get the default ONNX execution providers, preferring CUDA if available.
    
    Returns:
        List of execution providers
    """
    return ['CUDAExecutionProvider', 'CPUExecutionProvider']

def get_default_provider_options():
    """
    Get the default provider options.
    
    Returns:
        Provider options or None
    """
    return None

class ModelZoo:
    """
    Factory class for creating models from ONNX files.
    """
    @staticmethod
    def get_model(name, **kwargs):
        """
        Get a model object from an ONNX file.
        
        Args:
            name: Path to the ONNX file
            **kwargs: Additional arguments for model initialization
            
        Returns:
            A model object
            
        Raises:
            ValueError: If the file is not found or not an ONNX file
        """
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
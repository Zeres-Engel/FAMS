import os
import yaml
from typing import Dict, Any
from types import SimpleNamespace

class ZenConfig:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ZenConfig, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self._initialized = True
        self.config_data = self._load_config()
        self._setup_paths()
        self._create_directories()
        
    def _load_config(self) -> Dict[str, Any]:
        """Load config from YAML file"""
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        config_path = os.path.join(current_dir, "assets", "configs", "config.yaml")
        
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        return config
        
    def _setup_paths(self):
        """Setup absolute paths based on project root"""
        self.base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        
        # Setup weights paths
        self.weights_dir = os.path.join(self.base_path, self.config_data['weights']['dir'])
        self.detection_model = os.path.join(self.weights_dir, self.config_data['weights']['detection'])
        self.recognition_model = os.path.join(self.weights_dir, self.config_data['weights']['recognition'])
        
        # Setup data paths
        self.gallery_path = os.path.join(self.base_path, self.config_data['data']['gallery'])
        self.db_path = os.path.join(self.base_path, self.config_data['data']['database'])
        
    def _create_directories(self):
        """Create necessary directories if they don't exist"""
        os.makedirs(self.weights_dir, exist_ok=True)
        os.makedirs(self.db_path, exist_ok=True)
        os.makedirs(self.gallery_path, exist_ok=True)
        
        # Create attendance directory if specified in config
        attendance_dir = self.get_nested_value(['data', 'attendance_dir'], None)
        if attendance_dir:
            attendance_path = os.path.join(self.base_path, attendance_dir)
            os.makedirs(attendance_path, exist_ok=True)
    
    def get_nested_value(self, keys, default=None):
        """Safely get nested value from config_data dictionary"""
        data = self.config_data
        for key in keys:
            if isinstance(data, dict) and key in data:
                data = data[key]
            else:
                return default
        return data
    
    @property
    def data(self):
        """Get data namespace with attendance_dir and rfid_file added"""
        # Default values if not in config
        attendance_dir = self.get_nested_value(['data', 'attendance_dir'], 'data/attendance')
        rfid_file = self.get_nested_value(['data', 'rfid_file'], 'assets/database/rfid.json')
        
        return SimpleNamespace(
            gallery=self.gallery_path,
            database=self.db_path,
            attendance_dir=os.path.join(self.base_path, attendance_dir),
            rfid_file=os.path.join(self.base_path, rfid_file)
        )
        
    @property
    def det_size(self):
        return tuple(self.config_data['detection']['input_size'])
        
    @property
    def det_threshold(self):
        return self.config_data['detection']['threshold']
        
    @property
    def rec_threshold(self):
        return self.config_data['recognition']['threshold']
        
    @property
    def embedding_dim(self):
        return self.config_data['recognition']['embedding_dim']
        
    @property
    def logging(self):
        """Get logging namespace with all parameters"""
        return SimpleNamespace(**{
            'device_id': self.get_nested_value(['logging', 'device_id'], 1),
            'log_interval': self.get_nested_value(['logging', 'log_interval'], 5),
            'simplified': self.get_nested_value(['logging', 'simplified'], True)
        })
        
    @property
    def anti_spoofing(self):
        return SimpleNamespace(**{
            'enable': self.config_data.get('anti_spoofing', {}).get('enable', True),
            'var_thresh': self.config_data.get('anti_spoofing', {}).get('var_thresh', 0.0005),
            'grad_thresh': self.config_data.get('anti_spoofing', {}).get('grad_thresh', 0.7),
            'depth_range_thresh': self.config_data.get('anti_spoofing', {}).get('depth_range_thresh', 30.0),
            'min_depth_thresh': self.config_data.get('anti_spoofing', {}).get('min_depth_thresh', 50.0),
            'max_depth_thresh': self.config_data.get('anti_spoofing', {}).get('max_depth_thresh', 200.0),
            'normalize_method': self.config_data.get('anti_spoofing', {}).get('normalize_method', 'min_max')
        })

# Create singleton instance
config = ZenConfig() 
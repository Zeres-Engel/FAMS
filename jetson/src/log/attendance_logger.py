import os
import json
import time
import datetime
import cv2
from pathlib import Path
import sys
import numpy as np

# Add project root to Python path
project_root = str(Path(__file__).parent.parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from utils.config_utils import config

class AttendanceLogger:
    """
    Logger chuyên dụng cho việc ghi nhận điểm danh.
    Lưu thông tin điểm danh dưới dạng JSON và lưu ảnh khuôn mặt.
    """
    
    def __init__(self, base_path=None):
        """
        Initialize the attendance logger
        
        Args:
            base_path: Base directory to save attendance data and face images
        """
        self.base_path = base_path or config.data.attendance_dir
        self.device_id = config.logging.device_id if hasattr(config, 'logging') else 1
        self._ensure_directories()
        
    def _ensure_directories(self):
        """Ensure necessary directories exist"""
        Path(self.base_path).mkdir(parents=True, exist_ok=True)
        
    def _get_user_dir(self, user_id):
        """Get directory for a specific user"""
        user_dir = os.path.join(self.base_path, user_id)
        Path(user_dir).mkdir(exist_ok=True)
        return user_dir
        
    def log_attendance(self, *args, **kwargs):
        """
        Log a user attendance event and save face image
        
        Hỗ trợ 2 cách gọi:
        1. log_attendance(attendance_data, status="SUCCESS") - attendance_data là dictionary
        2. log_attendance(user_id, rfid_id, face_image=None, device_id=None, status="SUCCESS")
        
        Returns:
            dict: Attendance record information
        """
        # Xác định cách gọi hàm dựa trên kiểu dữ liệu của tham số đầu tiên
        if args and isinstance(args[0], dict):
            # Trường hợp 1: Tham số đầu tiên là attendance_data (dict)
            attendance_data = args[0]
            status = kwargs.get("status", "SUCCESS")
            user_id = attendance_data.get("userId")
            rfid_id = attendance_data.get("RFID_ID")
            face_image_path = attendance_data.get("CheckInFace")
            device_id = attendance_data.get("deviceId", self.device_id)
            
            # Nếu đường dẫn không phải là None và là một đường dẫn tồn tại
            if face_image_path and face_image_path != "No image saved" and os.path.exists(face_image_path):
                image_path = face_image_path
            else:
                image_path = None
        else:
            # Trường hợp 2: Các tham số riêng biệt
            user_id = args[0] if len(args) > 0 else kwargs.get("user_id")
            rfid_id = args[1] if len(args) > 1 else kwargs.get("rfid_id")
            face_image = kwargs.get("face_image")
            device_id = kwargs.get("device_id", self.device_id)
            status = kwargs.get("status", "SUCCESS")
            image_path = None
        
        # Use device_id from parameter or from config
        device_id = device_id or self.device_id
        
        # Create timestamp
        timestamp = datetime.datetime.now()
        formatted_time = timestamp.strftime("%Y-%m-%d_%H-%M-%S")
        iso_time = timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # Trường hợp 2: Nếu là tham số riêng lẻ và có face_image
        face_base64 = ""
        if image_path is None and "face_image" in kwargs and kwargs["face_image"] is not None:
            face_image = kwargs["face_image"]
            if isinstance(face_image, np.ndarray) and face_image.size > 0:
                user_dir = self._get_user_dir(user_id)
                image_filename = f"latest.jpg"  # Sử dụng tên file cố định
                image_path = os.path.join(user_dir, image_filename)
                
                try:
                    # Đảm bảo thư mục tồn tại
                    os.makedirs(os.path.dirname(image_path), exist_ok=True)
                    
                    # Xóa file cũ nếu tồn tại
                    if os.path.exists(image_path):
                        try:
                            os.remove(image_path)
                        except Exception as e:
                            print(f"ERROR removing old image: {e}", flush=True)
                    
                    # Kiểm tra hình dạng của ảnh
                    if len(face_image.shape) != 3 or face_image.shape[2] != 3:
                        # Thử chuyển đổi ảnh grayscale sang BGR nếu cần
                        if len(face_image.shape) == 2:
                            face_image = cv2.cvtColor(face_image, cv2.COLOR_GRAY2BGR)
                    
                    # Lưu ảnh
                    success = cv2.imwrite(image_path, face_image)
                    if success:
                        # Chuyển đổi ảnh thành base64
                        import base64
                        import cv2
                        _, buffer = cv2.imencode('.jpg', face_image)
                        face_base64 = base64.b64encode(buffer).decode('utf-8')
                        face_base64 = f"data:image/jpeg;base64,{face_base64}"
                    else:
                        image_path = None
                except Exception as e:
                    print(f"ERROR saving face image: {e}", flush=True)
                    image_path = None
        
        # Obtener el vector facial si es posible
        face_vector = None
        face_score = 0.0
        
        # Intentamos obtener el vector facial actual de ZenSys
        try:
            from src.core.zensys_factory import get_default_instance
            zensys = get_default_instance()
            
            # Obtener score si está disponible
            if zensys.verification_result and "face_score" in zensys.verification_result:
                face_score = zensys.verification_result["face_score"]
            
            # Obtener el embedding si está disponible
            if zensys._last_frame is not None and len(zensys.face_recognition.face_analyzer.get(zensys._last_frame)) > 0:
                face = zensys.face_recognition.face_analyzer.get(zensys._last_frame)[0]
                if face and face.embedding is not None:
                    face_vector = face.normed_embedding.tolist()
        except Exception as e:
            print(f"Error getting face vector: {e}")
        
        # Create attendance record con el nuevo formato
        attendance_record = {
            "userId": user_id,
            "deviceId": device_id,
            "checkIn": iso_time,
            "checkInFace": face_base64 if face_base64 else "No image saved",
            "faceVectorList": []
        }
        
        # Añadir vector facial si está disponible
        if face_vector:
            attendance_record["faceVectorList"] = [
                {
                    "vectorType": "front",
                    "vector": face_vector,
                    "score": float(face_score)
                }
            ]
        
        # Para compatibilidad con sistemas antiguos, mantenemos las claves originales
        original_record = {
            "deviceId": device_id,
            "userId": user_id,
            "RFID_ID": rfid_id,
            "CheckIn": timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "CheckInFace": image_path if image_path else "No image saved"
        }
        
        # Mostrar JSON en el nuevo formato pero guardar en el formato anterior para compatibilidad
        print(json.dumps(attendance_record, indent=2, ensure_ascii=False), flush=True)
        
        # Devolvemos el registro original para mantener compatibilidad
        return original_record
        
    def save_log_to_file(self, attendance_record, log_dir=None):
        """
        Lưu attendance_record vào file JSON
        
        Args:
            attendance_record: Thông tin điểm danh (en formato original)
            log_dir: Thư mục lưu trữ log (mặc định: data/logs)
        
        Returns:
            str: Đường dẫn tới file log
        """
        if log_dir is None:
            log_dir = os.path.join(self.base_path, "../logs")
            
        Path(log_dir).mkdir(parents=True, exist_ok=True)
        
        # Tạo tên file theo ngày
        today = datetime.datetime.now().strftime("%Y-%m-%d")
        log_file = os.path.join(log_dir, f"attendance_{today}.json")
        
        # Đọc log hiện tại nếu đã tồn tại
        logs = []
        if os.path.exists(log_file):
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    logs = json.load(f)
            except:
                logs = []
        
        # Thêm log mới (como attendance_record es el formato original, 
        # necesitamos crear la versión nueva para el archivo)
        
        # Crear timestamp en formato ISO
        timestamp = datetime.datetime.now()
        iso_time = timestamp.strftime("%Y-%m-%dT%H:%M:%SZ")
        
        # Obtener path de la imagen
        image_path = attendance_record.get("CheckInFace", "")
        face_base64 = ""
        
        # Convertir imagen a base64 si existe
        if image_path and os.path.exists(image_path) and image_path != "No image saved":
            try:
                import base64
                with open(image_path, "rb") as image_file:
                    face_base64 = base64.b64encode(image_file.read()).decode('utf-8')
                face_base64 = f"data:image/jpeg;base64,{face_base64}"
            except Exception as e:
                print(f"Error converting image to base64 for log file: {e}")
        
        # Obtener vector facial si es posible
        face_vector = None
        face_score = 0.0
        
        try:
            from src.core.zensys_factory import get_default_instance
            zensys = get_default_instance()
            
            if zensys.verification_result and "face_score" in zensys.verification_result:
                face_score = zensys.verification_result["face_score"]
            
            if zensys._last_frame is not None and len(zensys.face_recognition.face_analyzer.get(zensys._last_frame)) > 0:
                face = zensys.face_recognition.face_analyzer.get(zensys._last_frame)[0]
                if face and face.embedding is not None:
                    face_vector = face.normed_embedding.tolist()
        except Exception as e:
            print(f"Error getting face vector for log file: {e}")
        
        # Crear formato nuevo para guardar
        new_format_record = {
            "userId": attendance_record.get("userId", ""),
            "deviceId": attendance_record.get("deviceId", 1),
            "checkIn": iso_time,
            "checkInFace": face_base64 if face_base64 else "No image saved",
            "faceVectorList": []
        }
        
        # Añadir vector facial si disponible
        if face_vector:
            new_format_record["faceVectorList"] = [
                {
                    "vectorType": "front",
                    "vector": face_vector,
                    "score": float(face_score)
                }
            ]
        
        # Añadir el registro en formato nuevo
        logs.append(new_format_record)
        
        # Ghi lại vào file
        with open(log_file, 'w', encoding='utf-8') as f:
            json.dump(logs, indent=2, ensure_ascii=False, fp=f)
            
        return log_file 
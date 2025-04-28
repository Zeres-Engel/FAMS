import time
import os
from datetime import datetime
from src.log.attendance_logger import AttendanceLogger
from src.core.zensys_factory import get_attendance_service, get_message_manager
import json
import numpy as np
import cv2
import base64
import traceback

class AttendanceManager:
    """
    Quản lý điểm danh và ghi log
    """
    
    def __init__(self):
        """
        Khởi tạo Attendance Manager
        """
        self.attendance_logger = AttendanceLogger()
        self.last_log_time = 0  # Thời gian log cuối cùng để tránh log quá nhiều lần
        self.device_id = int(os.getenv('DEVICE_ID', '1'))
        self.attendance_dir = os.path.join(os.getcwd(), "data", "attendance")
        os.makedirs(self.attendance_dir, exist_ok=True)
        self.api_enabled = True
        self.face_system = None
        self.message_manager = get_message_manager()
    
    def log_attendance(self, user_id, rfid_id, face_image=None, face_image_path=None, status="SUCCESS"):
        """
        Ghi log điểm danh ra file và gửi lên server

        Args:
            user_id: ID của người dùng
            rfid_id: ID thẻ RFID
            face_image: Ảnh khuôn mặt dạng numpy array (tùy chọn)
            face_image_path: Đường dẫn đến ảnh khuôn mặt (tùy chọn)
            status: Trạng thái điểm danh ("SUCCESS" hoặc "FAILED")

        Returns:
            dict: Kết quả điểm danh
        """
        # Lấy timestamp hiện tại
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Chuẩn bị dữ liệu cho file log
        log_data = {
            "deviceId": self.device_id,
            "userId": user_id,
            "RFID_ID": rfid_id,
            "CheckIn": current_time,
            "CheckInFace": face_image_path or ""
        }
        
        print("\n==== PROCESSING ATTENDANCE DATA ====")
        print(f"Original attendance data: {json.dumps(log_data, indent=2)}")
        
        # Kiểm tra đường dẫn ảnh
        image_path = face_image_path
        image_data = None
        
        if image_path:
            print(f"Image path: {image_path}")
            print(f"Image exists: {os.path.exists(image_path)}")
            
            # Đọc dữ liệu ảnh nếu tồn tại
            if os.path.exists(image_path):
                try:
                    with open(image_path, "rb") as img_file:
                        image_data = img_file.read()
                    print(f"Read image data: {len(image_data)} bytes")
                    
                    # Mã hóa ảnh thành base64
                    base64_img = base64.b64encode(image_data).decode('utf-8')
                    print(f"Converted image to base64, length: {len(base64_img)}")
                except Exception as e:
                    print(f"Error reading image file: {e}")
                    traceback.print_exc()
        
        # Nếu không có đường dẫn ảnh nhưng có ảnh trực tiếp
        elif face_image is not None:
            try:
                # Encode ảnh thành JPEG
                _, buffer = cv2.imencode('.jpg', face_image)
                image_data = buffer.tobytes()
                print(f"Encoded image directly, size: {len(image_data)} bytes")
                
                # Mã hóa ảnh thành base64
                base64_img = base64.b64encode(image_data).decode('utf-8')
                print(f"Converted image to base64, length: {len(base64_img)}")
            except Exception as e:
                print(f"Error encoding face image: {e}")
                base64_img = None
                traceback.print_exc()
        
        # Lấy embedding khuôn mặt nếu có
        face_embedding = None
        embedding_score = 0.0
        
        print("\n==== GETTING FACE EMBEDDING ====")
        if self.face_system and hasattr(self.face_system, '_last_frame') and self.face_system._last_frame is not None:
            try:
                last_frame = self.face_system._last_frame
                print(f"Last frame shape: {last_frame.shape}")
                
                # Lấy khuôn mặt từ frame
                faces = self.face_system.face_recognition.face_analyzer.get(last_frame)
                print(f"Detected faces: {len(faces)}")
                
                if faces:
                    face = faces[0]  # Lấy khuôn mặt đầu tiên
                    face_embedding = face.normed_embedding.tolist()
                    embedding_score = float(self.face_system.verification_result.get("face_score", 0)) if self.face_system.verification_result else 0.0
                    print(f"Extracted face embedding, length: {len(face_embedding)}")
            except Exception as e:
                print(f"Error extracting face embedding: {e}")
                traceback.print_exc()
        
        # Chuẩn bị dữ liệu cho API
        print("\n==== PREPARING API DATA ====")
        api_data = {
            "deviceId": self.device_id,
            "userId": user_id,
            "rfidId": rfid_id,
            "checkInTime": current_time,
            "status": status,
        }
        
        # Thêm ảnh nếu có
        if base64_img:
            api_data["faceImage"] = base64_img
        
        # Thêm face vector nếu có
        if face_embedding:
            face_vectors = [{
                "type": "front",
                "score": embedding_score,
                "vector": face_embedding
            }]
            api_data["faceVectors"] = face_vectors
            print(f"Added face vector of type 'front', score: {embedding_score}")
        
        # Gửi dữ liệu lên server
        result = {
            "success": True,
            "local_log": log_data,
            "image_path": image_path
        }
        
        # Call API nếu có message manager
        if self.message_manager:
            print("\n==== SENDING ATTENDANCE DATA ====")
            try:
                api_response = self.message_manager.send_attendance(api_data)
                
                # Kiểm tra lỗi từ API
                if not api_response.get("success", False):
                    error_message = api_response.get("message", "Unknown error")
                    error_details = api_response.get("error", "")
                    error_code = api_response.get("code", "API_ERROR")
                    
                    print(f"API error response: {json.dumps(api_response)}")
                    print(f"Failed to send attendance data via API")
                    
                    # Thêm thông tin lỗi vào kết quả
                    result["success"] = False
                    result["error"] = True
                    result["error_message"] = f"{error_message}: {error_details}" if error_details else error_message
                    result["error_code"] = error_code
                    
                    # Log lỗi
                    self.log_api_error(user_id, rfid_id, error_message, error_code)
                else:
                    print("Successfully sent attendance data via API")
                    result["api_response"] = api_response
                    
            except Exception as e:
                print(f"Failed to send attendance data: {e}")
                traceback.print_exc()
                
                # Thêm thông tin lỗi vào kết quả
                result["success"] = False
                result["error"] = True
                result["error_message"] = f"Network error: {str(e)}"
                result["error_code"] = "NETWORK_ERROR"
                
                # Log lỗi
                self.log_api_error(user_id, rfid_id, str(e), "NETWORK_ERROR")
        else:
            print("Message manager not available, skipping API call")
        
        # Ghi log điểm danh ra file local
        try:
            self.attendance_logger.log_attendance(user_id, rfid_id, status, face_image_path)
            result["local_logged"] = True
        except Exception as e:
            print(f"Error logging attendance locally: {e}")
            result["local_logged"] = False
        
        return result

    def log_api_error(self, user_id, rfid_id, error_message, error_code):
        """
        Ghi log lỗi API vào file

        Args:
            user_id: ID của người dùng
            rfid_id: ID thẻ RFID
            error_message: Thông báo lỗi
            error_code: Mã lỗi
        """
        try:
            # Chuẩn bị dữ liệu lỗi
            error_data = {
                "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "user_id": user_id,
                "rfid_id": rfid_id,
                "error_code": error_code,
                "error_message": error_message
            }
            
            # Tạo file log API errors nếu chưa có
            log_dir = os.path.join(os.getcwd(), "logs")
            os.makedirs(log_dir, exist_ok=True)
            
            log_file = os.path.join(log_dir, "api_errors.log")
            
            # Ghi file log
            with open(log_file, "a", encoding="utf-8") as f:
                f.write(f"{json.dumps(error_data)}\n")
                
            print(f"Logged API error to {log_file}")
        except Exception as e:
            print(f"Error logging API error: {e}")
    
    def get_attendance_history(self, user_id, from_date=None, to_date=None):
        """
        Lấy lịch sử điểm danh từ API
        
        Args:
            user_id: ID của người dùng
            from_date: Ngày bắt đầu (định dạng YYYY-MM-DD)
            to_date: Ngày kết thúc (định dạng YYYY-MM-DD)
            
        Returns:
            Result: Kết quả truy vấn
        """
        attendance_service = get_attendance_service()
        return attendance_service.get_attendance_history(
            user_id=user_id,
            from_date=from_date,
            to_date=to_date
        )
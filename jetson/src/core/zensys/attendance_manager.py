import time
import os
from datetime import datetime
from src.log.attendance_logger import AttendanceLogger
from src.core.zensys_factory import get_attendance_service, get_message_manager
import json
import numpy as np
import cv2

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
    
    def log_attendance(self, user_id, rfid_id=None, face_image=None, face_image_path=None, status="SUCCESS"):
        """
        Ghi nhận điểm danh
        
        Args:
            user_id: ID người dùng
            rfid_id: ID thẻ RFID (nếu có)
            face_image: Hình ảnh khuôn mặt dạng numpy array
            face_image_path: Đường dẫn đến hình ảnh khuôn mặt (nếu đã lưu trước)
            status: Trạng thái điểm danh (SUCCESS/FAILED)
            
        Returns:
            dict: Thông tin attendance đã log
        """
        result = {}
        
        try:
            current_time = datetime.now()
            timestamp = current_time.strftime("%Y-%m-%d %H:%M:%S")
            
            # Sử dụng đường dẫn ảnh đã có nếu hợp lệ
            final_image_path = face_image_path
            
            # Nếu có face_image, lưu vào thư mục user_id với tên cố định
            if face_image is not None:
                # Tạo thư mục cho từng user_id
                user_dir = os.path.join(self.attendance_dir, user_id)
                os.makedirs(user_dir, exist_ok=True)
                
                # Sử dụng tên file cố định "latest.jpg"
                filename = "latest.jpg"
                final_image_path = os.path.join(user_dir, filename)
                
                # Xóa file cũ nếu tồn tại
                if os.path.exists(final_image_path):
                    try:
                        os.remove(final_image_path)
                    except Exception as e:
                        print(f"Failed to remove old image: {e}")
                
                # Lưu ảnh mới vào file trong thread riêng
                def save_image_thread():
                    try:
                        cv2.imwrite(final_image_path, face_image)
                    except Exception as e:
                        print(f"Failed to save attendance image: {e}")
                
                # Chạy thread lưu ảnh
                import threading
                save_thread = threading.Thread(target=save_image_thread)
                save_thread.daemon = True
                save_thread.start()
            
            # Tạo dữ liệu attendance
            attendance_data = {
                "deviceId": self.device_id,
                "userId": user_id,
                "RFID_ID": rfid_id if rfid_id else "",
                "CheckIn": timestamp,
                "CheckInFace": final_image_path
            }
            
            # Log ra console
            print(json.dumps(attendance_data, indent=2))
            
            # Gửi dữ liệu đến API
            if self.api_enabled:
                # Tạo một thread riêng để gửi đến API 
                def send_api_thread():
                    try:
                        self._send_attendance_data(attendance_data)
                    except Exception as e:
                        print(f"Failed to send attendance data: {e}")
                
                # Chạy thread gửi API
                import threading
                api_thread = threading.Thread(target=send_api_thread)
                api_thread.daemon = True
                api_thread.start()
            
            result = {
                "status": "success",
                "user_id": user_id,
                "timestamp": timestamp,
                "image_path": final_image_path,
                "rfid_id": rfid_id
            }
            
            return result
        
        except Exception as e:
            print(f"Error logging attendance: {e}")
            result = {
                "status": "error",
                "message": str(e)
            }
            return result
    
    def _send_attendance_data(self, attendance_data):
        """
        Gửi dữ liệu điểm danh đến API và/hoặc Kafka
        
        Args:
            attendance_data: Dữ liệu điểm danh
        """
        try:
            print("\n==== PROCESSING ATTENDANCE DATA ====")
            print(f"Original attendance data: {json.dumps(attendance_data, indent=2)}")
            
            # Lấy đường dẫn lưu ảnh khuôn mặt
            check_in_time = datetime.now().strftime("%Y-%m-%dT%H:%M:%SZ")
            
            # Get face image path and convert to base64
            face_image_path = attendance_data.get("CheckInFace", "")
            face_base64 = ""
            
            print(f"Image path: {face_image_path}")
            print(f"Image exists: {os.path.exists(face_image_path) if face_image_path else False}")
            
            if face_image_path and os.path.exists(face_image_path):
                try:
                    import base64
                    with open(face_image_path, "rb") as image_file:
                        image_data = image_file.read()
                        print(f"Read image data: {len(image_data)} bytes")
                        face_base64 = base64.b64encode(image_data).decode('utf-8')
                    face_base64 = f"data:image/jpeg;base64,{face_base64}"
                    print(f"Converted image to base64, length: {len(face_base64)}")
                except Exception as e:
                    print(f"Error converting image to base64: {e}")
            else:
                print("WARNING: No valid image path found or image doesn't exist")
            
            # Get the face embedding from ZenSys instance
            print("\n==== GETTING FACE EMBEDDING ====")
            from src.core.zensys_factory import get_default_instance
            zensys = get_default_instance()
            face_embedding = None
            face_score = 0.0
            
            # Obtenemos el último resultado de verificación que contiene el score
            if zensys.verification_result and "face_score" in zensys.verification_result:
                face_score = zensys.verification_result["face_score"]
                print(f"Found face score: {face_score}")
            else:
                print("WARNING: No face score found in verification result")
            
            # Obtenemos el embedding del último rostro procesado
            if zensys._last_frame is not None:
                print(f"Last frame shape: {zensys._last_frame.shape}")
                faces = zensys.face_recognition.face_analyzer.get(zensys._last_frame)
                print(f"Detected faces: {len(faces)}")
                
                if len(faces) > 0:
                    face = faces[0]
                    if face and face.embedding is not None:
                        face_embedding = face.normed_embedding.tolist()
                        print(f"Extracted face embedding, length: {len(face_embedding)}")
                    else:
                        print("WARNING: Face has no embedding")
                else:
                    print("WARNING: No faces detected in last frame")
            else:
                print("WARNING: No last frame available")
            
            # Tạo dữ liệu để gửi trong định dạng mới
            print("\n==== PREPARING API DATA ====")
            api_data = {
                "userId": attendance_data.get("userId"),
                "deviceId": self.device_id,
                "checkIn": check_in_time,
                "checkInFace": face_base64,
                "faceVectorList": []
            }
            
            # Thêm vector khuôn mặt nếu có
            if face_embedding:
                api_data["faceVectorList"] = [
                    {
                        "vectorType": "front",
                        "vector": face_embedding,
                        "score": float(face_score)
                    }
                ]
                print(f"Added face vector of type 'front', score: {face_score}")
            else:
                print("WARNING: No face embedding to add to API data")
            
            # Gửi dữ liệu sử dụng Message Manager (hỗ trợ cả API và Kafka)
            print("\n==== SENDING ATTENDANCE DATA ====")
            message_manager = get_message_manager()
            
            # Message Manager sẽ tự động xử lý gửi qua API và/hoặc Kafka
            # tùy thuộc vào cấu hình khi khởi tạo
            send_result = message_manager.send_attendance_event(api_data)
            
            # Ghi log kết quả gửi
            if not send_result:
                print(f"Failed to send attendance data")
                return {
                    "success": False,
                    "message": "Failed to send attendance data"
                }
            else:
                print(f"Successfully sent attendance data")
                return {
                    "success": True,
                    "message": "Attendance data sent successfully"
                }
                
        except Exception as e:
            print(f"Error sending attendance data: {str(e)}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            return {
                "success": False,
                "message": f"Error: {str(e)}"
            }
    
    # Thêm phương thức send_attendance_data đã tham chiếu ở trên
    def send_attendance_data(self, attendance_data, verification_result, image_path):
        """
        Xử lý và gửi dữ liệu điểm danh
        
        Args:
            attendance_data: Dữ liệu điểm danh
            verification_result: Kết quả xác thực
            image_path: Đường dẫn ảnh
            
        Returns:
            dict: Kết quả API
        """
        return self._send_attendance_data(attendance_data)
    
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
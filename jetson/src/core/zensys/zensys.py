import cv2
import numpy as np
import time
import os
import sys
import threading
from pathlib import Path
from model.utils import face_align
from src.log.system_logger import SystemLogger
from utils.config_utils import config

# Import các module đã tách
from .face_recognition_manager import FaceRecognitionManager
from .anti_spoofing_manager import AntiSpoofingManager
from .depth_manager import DepthManager
from .rfid_manager import RFIDManager
from .attendance_manager import AttendanceManager

class ZenSys:
    """
    Hệ thống ZenSys tích hợp nhận diện khuôn mặt, RFID, chống giả mạo và depth map
    """
    
    def __init__(self, use_custom_midas=True):
        """
        Khởi tạo ZenSys
        
        Args:
            use_custom_midas: Có sử dụng mô hình MiDaS tùy chỉnh hay không
        """
        # Khởi tạo logger
        self.system_logger = SystemLogger()
        self.system_logger.log_system_event("startup", {"message": "ZenSys starting up"})
        
        # Khởi tạo các module
        self.face_recognition = FaceRecognitionManager()
        self.anti_spoofing = AntiSpoofingManager()
        
        # Cấu hình sử dụng repo và checkpoints local
        weights_dir = Path(os.getcwd()) / "assets" / "weights"
        os.environ['TORCH_HOME'] = str(weights_dir)
        
        # Khởi tạo DepthManager với mô hình tùy chỉnh nếu được chỉ định
        if use_custom_midas:
            checkpoint_path = str(weights_dir / "checkpoints" / "midas_v21_small_256.pt")
            if os.path.exists(checkpoint_path):
                # Sử dụng MidasSmall với weights từ local checkpoint
                self.depth = DepthManager(model_type="MidasSmall", custom_model_path=checkpoint_path)
                self.system_logger.info(f"Using local MiDaS checkpoint: {checkpoint_path}")
            else:
                self.depth = DepthManager(model_type="MidasSmall")
                self.system_logger.info("Using default MiDaS small model from hub")
        else:
            self.depth = DepthManager(model_type="MidasSmall")
            self.system_logger.info("Using default MiDaS small model from hub")
            
        # Bật debug mode nhưng không hiển thị từng phím nhấn
        self.rfid = RFIDManager(debug_mode=True, show_keys=False)
        self.attendance = AttendanceManager()
        
        # Thiết lập tham chiếu đến ZenSys cho AttendanceManager
        self.attendance.face_system = self
        
        # Các biến trạng thái
        self.current_face_crop = None
        self.current_face_crop_path = None  # Thêm biến để lưu đường dẫn ảnh
        self.verification_result = None
        self._last_frame = None
        self._last_rfid_update_time = 0
        self._last_rfid_id = None
        self.ui_callback = None
        
        # Biến kiểm soát check-in
        self.checkin_enabled = True
        self.last_checkin_time = 0
        self.checkin_cooldown = 5.0  # Thời gian chờ giữa các lần check-in (giây)
        
        # Thay đổi thư mục lưu ảnh
        self.attendance_faces_dir = os.path.join(os.getcwd(), "data", "attendance")
        os.makedirs(self.attendance_faces_dir, exist_ok=True)
        
        # For backward compatibility
        self.face_analyzer = self.face_recognition.face_analyzer
        self.rfid_system = self.rfid.rfid_system
        self.current_rfid = self.rfid.current_rfid
        self.face_anti = self.anti_spoofing.face_anti
        self.depth_predictor = self.depth.depth_predictor
        self.attendance_logger = self.attendance.attendance_logger
        self.depth_face_crop = self.anti_spoofing.depth_face_crop
        self.anti_spoofing_result = self.anti_spoofing.anti_spoofing_result
        
        # Đăng ký callback trong RFID Manager
        self.rfid.set_rfid_changed_callback(self.on_rfid_updated)
        
        # Thêm biến depth_display_paused
        self.depth_display_paused = False
    
    def set_ui_callback(self, callback):
        """
        Đặt callback để cập nhật UI
        
        Args:
            callback: Hàm callback(event_type, data)
        """
        self.ui_callback = callback
        print("UI callback registered in ZenSys")
    
    def on_rfid_updated(self, rfid_id, rfid_name):
        """
        Callback khi RFID được cập nhật
        
        Args:
            rfid_id: ID của thẻ RFID
            rfid_name: Tên người từ RFID
        """
        # Kiểm tra trùng lặp RFID trong thời gian ngắn (tránh quét 2 lần)
        current_time = time.time()
        if (self._last_rfid_id == rfid_id and 
            current_time - self._last_rfid_update_time < 2.0):
            print(f"Ignoring duplicate RFID scan: {rfid_id}")
            return
            
        # Cập nhật thông tin RFID hiện tại
        self._last_rfid_id = rfid_id
        self._last_rfid_update_time = current_time
        
        # Cập nhật biến compatibility
        self.current_rfid = rfid_id
        
        # Cập nhật UI nếu có callback
        if self.ui_callback:
            try:
                self.ui_callback("rfid_updated", {
                    "rfid_id": rfid_id,
                    "rfid_name": rfid_name,
                    "timestamp": current_time
                })
                print(f"UI updated with RFID: {rfid_id}")
            except Exception as e:
                print(f"Error updating UI with RFID: {e}")
        
        # Reset các biến xác thực
        self.verification_result = None
        self.current_face_crop = None
        
        # Log system event (chỉ log 1 lần)
        self.system_logger.log_system_event("rfid_scanned", {
            "rfid_id": rfid_id,
            "rfid_name": rfid_name
        })
    
    def initialize(self):
        """
        Khởi tạo hệ thống
        """
        # Khởi tạo database khuôn mặt
        self.face_recognition.initialize_database()
        
        # Khởi động RFID listener
        self.rfid.start_listening()
        
        print("ZenSys initialized successfully")
        self.system_logger.info("ZenSys initialized successfully")
    
    # Methods for backward compatibility
    def start_rfid_listening(self):
        """
        Bắt đầu lắng nghe RFID
        """
        self.rfid.start_listening()
        
    def stop_rfid_listening(self):
        """
        Dừng lắng nghe RFID
        """
        self.rfid.stop_listening()
        
    def on_rfid_scanned(self, rfid_id):
        """
        Callback khi RFID được quét
        """
        self.rfid.on_rfid_scanned(rfid_id)
        self.current_rfid = self.rfid.current_rfid
    
    def process_depth_anti_spoofing(self, depth_map, face):
        """
        Xử lý depth map cho face anti-spoofing
        """
        result = self.anti_spoofing.process_depth_anti_spoofing(depth_map, face)
        # Update attributes for backward compatibility
        self.depth_face_crop = self.anti_spoofing.depth_face_crop
        self.anti_spoofing_result = self.anti_spoofing.anti_spoofing_result
        return result
    
    def process_gallery(self):
        """
        Xử lý bộ sưu tập ảnh để tạo database
        """
        face_analyzer = self.face_recognition.face_analyzer
        face_db = self.face_recognition.face_db
        face_db.process_gallery(face_analyzer)
    
    def load_database(self):
        """
        Tải database khuôn mặt
        """
        return self.face_recognition.face_db.load_database()
        
    def recognize_face(self, face_embedding):
        """
        Nhận diện khuôn mặt từ embedding
        """
        return self.face_recognition.recognize_face(face_embedding)
    
    def save_face_image(self, face_image, user_id, prefix="face"):
        """
        Lưu ảnh khuôn mặt xuống disk và trả về đường dẫn
        
        Args:
            face_image: Ảnh khuôn mặt dạng numpy array
            user_id: ID của người dùng
            prefix: Tiền tố cho tên file
            
        Returns:
            str: Đường dẫn đến file ảnh đã lưu, hoặc None nếu có lỗi
        """
        if face_image is None or not isinstance(face_image, np.ndarray) or face_image.size == 0:
            self.system_logger.warning("Cannot save face image: Invalid image data")
            return None
        
        try:
            # Tạo đường dẫn đến thư mục của người dùng
            user_dir = os.path.join(self.attendance_faces_dir, user_id)
            os.makedirs(user_dir, exist_ok=True)
            
            # Sử dụng tên file cố định
            filename = "latest.jpg"
            filepath = os.path.join(user_dir, filename)
            
            # Xóa file cũ nếu tồn tại
            if os.path.exists(filepath):
                try:
                    os.remove(filepath)
                except Exception as e:
                    self.system_logger.error(f"Failed to remove old image: {e}")
            
            # Lưu ảnh
            cv2.imwrite(filepath, face_image)
            
            return filepath
        except Exception as e:
            self.system_logger.error(f"Failed to save face image: {e}")
            return None
    
    def process_frame(self, frame):
        """
        Xử lý khung hình từ camera

        Args:
            frame: Khung hình từ camera

        Returns:
            dict: Kết quả xử lý
        """
        result = {}

        try:
            # 1. Lưu frame gốc
            self._last_frame = frame.copy()

            # 2. Phát hiện khuôn mặt
            faces = self.face_recognition.face_analyzer.get(frame)
            result['face_detected'] = len(faces) > 0

            # Khởi tạo hoặc reset các giá trị nếu không có khuôn mặt
            if not faces:
                self.current_face_crop = None
                self.current_face_image = None
                self.current_face_crop_path = None

            # Xử lý depth map
            depth_result = self.depth.predict_depth(frame)
            result['depth_info'] = depth_result['stats'] if 'stats' in depth_result else {}

            # Lưu trữ depth map để sử dụng cho anti-spoofing
            self._last_depth_map = depth_result.get('depth_map', None)

            if faces:
                face = faces[0]  # Lấy khuôn mặt lớn nhất (đã được sắp xếp trong ZenFace)
                
                # 3. Nhận diện khuôn mặt
                embedding = face.normed_embedding
                name, score = self.face_recognition.recognize_face(embedding)
                result['face_name'] = name
                result['face_score'] = score
                
                # 4. Xử lý anti-spoofing với depth map
                anti_spoofing_result = self.anti_spoofing.process_depth_anti_spoofing(
                    depth_result.get('depth_map'), face)
                result['anti_spoofing'] = anti_spoofing_result
                # Update for backward compatibility
                self.depth_face_crop = self.anti_spoofing.depth_face_crop
                self.anti_spoofing_result = self.anti_spoofing.anti_spoofing_result
                
                # 5. Crop và align khuôn mặt
                face_aligned = False
                if face.kps is not None:
                    try:
                        # Thêm kiểm tra hình dạng của landmarks
                        if face.kps.shape == (5, 2):
                            self.current_face_crop = face_align.norm_crop(frame, landmark=face.kps, image_size=112)
                            # Lưu trực tiếp vào biến để GUI truy cập
                            self.current_face_image = self.current_face_crop.copy() if self.current_face_crop is not None else None
                            face_aligned = True
                            
                            # Lưu ảnh xuống disk trong thread riêng
                            if self.current_face_crop is not None:
                                def save_face_image_thread():
                                    # Lưu ảnh xuống disk
                                    self.current_face_crop_path = self.save_face_image(
                                        self.current_face_crop, name, f"aligned_{name}")
                                    result['face_crop_path'] = self.current_face_crop_path
                                
                                import threading
                                save_thread = threading.Thread(target=save_face_image_thread)
                                save_thread.daemon = True
                                save_thread.start()
                        else:
                            raise ValueError(f"Incorrect landmark shape: {face.kps.shape}")
                    except Exception as e:
                        self.system_logger.error(f"Error in face alignment: {e}")
                        face_aligned = False
                
                # Nếu không thể face align, thử sử dụng bbox để crop
                if not face_aligned and face.bbox is not None:
                    try:
                        x1, y1, x2, y2 = [int(b) for b in face.bbox]
                        
                        # Đảm bảo tọa độ nằm trong kích thước ảnh
                        h, w = frame.shape[:2]
                        x1, y1 = max(0, x1), max(0, y1)
                        x2, y2 = min(w, x2), min(h, y2)
                        
                        # Cắt khuôn mặt
                        if x2 > x1 and y2 > y1:
                            crop_img = frame[y1:y2, x1:x2]
                            if crop_img.size > 0:
                                # Resize để đảm bảo kích thước 112x112 tương thích với gallery
                                self.current_face_crop = cv2.resize(crop_img, (112, 112))
                                # Lưu trực tiếp vào biến để GUI truy cập
                                self.current_face_image = self.current_face_crop.copy() if self.current_face_crop is not None else None
                                
                                # Lưu ảnh xuống disk trong thread riêng
                                def save_face_image_thread():
                                    # Lưu ảnh xuống disk
                                    self.current_face_crop_path = self.save_face_image(
                                        self.current_face_crop, name, f"bbox_{name}")
                                    result['face_crop_path'] = self.current_face_crop_path
                                
                                import threading
                                save_thread = threading.Thread(target=save_face_image_thread)
                                save_thread.daemon = True
                                save_thread.start()
                    except Exception as e:
                        self.system_logger.error(f"Error in face cropping: {e}")
                
                # 6. Xác thực nếu có RFID
                if self.rfid.current_rfid:
                    self.process_verification(face)
                    # Update current RFID for backward compatibility
                    self.current_rfid = self.rfid.current_rfid
                    result['verification'] = self.verification_result
                                        
                # 7. Đếm lưu lượng nếu đã cấu hình
                if hasattr(config, 'counter') and config.counter.enable:
                    try:
                        min_confidence = getattr(config.counter, 'min_confidence', 0.5)
                        if score >= min_confidence:
                            self.counter.count_person(name, score)
                    except Exception as e:
                        self.system_logger.error(f"Error in people counting: {e}")
            
            # 8. Xử lý depth check-in nếu người dùng muốn
            if hasattr(config, 'depth_check_in') and config.depth_check_in.enable:
                try:
                    if depth_result is not None and 'depth_map' in depth_result:
                        depth_score = self.depth.analyze_depth_map(depth_result['depth_map'])
                        
                        # Cập nhật trạng thái check-in dựa trên depth
                        if depth_score > config.depth_check_in.threshold:
                            # TODO: Implement automatic check-in based on depth
                            pass
                except Exception as e:
                    self.system_logger.error(f"Error in depth check-in: {e}")
        
        except Exception as e:
            self.system_logger.error(f"Error processing frame: {e}")
            
        return result
    
    def process_verification(self, face):
        """
        Xử lý xác thực khi có RFID và khuôn mặt
        
        Args:
            face: Đối tượng Face
            
        Returns:
            dict: Kết quả xác thực hoặc None
        """
        if not self.rfid.current_rfid or not face:
            return None
            
        # Lấy embedding
        embedding = face.normed_embedding
        
        # Nhận diện khuôn mặt
        face_name, score = self.face_recognition.recognize_face(embedding)
        
        # Xác thực với RFID
        self.verification_result = self.rfid.verify_identity(
            self.rfid.current_rfid, face_name)
        
        # Kiểm tra anti-spoofing
        is_live_face = self.anti_spoofing.is_live_face()
        
        # Log kết quả xác thực
        self.rfid.log_verification_result(
            self.rfid.current_rfid,
            face_name,
            self.verification_result["match"],
            float(score),
            is_live_face
        )
        
        # Log attendance
        user_id = face_name
        rfid_id = self.rfid.current_rfid
        
        # Chuẩn bị ảnh khuôn mặt từ bbox nếu không có sẵn
        if self.current_face_crop is None and face.bbox is not None and hasattr(face, 'img') and face.img is not None:
            try:
                x1, y1, x2, y2 = [int(b) for b in face.bbox]
                img = face.img  # Lấy ảnh từ face object
                
                # Đảm bảo tọa độ nằm trong kích thước ảnh
                h, w = img.shape[:2]
                x1, y1 = max(0, x1), max(0, y1)
                x2, y2 = min(w, x2), min(h, y2)
                
                if x2 > x1 and y2 > y1:
                    # Cắt khuôn mặt
                    crop_img = img[y1:y2, x1:x2]
                    if crop_img.size > 0:
                        self.current_face_crop = cv2.resize(crop_img, (112, 112))
                        # Lưu biến ảnh trực tiếp vào đối tượng để GUI có thể truy cập 
                        self.current_face_image = self.current_face_crop.copy()
            except Exception as e:
                self.system_logger.error(f"Error creating face crop from source: {e}")
        
        # Lưu ảnh vào thư mục attendance/userId nếu có khuôn mặt - luồng lưu trữ
        if self.current_face_crop is not None:
            # Luồng lưu trữ - thực hiện trong thread riêng
            def save_face_image_thread():
                # Lưu ảnh vào thư mục attendance/userId
                user_dir = os.path.join(self.attendance_faces_dir, user_id)
                os.makedirs(user_dir, exist_ok=True)
                
                # Sử dụng tên file cố định thay vì timestamp
                filename = "latest.jpg"
                filepath = os.path.join(user_dir, filename)
                
                # Xóa file cũ nếu tồn tại
                if os.path.exists(filepath):
                    try:
                        os.remove(filepath)
                    except Exception as e:
                        self.system_logger.error(f"Failed to remove old image: {e}")
                
                try:
                    # Lưu ảnh vào thư mục attendance
                    success = cv2.imwrite(filepath, self.current_face_crop)
                    if success:
                        self.current_face_crop_path = filepath
                    else:
                        self.system_logger.error(f"Failed to save face image: cv2.imwrite returned False")
                except Exception as e:
                    self.system_logger.error(f"Failed to save face image: {e}")
            
            # Khởi chạy luồng lưu trữ riêng
            import threading
            save_thread = threading.Thread(target=save_face_image_thread)
            save_thread.daemon = True
            save_thread.start()
        
        # Sử dụng đường dẫn ảnh thay vì ảnh trong bộ nhớ
        attendance_result = self.attendance.log_attendance(
            user_id=user_id,
            rfid_id=rfid_id,
            face_image=self.current_face_crop,  # Sử dụng cả ảnh trực tiếp
            face_image_path=self.current_face_crop_path,  # và đường dẫn
            status="SUCCESS" if self.verification_result["match"] and is_live_face else "FAILED"
        )
        
        # Cập nhật thêm thông tin cho verification result
        self.verification_result.update({
            "face_score": float(score),
            "is_live_face": is_live_face,
            "face_crop_path": self.current_face_crop_path,
            "face_crop": self.current_face_crop,  # Thêm dữ liệu ảnh trực tiếp vào kết quả
            "attendance_path": attendance_result.get("image_path", "") if attendance_result else ""
        })
        
        # Log thành công hoặc thất bại
        if self.verification_result["match"] and is_live_face:
            self.system_logger.info(f"Authentication successful for user: {user_id}, RFID: {rfid_id}")
            
            # Reset RFID sau khi xác thực thành công
            if self.verification_result["match"]:
                log_interval = float(config.logging.log_interval) if hasattr(config.logging, 'log_interval') else 5.0
                threading.Timer(log_interval, self.reset_after_verification).start()
            
            # Khi xác thực thành công, tạm dừng hiển thị depth
            self.depth_display_paused = True
            
            # Lưu last_depth_result để giữ depth map cố định
            if hasattr(self, '_last_frame') and self._last_frame is not None:
                depth_result = self.depth.predict_depth(self._last_frame)
                self.last_depth_result = depth_result
        else:
            self.system_logger.warning(f"Authentication failed: match={self.verification_result['match']}, live_face={is_live_face}")
            # Đợi lâu hơn khi xác thực thất bại để người dùng có thể xem kết quả
            log_interval = float(config.logging.log_interval) if hasattr(config.logging, 'log_interval') else 5.0
            threading.Timer(log_interval, self.reset_after_verification).start()
            
            # Khi xác thực thất bại, cũng tạm dừng hiển thị depth
            self.depth_display_paused = True
            
            # Lưu last_depth_result để giữ depth map cố định
            if hasattr(self, '_last_frame') and self._last_frame is not None:
                depth_result = self.depth.predict_depth(self._last_frame)
                self.last_depth_result = depth_result
        
        # Cập nhật UI về kết quả xác thực - Truyền trực tiếp dữ liệu ảnh thay vì đường dẫn
        if self.ui_callback and self.verification_result:
            try:
                self.ui_callback("verification_result", {
                    "result": self.verification_result,
                    "face_crop_path": self.current_face_crop_path,  # Vẫn gửi đường dẫn
                    "face_image": self.current_face_crop,  # Thêm truyền trực tiếp ảnh
                    "face_name": face_name,
                    "face_score": score,
                    "timestamp": time.time()
                })
            except Exception as e:
                self.system_logger.error(f"Error updating UI with verification: {e}")
        
        return self.verification_result
    
    def reset_after_verification(self):
        """Reset sau khi xác thực thành công"""
        # Kích hoạt UI callback trước tiên để đảm bảo UI được cập nhật
        if self.ui_callback:
            try:
                self.ui_callback("reset_verification", {})
            except Exception as e:
                self.system_logger.error(f"Failed to send reset signal to UI: {e}")
        
        # Reset RFID
        self.rfid.clear_current_rfid()
        
        # Reset depth map display
        self.depth_display_paused = False
        
        # Reset các giá trị khác
        self.verification_result = None
        self.anti_spoofing_result = None
    
    def run_webcam(self):
        """
        Chạy nhận diện qua webcam
        """
        cap = cv2.VideoCapture(0)
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Xử lý frame
            result = self.process_frame(frame)
            
            # Hiển thị kết quả
            faces = result.get('faces', [])
            depth_map = result.get('colored_depth')
            
            # Vẽ bounding box và tên
            for face in faces:
                bbox = face.bbox
                x1, y1, x2, y2 = [int(b) for b in bbox]
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                
                # Hiển thị tên và điểm
                if 'face_name' in result and 'face_score' in result:
                    display_text = f"{result['face_name']} ({result['face_score']:.2f})"
                    cv2.putText(frame, display_text, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            
            # Hiển thị RFID nếu có
            if self.rfid.current_rfid:
                rfid_text = f"RFID: {self.rfid.current_rfid}"
                cv2.putText(frame, rfid_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                
                # Hiển thị kết quả xác thực nếu có
                if self.verification_result:
                    match_status = "MATCH ✓" if self.verification_result["match"] else "MISMATCH ✗"
                    cv2.putText(frame, match_status, (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, 
                               (0, 255, 0) if self.verification_result["match"] else (0, 0, 255), 2)
            
            # Ghép 2 ảnh lại
            if depth_map is not None:
                combined_frame = np.hstack((frame, depth_map))
                cv2.imshow('Face Recognition and Depth Estimation', combined_frame)
            else:
                cv2.imshow('Face Recognition', frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
        cap.release()
        cv2.destroyAllWindows()
    
    def cleanup(self):
        """
        Dọn dẹp tài nguyên
        """
        self.rfid.stop_listening()
    
    def enable_checkin(self, enabled=True, cooldown=5.0):
        """
        Bật/tắt chức năng check-in và thiết lập thời gian cooldown
        
        Args:
            enabled: Bật/tắt chức năng check-in
            cooldown: Thời gian chờ giữa các lần check-in (giây)
        """
        self.checkin_enabled = enabled
        self.checkin_cooldown = float(cooldown)
        print(f"Checkin {'enabled' if enabled else 'disabled'} with cooldown: {cooldown}s")
        
    def set_depth_thresholds(self, variance_thresh=None, range_thresh=None, min_thresh=None, max_thresh=None):
        """
        Thiết lập các ngưỡng cho đánh giá depth map
        
        Args:
            variance_thresh: Ngưỡng phương sai
            range_thresh: Ngưỡng phạm vi độ sâu
            min_thresh: Ngưỡng độ sâu tối thiểu
            max_thresh: Ngưỡng độ sâu tối đa
        """
        self.depth.set_thresholds(
            variance_thresh=variance_thresh,
            range_thresh=range_thresh,
            min_thresh=min_thresh,
            max_thresh=max_thresh
        )
        print(f"Depth thresholds updated: variance={variance_thresh}, range={range_thresh}, min={min_thresh}, max={max_thresh}") 
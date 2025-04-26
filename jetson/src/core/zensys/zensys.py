import cv2
import numpy as np
import time
import os
import sys
import threading
from pathlib import Path
from model.utils import face_align
from src.log.system_logger import SystemLogger

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
    
    def __init__(self):
        """
        Khởi tạo ZenSys
        """
        # Khởi tạo logger
        self.system_logger = SystemLogger()
        self.system_logger.log_system_event("startup", {"message": "ZenSys starting up"})
        
        # Khởi tạo các module
        self.face_recognition = FaceRecognitionManager()
        self.anti_spoofing = AntiSpoofingManager()
        self.depth = DepthManager()
        # Bật debug mode nhưng không hiển thị từng phím nhấn
        self.rfid = RFIDManager(debug_mode=True, show_keys=False)
        self.attendance = AttendanceManager()
        
        # Các biến trạng thái
        self.current_face_crop = None
        self.verification_result = None
        self._last_frame = None
        self._last_rfid_update_time = 0
        self._last_rfid_id = None
        self.ui_callback = None
        
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
    
    def process_frame(self, frame):
        """
        Xử lý một frame từ camera
        
        Args:
            frame: Ảnh đầu vào dạng numpy array
            
        Returns:
            dict: Kết quả xử lý với các thông tin như khuôn mặt, depth, v.v.
        """
        self._last_frame = frame
        result = {}
        
        # 1. Phân tích độ sâu
        depth_result = self.depth.predict_depth(frame)
        result['depth_map'] = depth_result.get('depth_map')
        result['colored_depth'] = depth_result.get('colored_depth')
        
        # 2. Phát hiện và nhận diện khuôn mặt
        faces = self.face_recognition.detect_faces(frame)
        result['faces'] = faces
        
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
            if face.kps is not None:
                try:
                    self.current_face_crop = face_align.norm_crop(frame, landmark=face.kps, image_size=112)
                except Exception as e:
                    self.system_logger.error(f"Error in face alignment: {e}")
                    # Fallback: Crop đơn giản nếu có lỗi
                    x1, y1, x2, y2 = [int(b) for b in face.bbox]
                    crop_img = frame[max(0, y1):min(frame.shape[0], y2), max(0, x1):min(frame.shape[1], x2)]
                    if crop_img.size > 0:
                        self.current_face_crop = cv2.resize(crop_img, (112, 112))
            
            # 6. Xác thực nếu có RFID
            if self.rfid.current_rfid:
                self.process_verification(face)
                # Update current RFID for backward compatibility
                self.current_rfid = self.rfid.current_rfid
                result['verification'] = self.verification_result
                
                # Cập nhật UI về kết quả xác thực
                if self.ui_callback and self.verification_result:
                    try:
                        self.ui_callback("verification_result", {
                            "result": self.verification_result,
                            "face_crop": self.current_face_crop,
                            "face_name": name,
                            "face_score": score,
                            "timestamp": time.time()
                        })
                    except Exception as e:
                        print(f"Error updating UI with verification: {e}")
        
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
        
        attendance_result = self.attendance.log_attendance(
            user_id=user_id,
            rfid_id=rfid_id,
            face_image=self.current_face_crop,
            status="SUCCESS" if self.verification_result["match"] and is_live_face else "FAILED"
        )
        
        # Cập nhật thêm thông tin cho verification result
        self.verification_result.update({
            "face_score": float(score),
            "is_live_face": is_live_face,
            "attendance_path": attendance_result.get("image_path", "") if attendance_result else ""
        })
        
        # Log thành công hoặc thất bại
        if self.verification_result["match"] and is_live_face:
            self.system_logger.info(f"Authentication successful for user: {user_id}, RFID: {rfid_id}")
            
            # Reset RFID sau khi xác thực thành công
            if self.verification_result["match"]:
                # Đợi một chút trước khi reset để UI có thời gian hiển thị
                threading.Timer(5.0, self.rfid.clear_current_rfid).start()
        else:
            self.system_logger.warning(f"Authentication failed: match={self.verification_result['match']}, live_face={is_live_face}")
        
        return self.verification_result
    
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
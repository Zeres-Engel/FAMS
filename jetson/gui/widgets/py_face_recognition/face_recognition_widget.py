import os
import cv2
import numpy as np
import threading
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
                             QGroupBox, QSizePolicy)
from PySide6.QtCore import Qt, QTimer, Signal
from PySide6.QtGui import QImage, QPixmap

# Import các module cần thiết từ ứng dụng gốc
from src.core.zensys_factory import get_default_instance

class FaceRecognitionWidget(QWidget):
    verification_reset = Signal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Thêm biến cache cho hình ảnh khuôn mặt
        self.cached_face_crop = None
        self.cached_face_image = None
        
        # Lock cho các hoạt động đồng bộ
        self.image_lock = threading.Lock()
        
        # Initialize face recognition system using the default instance
        self.face_system = get_default_instance()
        
        # Register UI callback
        self.face_system.set_ui_callback(self.on_system_callback)
        
        # Thiết lập giao diện
        self.setup_ui()
        
        # Set up webcam
        self.cap = cv2.VideoCapture(0)
        
        # Set up timer for frame updates
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_frame)
        self.timer.start(30)  # Update every 30ms
        
        # Set up timer for auto-reset
        self.reset_timer = QTimer()
        self.reset_timer.setSingleShot(True)  # Single shot timer
        self.reset_timer.timeout.connect(self.reset_verification)
        
    def setup_ui(self):
        # Main layout
        main_layout = QHBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        # Create left container for cameras that stretches to fill height
        left_container = QWidget()
        camera_layout = QHBoxLayout(left_container)
        camera_layout.setContentsMargins(0, 0, 0, 0)
        camera_layout.setSpacing(0)
        
        # Camera views take full height
        self.face_label = QLabel()
        self.face_label.setAlignment(Qt.AlignCenter)
        self.face_label.setStyleSheet("border-right: 1px solid #444;")
        self.face_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        
        self.depth_label = QLabel()
        self.depth_label.setAlignment(Qt.AlignCenter)
        self.depth_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        
        # Add camera views to left container
        camera_layout.addWidget(self.face_label)
        camera_layout.addWidget(self.depth_label)
        
        # Create compact right panel
        right_panel = QWidget()
        right_panel.setFixedWidth(350)
        right_panel.setStyleSheet("background-color: #222; border-left: 1px solid #444;")
        right_layout = QVBoxLayout(right_panel)
        right_layout.setContentsMargins(10, 10, 10, 10)
        right_layout.setSpacing(15)
        
        # More compact RFID ID display
        rfid_group = QGroupBox("RFID ID")
        rfid_group.setMinimumHeight(80)
        rfid_layout = QVBoxLayout(rfid_group)
        rfid_layout.setContentsMargins(10, 20, 10, 10)
        self.rfid_label = QLabel("Waiting for RFID scan...")
        self.rfid_label.setAlignment(Qt.AlignCenter)
        self.rfid_label.setStyleSheet("font-size: 16px; font-weight: bold;")
        rfid_layout.addWidget(self.rfid_label)
        
        # More compact Face crop display
        face_crop_group = QGroupBox("Face Verification")
        face_crop_group.setMinimumHeight(180)
        face_crop_layout = QVBoxLayout(face_crop_group)
        face_crop_layout.setContentsMargins(10, 20, 10, 10)
        self.face_crop_label = QLabel()
        self.face_crop_label.setAlignment(Qt.AlignCenter)
        self.face_crop_label.setMinimumHeight(120)
        face_crop_layout.addWidget(self.face_crop_label)
        
        # New: Depth face crop display
        depth_face_group = QGroupBox("Depth Face Analysis")
        depth_face_group.setMinimumHeight(180)
        depth_face_layout = QVBoxLayout(depth_face_group)
        depth_face_layout.setContentsMargins(10, 20, 10, 10)
        self.depth_face_label = QLabel()
        self.depth_face_label.setAlignment(Qt.AlignCenter)
        self.depth_face_label.setMinimumHeight(120)
        depth_face_layout.addWidget(self.depth_face_label)
        
        # More compact Verification result display
        verification_group = QGroupBox("Verification Result")
        verification_group.setMinimumHeight(150)
        verification_layout = QVBoxLayout(verification_group)
        verification_layout.setContentsMargins(10, 20, 10, 10)
        self.verification_label = QLabel("No verification yet")
        self.verification_label.setAlignment(Qt.AlignCenter)
        self.verification_label.setStyleSheet("font-size: 16px; font-weight: bold;")
        self.verification_label.setWordWrap(True)
        verification_layout.addWidget(self.verification_label)
        
        # Add panels to right layout
        right_layout.addWidget(rfid_group)
        right_layout.addWidget(face_crop_group)
        right_layout.addWidget(depth_face_group)
        right_layout.addWidget(verification_group)
        
        # Add main panels to main layout
        main_layout.addWidget(left_container, 1)
        main_layout.addWidget(right_panel, 0)
    
    def update_frame(self):
        ret, frame = self.cap.read()
        if ret:
            # Tạo một bản copy của frame gốc để xử lý face detection
            display_frame = frame.copy()
            
            # Lưu frame hiện tại vào face_system để sử dụng cho face cropping
            self.face_system._last_frame = frame.copy()
            
            # Process depth estimation - chỉ cập nhật nếu không trong trạng thái paused
            if not hasattr(self.face_system, 'depth_display_paused') or not self.face_system.depth_display_paused:
                depth_result = self.face_system.depth_predictor.predict_depth(frame)
                depth_map = depth_result['colored_depth']
            else:
                # Nếu đang tạm dừng, sử dụng depth map đã lưu
                if hasattr(self.face_system, 'last_depth_result') and self.face_system.last_depth_result:
                    depth_map = self.face_system.last_depth_result.get('colored_depth')
                else:
                    depth_result = self.face_system.depth_predictor.predict_depth(frame)
                    depth_map = depth_result['colored_depth']
                    self.face_system.last_depth_result = depth_result
            
            # Thực hiện face detection - ZenFace.get() đã được tối ưu để chỉ trả về khuôn mặt lớn nhất
            faces = self.face_system.face_analyzer.get(display_frame)
            
            # Vẽ bounding box cho khuôn mặt lớn nhất (nếu có)
            if faces:
                # Chỉ lấy khuôn mặt lớn nhất (mảng faces chỉ có 1 phần tử)
                face = faces[0]
                bbox = face.bbox
                x1, y1, x2, y2 = [int(b) for b in bbox]
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                
                # Xử lý depth map cho anti-spoofing chỉ khi không trong trạng thái paused
                if not hasattr(self.face_system, 'depth_display_paused') or not self.face_system.depth_display_paused:
                    depth_map_raw = cv2.cvtColor(depth_map, cv2.COLOR_BGR2GRAY) 
                    anti_spoof_result = self.face_system.process_depth_anti_spoofing(
                        depth_map_raw, face)
                    
                    # Hiển thị kết quả anti-spoofing
                    if anti_spoof_result is not None:
                        result_text = anti_spoof_result["detection_result"].upper()
                        color = (0, 255, 0) if result_text == "LIVE" else (0, 0, 255)
                        
                        # Hiển thị trạng thái của tính năng anti-spoofing
                        if self.face_system.face_anti.enable:
                            status_text = f"Face: {result_text}"
                        else:
                            status_text = "Face Anti-Spoofing: DISABLED"
                            
                        cv2.putText(display_frame, status_text, (x1, y2+25), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)
                        
                        # Hiển thị giá trị variance và mean_gradient với màu khác
                        variance_text = f"Variance: {anti_spoof_result['depth_variance']:.2f}"
                        mean_grad_text = f"Mean Gradient: {anti_spoof_result['mean_gradient']:.2f}"
                        
                        # Sử dụng màu cam cho variance
                        cv2.putText(display_frame, variance_text, (x1, y2+50), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 165, 255), 2)
                        
                        # Sử dụng màu tím cho mean_gradient
                        cv2.putText(display_frame, mean_grad_text, (x1, y2+75), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 255), 2)
                        
                        # Hiển thị min/max depth
                        min_depth_text = f"Min Depth: {anti_spoof_result['min_depth']:.2f}"
                        max_depth_text = f"Max Depth: {anti_spoof_result['max_depth']:.2f}"
                        depth_range_text = f"Depth Range: {anti_spoof_result['depth_range']:.2f}"
                        
                        # Sử dụng màu xanh lá cho min depth
                        cv2.putText(display_frame, min_depth_text, (x1, y2+100), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                        
                        # Sử dụng màu đỏ cho max depth
                        cv2.putText(display_frame, max_depth_text, (x1, y2+125), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                        
                        # Sử dụng màu vàng cho depth range
                        cv2.putText(display_frame, depth_range_text, (x1, y2+150), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
                        
                        # Hiển thị depth face crop
                        if self.face_system.depth_face_crop is not None:
                            depth_face = self.face_system.depth_face_crop
                            if depth_face.size > 0:
                                # Trực tiếp hiển thị depth face từ numpy array
                                self.display_image_from_array(depth_face, self.depth_face_label)
            
            # Xử lý RFID và face recognition khi có RFID đã quét
            if self.face_system.current_rfid and faces:
                # Hiển thị RFID ID
                self.rfid_label.setText(f"ID: {self.face_system.current_rfid}")
                
                # Khuôn mặt lớn nhất đã được phát hiện và chưa được xác thực
                if not self.face_system.verification_result:
                    # Khuôn mặt lớn nhất được phát hiện
                    face = faces[0]
                    
                    # Đính kèm frame gốc cho face alignment
                    face.img = frame.copy()
                    
                    # Xử lý xác thực với khuôn mặt lớn nhất
                    verification_result = self.face_system.process_verification(face)
                    
                    # Lấy và lưu hình ảnh khuôn mặt trực tiếp từ kết quả xác thực nếu có
                    if verification_result and "face_crop" in verification_result:
                        with self.image_lock:
                            self.cached_face_image = verification_result["face_crop"].copy()
                    elif verification_result and "face_crop_path" in verification_result:
                        self.cached_face_crop_path = verification_result["face_crop_path"]
                        # Nếu chỉ có đường dẫn, tải hình ảnh vào bộ nhớ trong một luồng riêng
                        threading.Thread(target=self.load_image_from_path_async, 
                                      args=(verification_result["face_crop_path"],)).start()
            
                    if verification_result:
                        # Hiển thị kết quả xác thực
                        match = verification_result["match"]
                        rfid_name = verification_result["rfid_name"]
                        face_name = verification_result["face_name"]
                        
                        # Hiển thị tên trên khuôn mặt đã xác thực
                        display_text = f"{face_name}"
                        cv2.putText(display_frame, display_text, (x1, y1-10), 
                                  cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
                        
                        # Hiển thị kết quả xác thực
                        if match:
                            result_text = f"AUTHENTICATION SUCCESSFUL\nName: {face_name}"
                            color = "color: green;"
                        else:
                            result_text = f"AUTHENTICATION FAILED\nRFID: {rfid_name}\nFace: {face_name}"
                            color = "color: red;"
                        
                        # Thêm kết quả anti-spoofing vào thông báo xác thực
                        if self.face_system.anti_spoofing_result:
                            anti_spoof_text = self.face_system.anti_spoofing_result.upper()
                            result_text += f"\nFace Detection: {anti_spoof_text}"
                            if anti_spoof_text == "SPOOF":
                                color = "color: red;"
                        
                        self.verification_label.setText(result_text)
                        self.verification_label.setStyleSheet(f"font-size: 16px; font-weight: bold; {color}")
                        
                        # Bắt đầu đếm ngược để reset và chờ quẹt RFID tiếp theo
                        self.reset_timer.start(10000)  # 10 giây
                
                # Hiển thị ảnh khuôn mặt, ưu tiên sử dụng dữ liệu ảnh trực tiếp nếu có
                with self.image_lock:
                    if hasattr(self.face_system, "current_face_image") and self.face_system.current_face_image is not None:
                        # Hiển thị trực tiếp từ numpy array
                        self.display_image_from_array(self.face_system.current_face_image.copy(), self.face_crop_label)
                    elif hasattr(self, "cached_face_image") and self.cached_face_image is not None:
                        # Hiển thị từ cached numpy array
                        self.display_image_from_array(self.cached_face_image.copy(), self.face_crop_label)
                    else:
                        # Fallback sang phương thức cũ sử dụng đường dẫn ảnh
                        face_crop_path_to_display = None
                        if hasattr(self.face_system, "current_face_crop_path") and self.face_system.current_face_crop_path:
                            face_crop_path_to_display = self.face_system.current_face_crop_path
                        elif hasattr(self, "cached_face_crop_path") and self.cached_face_crop_path:
                            face_crop_path_to_display = self.cached_face_crop_path
                        
                        if face_crop_path_to_display:
                            if os.path.exists(face_crop_path_to_display):
                                # Vẫn sử dụng phương thức cũ nhưng đã được tối ưu hóa
                                self.display_image_from_path(face_crop_path_to_display, self.face_crop_label)
                            else:
                                self.face_crop_label.setText("Image file not found")
                        else:
                            self.face_crop_label.setText("No face image")
            
            # Hiển thị frame đã xử lý detection
            face_rgb = cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)
            face_h, face_w, face_ch = face_rgb.shape
            face_bytes_per_line = face_ch * face_w
            face_qt_image = QImage(face_rgb.data, face_w, face_h, 
                                 face_bytes_per_line, QImage.Format_RGB888)
            self.face_label.setPixmap(QPixmap.fromImage(face_qt_image).scaled(
                self.face_label.width(), self.face_label.height(), Qt.KeepAspectRatio, Qt.SmoothTransformation))
            
            # Hiển thị depth map
            depth_h, depth_w, depth_ch = depth_map.shape
            depth_bytes_per_line = depth_ch * depth_w
            depth_qt_image = QImage(depth_map.data, depth_w, depth_h, 
                                  depth_bytes_per_line, QImage.Format_RGB888)
            self.depth_label.setPixmap(QPixmap.fromImage(depth_qt_image).scaled(
                self.depth_label.width(), self.depth_label.height(), Qt.KeepAspectRatio, Qt.SmoothTransformation))
    
    def load_image_from_path_async(self, image_path):
        """
        Tải hình ảnh từ đường dẫn vào bộ nhớ trong một luồng riêng
        """
        if not image_path or not os.path.exists(image_path):
            return
            
        try:
            # Đọc hình ảnh từ file
            image = cv2.imread(image_path)
            if image is not None and image.size > 0:
                # Lưu vào cache
                with self.image_lock:
                    self.cached_face_image = image.copy()
        except Exception as e:
            print(f"Error loading image asynchronously: {e}")

    def reset_verification(self):
        """Reset verification after timer expires"""
        # Lưu bản sao đường dẫn ảnh và dữ liệu ảnh vào cache trước khi reset
        if hasattr(self.face_system, "current_face_crop_path") and self.face_system.current_face_crop_path:
            self.cached_face_crop_path = self.face_system.current_face_crop_path
        
        with self.image_lock:
            if hasattr(self.face_system, "current_face_image") and self.face_system.current_face_image is not None:
                self.cached_face_image = self.face_system.current_face_image.copy()
        
        # Reset trạng thái RFID trong hệ thống
        self.face_system.current_rfid = None
        
        # Reset các thông tin kết quả xác thực
        self.face_system.verification_result = None
        
        # Reset các giá trị thống kê
        if hasattr(self.face_system, 'depth_variance'):
            self.face_system.depth_variance = None
        if hasattr(self.face_system, 'mean_gradient'):
            self.face_system.mean_gradient = None
        if hasattr(self.face_system, 'min_depth'):
            self.face_system.min_depth = None
        if hasattr(self.face_system, 'max_depth'):
            self.face_system.max_depth = None
        if hasattr(self.face_system, 'depth_range'):
            self.face_system.depth_range = None
        if hasattr(self.face_system, 'criteria_status'):
            self.face_system.criteria_status = None
        
        # Cập nhật giao diện người dùng
        self.rfid_label.setText("Waiting for RFID scan...")
        self.verification_label.setText("No verification yet")
        self.verification_label.setStyleSheet("font-size: 16px; font-weight: bold;")
        
        # Reset depth face image label
        self.depth_face_label.clear()
        self.depth_face_label.setText("")
        
        # Reset face crop label
        self.face_crop_label.clear()
        self.face_crop_label.setText("")
        
        # Bật lại hiển thị depth map trong ZenSys
        if hasattr(self.face_system, 'depth_display_paused'):
            self.face_system.depth_display_paused = False
            
        # Emit signal
        self.verification_reset.emit()
    
    def keyPressEvent(self, event):
        # Reset xác thực khi nhấn phím R
        if event.key() == Qt.Key_R:
            self.reset_verification()
        super().keyPressEvent(event)
    
    def closeEvent(self, event):
        self.face_system.stop_rfid_listening()
        self.cap.release()
        event.accept()

    def display_image_from_array(self, image_array, label, keep_aspect_ratio=True):
        """
        Hiển thị ảnh trực tiếp từ numpy array lên QLabel
        """
        if image_array is None or image_array.size == 0:
            label.setText("No image available")
            return False
        
        try:
            # Chuyển từ BGR sang RGB
            rgb_image = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
            h, w, ch = rgb_image.shape
            bytes_per_line = ch * w
            
            # Tạo QImage và QPixmap
            qt_image = QImage(rgb_image.data, w, h, bytes_per_line, QImage.Format_RGB888)
            pixmap = QPixmap.fromImage(qt_image)
            
            # Hiển thị ảnh lên label
            if keep_aspect_ratio:
                label.setPixmap(pixmap.scaled(
                    label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation))
            else:
                label.setPixmap(pixmap.scaled(
                    label.size(), Qt.IgnoreAspectRatio, Qt.SmoothTransformation))
            
            return True
        except Exception as e:
            label.setText(f"Error displaying image")
            return False

    def display_image_from_path(self, image_path, label, keep_aspect_ratio=True):
        """
        Hiển thị ảnh từ đường dẫn lên QLabel
        """
        if not image_path or not os.path.exists(image_path):
            label.setText("No image available")
            return False
        
        try:
            # Đọc ảnh từ file
            image = cv2.imread(image_path)
            if image is None or image.size == 0:
                # Đọc thất bại, thử đọc bằng cách khác
                try:
                    with open(image_path, 'rb') as f:
                        image_array = np.asarray(bytearray(f.read()), dtype=np.uint8)
                        image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)
                except Exception:
                    pass
                
                if image is None:
                    label.setText("Failed to load image")
                    return False
            
            # Sử dụng phương thức hiển thị ảnh từ array
            return self.display_image_from_array(image, label, keep_aspect_ratio)
        except Exception as e:
            label.setText(f"Error loading image")
            return False

    def on_system_callback(self, action, data):
        """Xử lý callback từ hệ thống ZenSys"""
        if action == "reset_verification":
            self.reset_verification()
        elif action == "rfid_updated":
            self.rfid_label.setText(f"ID: {data.get('rfid_id', '')}")
        elif action == "verification_result":
            # Xử lý kết quả xác thực
            result = data.get("result", {})
            match = result.get("match", False)
            face_name = data.get("face_name", "Unknown")
            
            # Kiểm tra nếu có dữ liệu ảnh trực tiếp từ callback
            if "face_image" in data:
                with self.image_lock:
                    self.cached_face_image = data["face_image"].copy()
                    if hasattr(self.face_system, "current_face_image"):
                        self.face_system.current_face_image = data["face_image"].copy()
                # Hiển thị ảnh trực tiếp
                self.display_image_from_array(data["face_image"].copy(), self.face_crop_label)
            
            if match:
                result_text = f"AUTHENTICATION SUCCESSFUL\nName: {face_name}"
                color = "color: green;"
            else:
                result_text = f"AUTHENTICATION FAILED"
                color = "color: red;"
            
            self.verification_label.setText(result_text)
            self.verification_label.setStyleSheet(f"font-size: 16px; font-weight: bold; {color}") 
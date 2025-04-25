from PySide6.QtWidgets import (QMainWindow, QWidget, QVBoxLayout, 
                             QHBoxLayout, QLabel, QGroupBox, QSizePolicy)
from PySide6.QtCore import Qt, QTimer
from PySide6.QtGui import QImage, QPixmap
import cv2

from src.core.zensys import ZenSys
from utils.config_utils import config
import os

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Face Recognition & Depth Estimation with RFID")
        self.setMinimumSize(1280, 720)
        
        # Initialize face recognition system
        self.face_system = ZenSys()
        if not os.path.exists(os.path.join(config.db_path, "face_index.faiss")):
            self.face_system.process_gallery()
        self.face_system.load_database()
        
        # Create main widget with no margins
        main_widget = QWidget()
        self.setCentralWidget(main_widget)
        main_layout = QHBoxLayout(main_widget)
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
        
        # Start RFID listening after UI setup
        self.face_system.start_rfid_listening()
        
        # Ensure window doesn't have focus indicators
        self.setFocusPolicy(Qt.NoFocus)
        
    def update_frame(self):
        ret, frame = self.cap.read()
        if ret:
            # Tạo một bản copy của frame gốc để xử lý face detection
            display_frame = frame.copy()
            
            # Lưu frame hiện tại vào face_system để sử dụng cho face cropping
            self.face_system._last_frame = frame.copy()
            
            # Process depth estimation 
            depth_result = self.face_system.depth_predictor.predict_depth(frame)
            depth_map = depth_result['colored_depth']
            
            # Thực hiện face detection - ZenFace.get() đã được tối ưu để chỉ trả về khuôn mặt lớn nhất
            faces = self.face_system.face_analyzer.get(display_frame)
            
            # Vẽ bounding box cho khuôn mặt lớn nhất (nếu có)
            if faces:
                # Chỉ lấy khuôn mặt lớn nhất (mảng faces chỉ có 1 phần tử)
                face = faces[0]
                bbox = face.bbox
                x1, y1, x2, y2 = [int(b) for b in bbox]
                cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                
                # Xử lý depth map cho anti-spoofing
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
                    
                    # Hiển thị giá trị ngưỡng
                    thresh_var = f"Var Thresh: {self.face_system.face_anti.var_thresh:.2f}"
                    thresh_grad = f"Grad Thresh: {self.face_system.face_anti.grad_thresh:.2f}"
                    thresh_range = f"Range Thresh: {self.face_system.face_anti.depth_range_thresh:.2f}"
                    thresh_min = f"Min Thresh: {self.face_system.face_anti.min_depth_thresh:.2f}"
                    thresh_max = f"Max Thresh: {self.face_system.face_anti.max_depth_thresh:.2f}"
                    
                    # Hiển thị thông tin về ngưỡng ở bên phải ảnh
                    right_x = x2 + 10
                    cv2.putText(display_frame, thresh_var, (right_x, y1+25), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                    cv2.putText(display_frame, thresh_grad, (right_x, y1+50), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                    cv2.putText(display_frame, thresh_range, (right_x, y1+75), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                    cv2.putText(display_frame, thresh_min, (right_x, y1+100), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                    cv2.putText(display_frame, thresh_max, (right_x, y1+125), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                    
                    # Hiển thị phương pháp chuẩn hóa
                    norm_method = self.face_system.face_anti.normalize_method
                    cv2.putText(display_frame, f"Normalize: {norm_method}", (right_x, y1+150), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                    
                    # Hiển thị lý do phát hiện spoofing nếu kết quả là spoofing
                    if result_text == "SPOOF" and "criteria_status" in anti_spoof_result:
                        criteria = anti_spoof_result["criteria_status"]
                        failed_criteria = [key.replace("_pass", "") for key, value in criteria.items() if not value]
                        
                        if failed_criteria:
                            fail_text = f"Failed: {', '.join(failed_criteria)}"
                            cv2.putText(display_frame, fail_text, (x1, y2+175), 
                                      cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)
                    
                    # Hiển thị depth face crop
                    if self.face_system.depth_face_crop is not None:
                        depth_face = self.face_system.depth_face_crop
                        if depth_face.size > 0:
                            depth_face_rgb = cv2.cvtColor(depth_face, cv2.COLOR_BGR2RGB)
                            depth_face_h, depth_face_w, depth_face_ch = depth_face_rgb.shape
                            depth_face_bytes_per_line = depth_face_ch * depth_face_w
                            depth_face_qt_image = QImage(depth_face_rgb.data, depth_face_w, depth_face_h, 
                                                  depth_face_bytes_per_line, QImage.Format_RGB888)
                            self.depth_face_label.setPixmap(QPixmap.fromImage(depth_face_qt_image).scaled(
                                self.depth_face_label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation))
            
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
                        
                        # Bắt đầu đếm ngược 3 giây để reset và chờ quẹt RFID tiếp theo
                        self.reset_timer.start(3000)  # 3 seconds
                
                # Hiển thị ảnh khuôn mặt đã crop và align (nếu có)
                if self.face_system.current_face_crop is not None:
                    face_crop = self.face_system.current_face_crop
                    if face_crop.size > 0:
                        face_crop_rgb = cv2.cvtColor(face_crop, cv2.COLOR_BGR2RGB)
                        face_crop_h, face_crop_w, face_crop_ch = face_crop_rgb.shape
                        face_crop_bytes_per_line = face_crop_ch * face_crop_w
                        face_crop_qt_image = QImage(face_crop_rgb.data, face_crop_w, face_crop_h, 
                                              face_crop_bytes_per_line, QImage.Format_RGB888)
                        self.face_crop_label.setPixmap(QPixmap.fromImage(face_crop_qt_image).scaled(
                            self.face_crop_label.size(), Qt.KeepAspectRatio, Qt.SmoothTransformation))
            
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
    
    def reset_verification(self):
        """Reset verification after timer expires (3 seconds)"""
        self.face_system.current_rfid = None
        self.face_system.current_face_crop = None
        self.face_system.verification_result = None
        self.face_system.depth_face_crop = None
        self.face_system.anti_spoofing_result = None
        
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
        
        self.rfid_label.setText("Waiting for RFID scan...")
        self.verification_label.setText("No verification yet")
        self.verification_label.setStyleSheet("font-size: 16px; font-weight: bold;")
        self.face_crop_label.clear()
        self.depth_face_label.clear()
    
    def keyPressEvent(self, event):
        # Reset xác thực khi nhấn phím R
        if event.key() == Qt.Key_R:
            self.reset_verification()
        super().keyPressEvent(event)
        
    def closeEvent(self, event):
        self.face_system.stop_rfid_listening()
        self.cap.release()
        event.accept()
        
    # Override focus events to ensure no visible focus
    def focusInEvent(self, event):
        self.clearFocus()
        super().focusInEvent(event)
        
    def showEvent(self, event):
        super().showEvent(event)
        # Ensure no widget has focus when window is shown
        self.clearFocus() 
import os
import sys
import cv2
import time
import signal
import numpy as np
import threading
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
                             QGroupBox, QSizePolicy, QFrame, QApplication)
from PySide6.QtCore import Qt, QTimer, Signal, QPropertyAnimation, QEasingCurve, QRect, QSize, Property, QThread, QMutex, QMetaObject, Slot, Q_ARG
from PySide6.QtGui import QImage, QPixmap, QColor, QPainter, QPen, QFont

# Import các module cần thiết từ ứng dụng gốc
from src.core.zensys_factory import get_default_instance
# Import custom notification popup
from gui.widgets.py_notification_popup.notification_popup import NotificationPopup

# Import ZenSys specific libraries (if they exist in the project)
try:
    from apps.face_recognition_api.utils.commons import generate_random_id
except ImportError:
    def generate_random_id(length=10):
        import random
        import string
        return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

class FaceRecognitionWidget(QWidget):
    verification_reset = Signal()
    verification_complete = Signal(dict)
    verification_signal = Signal(object)  # New signal for verification data
    api_error_signal = Signal(str, str)  # New signal for API errors (title, message)
    
    def __init__(
        self,
        parent=None,
        app_parent=None,
        camera_id=0,
        capture_width=640,
        capture_height=480,
        recognition_interval=1.0,
    ):
        super().__init__(parent)
        
        # Save parent widget reference
        self.parent = parent
        self.app_parent = app_parent
        
        # Set basic widget properties
        self.resize(parent.width() if parent else 640, parent.height() if parent else 480)
        
        # Camera settings
        self.camera_id = camera_id
        self.capture_width = capture_width
        self.capture_height = capture_height
        self.recognition_interval = recognition_interval
        
        # Thread safety
        self.mutex = QMutex()
        self.image_lock = threading.Lock()
        
        # State flags
        self.processing_paused = False
        self.active_notification = False
        self.is_capturing = False
        self.has_rfid = False
        self.session_id = generate_random_id(length=10)
        self.pending_notification = None
        
        # Initialize ZenSys face system
        self.face_system = get_default_instance()
        
        # Ensure system properties exist
        if not hasattr(self.face_system, '_last_frame'):
            self.face_system._last_frame = None
        
        # Start camera if not already started
        if hasattr(self.face_system, 'camera') and self.face_system.camera is None:
            print("Starting camera in ZenSys...")
            self.face_system.start_camera()
            
        # Register callback for system events
        self.face_system.set_ui_callback(self.on_system_callback)
        
        # Connect verification signal to slot - nhận kết quả xác thực
        self.verification_signal.connect(self.show_verification_popup)
        self.api_error_signal.connect(self.show_api_error)
        
        # Setup UI components
        self.setup_ui()
        
        # Create timers in the UI thread
        self.frame_timer = QTimer(self)
        self.frame_timer.timeout.connect(self.request_frame)
        self.frame_timer.start(30)  # 30ms for ~30fps
        
        self.reset_timer = QTimer(self)
        self.reset_timer.setSingleShot(True)
        self.reset_timer.timeout.connect(self.reset_verification)
        
        self.notification_timer = QTimer(self)
        self.notification_timer.setSingleShot(True)
        self.notification_timer.timeout.connect(self.handle_pending_notification)
    
    def setup_ui(self):
        """Initialize UI components"""
        # Main layout
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)
        
        # Camera view
        self.face_label = QLabel()
        self.face_label.setAlignment(Qt.AlignCenter)
        self.face_label.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Expanding)
        
        # Add to layout
        main_layout.addWidget(self.face_label)
        
        # Create notification popup in UI thread
        self.notification_popup = NotificationPopup(self)
        self.notification_popup.closed.connect(self.on_notification_closed)
    
    @Slot()
    def on_notification_closed(self):
        """Handle notification closed event in UI thread"""
        print("Notification closed, resuming processing")
        self.active_notification = False
        
        # Check for pending notifications
        if self.pending_notification:
            self.notification_timer.start(100)  # Small delay before showing next notification
    
    def request_frame(self):
        """Request a new frame from the face system (called in UI thread)"""
        # Skip if notification is active
        if self.active_notification:
            return
            
        # Get the latest processed frame
        result = self.face_system.get_latest_processed_frame()
        
        # If no frame is available, try to get one directly
        if self.face_system._last_frame is None:
            if hasattr(self.face_system, 'camera') and self.face_system.camera:
                try:
                    ret, frame = self.face_system.camera.read()
                    if ret:
                        self.face_system._last_frame = frame
                except Exception as e:
                    print(f"Error capturing frame: {e}")
                    return
            else:
                return
        
        # Update UI if frame exists
        if self.face_system._last_frame is not None:
            self.update_ui_with_result(result)
    
    def update_ui_with_result(self, result):
        """Update UI with the latest frame and detection results"""
        # Ensure frame exists
        if not hasattr(self.face_system, '_last_frame') or self.face_system._last_frame is None:
            return
            
        # Create a copy to avoid modifying the original
        display_frame = self.face_system._last_frame.copy()
        
        # Get face detection results
        faces = self.face_system.face_analyzer.get(display_frame)
        
        # Draw bounding box if faces detected
        if faces:
            face = faces[0]
            bbox = face.bbox
            x1, y1, x2, y2 = [int(b) for b in bbox]
            cv2.rectangle(display_frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Convert to RGB for Qt
        rgb_frame = cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)
        h, w, ch = rgb_frame.shape
        
        # Create QImage and pixmap
        q_img = QImage(rgb_frame.data, w, h, ch * w, QImage.Format_RGB888)
        pixmap = QPixmap.fromImage(q_img)
        
        # Scale with aspect ratio
        scaled_pixmap = pixmap.scaled(
            self.face_label.width(), 
            self.face_label.height(),
            Qt.KeepAspectRatio, 
            Qt.SmoothTransformation
        )
        
        # Set pixmap to label
        self.face_label.setPixmap(scaled_pixmap)
    
    @Slot(object)
    def show_verification_popup(self, verification_result):
        """Display verification result popup"""
        try:
            # Mark notification as active
            self.active_notification = True
            print(f"Showing verification popup with result: {verification_result.get('match', False)}")
            
            # Extract verification data
            match = verification_result.get("match", False)
            rfid_name = verification_result.get("rfid_name", "Unknown")
            face_name = verification_result.get("face_name", "Unknown")
            match_score = verification_result.get("face_score", 0)
            rfid_id = verification_result.get("rfid_id", "")
            timestamp = verification_result.get("timestamp", "")
            is_live_face = verification_result.get("is_live_face", True)
            
            # Use current time if no timestamp provided
            if not timestamp:
                from datetime import datetime
                current_time = datetime.now().strftime("%H:%M:%S - %d/%m/%Y")
            else:
                current_time = timestamp
            
            # Check if notification is already visible
            if hasattr(self, 'notification_popup') and self.notification_popup.isVisible():
                # Force-close current notification if it's taking too long
                if hasattr(self.notification_popup, '_is_visible') and self.notification_popup._is_visible:
                    print("Closing previous notification to show new one")
                    self.notification_popup.hide_popup()
                    # Small delay to ensure UI updates
                    QTimer.singleShot(100, lambda: self._show_verification_notification(
                        match, rfid_id, face_name, match_score, current_time, rfid_name, is_live_face
                    ))
                    return
                
            # Show the notification directly if none is active
            self._show_verification_notification(match, rfid_id, face_name, match_score, current_time, rfid_name, is_live_face)
            
        except Exception as e:
            print(f"Error in show_verification_popup: {e}")
            import traceback
            traceback.print_exc()
            
            # Force reset on error
            self.active_notification = False
            
            # Try to show a simple notification
            try:
                if match:
                    self.notification_popup.show_popup("✅ XÁC THỰC THÀNH CÔNG", f"ID: {rfid_id}", True, True, 5000)
                else:
                    self.notification_popup.show_popup("❌ XÁC THỰC THẤT BẠI", f"ID: {rfid_id}", False, True, 5000)
            except:
                # Last resort - force reset everything
                QTimer.singleShot(500, self.reset_verification)
    
    def _show_verification_notification(self, match, rfid_id, face_name, match_score, current_time, rfid_name, is_live_face):
        """Display verification result notification with comprehensive error handling"""
        try:
            # Force notification popup to parent if needed
            if not self.notification_popup.parent():
                self.notification_popup.setParent(self)
                
            # Make sure it's not hidden
            if not self.notification_popup.isVisible():
                self.notification_popup.show()
                
            # Handle fake face detection (anti-spoofing failure)
            if not is_live_face:
                title = "❌ PHÁT HIỆN GƯƠNG MẶT GIẢ MẠO"
                info_text = f"ID: {rfid_id}\nTên: {rfid_name}\nThời gian: {current_time}\n\nHệ thống phát hiện gương mặt giả mạo.\nVui lòng sử dụng khuôn mặt thật."
                self.notification_popup.show_popup(title, info_text, False, True, 8000)
                print(f"Showing fake face detection alert for {face_name}")
                return
                
            # TRƯỜNG HỢP 1: RFID và khuôn mặt khớp (xác thực thành công)
            if match:
                title = "✅ XÁC THỰC THÀNH CÔNG"
                info_text = f"ID: {rfid_id}\nTên: {face_name}\nĐiểm số: {match_score:.2f}\nThời gian: {current_time}"
                self.notification_popup.show_popup(title, info_text, True, True, 8000)
                print(f"Showing success notification for {face_name}")
            else:
                # Không khớp - kiểm tra thêm trường hợp
                if face_name == "Unknown":
                    # TRƯỜNG HỢP 2: Khuôn mặt không nhận dạng được (Unknown)
                    title = "❌ LỖI XÁC THỰC KHUÔN MẶT"
                    info_text = f"ID: {rfid_id}\nRFID: {rfid_name}\nKhuôn mặt: Không nhận dạng được\nThời gian: {current_time}\n\nHệ thống không thể nhận dạng khuôn mặt của bạn.\nVui lòng thử lại hoặc liên hệ quản trị viên."
                    self.notification_popup.show_popup(title, info_text, False, True, 8000)
                    print(f"Showing unknown face notification for RFID: {rfid_name}")
                else:
                    # TRƯỜNG HỢP 3: Khuôn mặt là người khác (giả mạo)
                    title = "⚠️ CẢNH BÁO GIẢ MẠO KHUÔN MẶT"
                    info_text = f"ID: {rfid_id}\nThẻ RFID: {rfid_name}\nKhuôn mặt: {face_name}\nĐiểm số: {match_score:.2f}\nThời gian: {current_time}\n\nPhát hiện nghi vấn giả mạo! Khuôn mặt không khớp với chủ thẻ RFID."
                    self.notification_popup.show_popup(title, info_text, False, True, 8000)
                    print(f"Showing face spoofing warning: {face_name} using RFID of {rfid_name}")
        except Exception as e:
            print(f"Error showing notification: {e}")
            import traceback
            traceback.print_exc()
            # Auto-recover by resetting
            self.active_notification = False  # Reset flag on error
            # Force-show a simplified notification
            try:
                if match:
                    self.notification_popup.show_popup("✅ XÁC THỰC THÀNH CÔNG", f"ID: {rfid_id}", True, True, 5000)
                else:
                    self.notification_popup.show_popup("❌ XÁC THỰC THẤT BẠI", f"ID: {rfid_id}", False, True, 5000)
            except:
                pass
    
    @Slot(str, str)
    def show_api_error(self, title, message):
        """Display API error notification"""
        try:
            # Force notification popup to parent if needed
            if not self.notification_popup.parent():
                self.notification_popup.setParent(self)
                
            # Make sure it's not hidden
            if not self.notification_popup.isVisible():
                self.notification_popup.show()
                
            # If another notification is visible, queue this one
            if self.notification_popup.isVisible() and self._is_notification_active():
                print("Queueing API error notification")
                self.pending_notification = {
                    "api_error": True,
                    "title": title,
                    "message": message
                }
                return
                
            # Show API error notification
            self.notification_popup.show_popup(title, message, False, True, 8000)
            print(f"Showing API error notification: {title}")
            
        except Exception as e:
            print(f"Error showing API error notification: {e}")
            import traceback
            traceback.print_exc()
    
    def _is_notification_active(self):
        """Check if notification is currently active"""
        return self.active_notification or (hasattr(self.notification_popup, '_is_visible') and self.notification_popup._is_visible)
    
    @Slot()
    def handle_pending_notification(self):
        """Handle displaying queued notifications"""
        if self.pending_notification:
            print("Processing pending notification from queue")
            
            # Extract notification data
            notif = self.pending_notification
            self.pending_notification = None
            
            # Check if this is an API error notification
            if notif.get("api_error", False):
                self.show_api_error(notif["title"], notif["message"])
                return
            
            # Otherwise it's a verification notification
            self._show_verification_notification(
                notif.get("match", False),
                notif.get("rfid_id", ""),
                notif.get("face_name", "Unknown"),
                notif.get("face_score", 0),
                notif.get("timestamp", ""),
                notif.get("rfid_name", "Unknown"),
                notif.get("is_live_face", True)
            )
        else:
            print("No pending notifications in queue")
    
    @Slot()
    def reset_verification(self):
        """Reset verification state"""
        print("Resetting face recognition verification state")
        
        try:
            # Close any active notification
            if self.notification_popup.isVisible():
                print("Closing notification during reset")
                # Use direct call instead of invoke method to avoid race conditions
                self.notification_popup.hide_popup()
            
            # Reset flags immediately
            self.active_notification = False
            self.pending_notification = None
            
            # Reset face system state - be thorough to ensure nothing is left behind
            if hasattr(self.face_system, "current_rfid"):
                self.face_system.current_rfid = None
                
            if hasattr(self.face_system, "rfid"):
                if hasattr(self.face_system.rfid, "current_rfid"):
                    self.face_system.rfid.current_rfid = None
                    
            if hasattr(self.face_system, "_last_rfid_id"):
                self.face_system._last_rfid_id = None
                
            if hasattr(self.face_system, "verification_result"):
                self.face_system.verification_result = None
                
            if hasattr(self.face_system, "verification_in_progress"):
                self.face_system.verification_in_progress = False
                
            if hasattr(self.face_system, "processing_paused"):
                self.face_system.processing_paused = False
                
            if hasattr(self.face_system, "api_request_sent"):
                self.face_system.api_request_sent = False
            
            # Signal reset to parent components
            self.verification_reset.emit()
            
            print("Verification reset complete - system ready for new verification")
        except Exception as e:
            print(f"Error during verification reset: {e}")
            import traceback
            traceback.print_exc()
            
            # Force basic reset even if exception occurred
            self.active_notification = False
            if hasattr(self.face_system, "verification_in_progress"):
                self.face_system.verification_in_progress = False
            if hasattr(self.face_system, "processing_paused"):
                self.face_system.processing_paused = False
    
    def on_system_callback(self, action, data):
        """Handle callbacks from the ZenSys system"""
        print(f"Received system callback: {action}")
        
        try:
            # Ensure callbacks are processed in UI thread
            if action == "reset_verification":
                # Queue reset in UI thread
                QMetaObject.invokeMethod(self, "reset_verification",
                                      Qt.QueuedConnection)
            
            elif action == "rfid_updated":
                print(f"RFID detected: {data.get('rfid_id', 'unknown')}")
                
                # Close any active notification
                if hasattr(self, 'notification_popup') and self.notification_popup.isVisible():
                    print("Closing notification due to new RFID scan")
                    # Use direct call for simplicity and guaranteed thread safety
                    QMetaObject.invokeMethod(self.notification_popup, "hide_popup",
                                          Qt.QueuedConnection)
                
                # Reset notification state
                self.active_notification = False
                
            elif action == "verification_result":
                # Dữ liệu verification đã được đơn giản hóa từ ZenSys
                is_match = data.get("match", False)
                print(f"Processing verification result: match={is_match}")
                
                # Emit signal with result (safe for cross-thread)
                # Không cần truy cập data.get("result") nữa vì data đã là kết quả đơn giản
                self.verification_signal.emit(data)
                
                # Also emit completion signal for other components
                self.verification_complete.emit(data)
            
            elif action == "api_error":
                # Handle API errors
                error_type = data.get("error_type", "UNKNOWN_ERROR")
                error_message = data.get("error_message", "Lỗi không xác định")
                title = f"⚠️ LỖI HỆ THỐNG: {error_type}"
                
                # Emit API error signal (safe for cross-thread)
                self.api_error_signal.emit(title, error_message)
                
        except Exception as e:
            print(f"Error in system callback handler: {e}")
            import traceback
            traceback.print_exc()
    
    def keyPressEvent(self, event):
        """Handle key press events"""
        if event.key() == Qt.Key_R:
            self.reset_verification()
        super().keyPressEvent(event)
    
    def closeEvent(self, event):
        """Handle widget close event"""
        # Stop timers
        self.frame_timer.stop()
        self.reset_timer.stop()
        self.notification_timer.stop()
        
        # Stop RFID listening
        if hasattr(self.face_system, "stop_rfid_listening"):
            self.face_system.stop_rfid_listening()
        
        # Accept close event
        event.accept()

# For testing purposes
if __name__ == "__main__":
    app = QApplication(sys.argv)
    
    test_widget = QWidget()
    test_widget.setGeometry(100, 100, 800, 600)
    
    face_recognition = FaceRecognitionWidget(parent=test_widget)
    
    test_widget.show()
    
    # Set signal handler for clean exit
    signal.signal(signal.SIGINT, signal.SIG_DFL)
    
    sys.exit(app.exec())
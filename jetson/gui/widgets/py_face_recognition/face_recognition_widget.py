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
        
        # Connect verification signal to slot
        self.verification_signal.connect(self.show_verification_popup)
        
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
        # Mark notification as active
        self.active_notification = True
        print(f"Showing verification popup with result: {verification_result.get('match', False)}")
        
        # Extract verification data
        match = verification_result.get("match", False)
        rfid_name = verification_result.get("rfid_name", "Unknown")
        face_name = verification_result.get("face_name", "Unknown")
        match_score = verification_result.get("match_score", 0)
        rfid_id = verification_result.get("rfid_id", "")
        timestamp = verification_result.get("timestamp", "")
        
        # Use current time if no timestamp provided
        if not timestamp:
            from datetime import datetime
            current_time = datetime.now().strftime("%H:%M:%S - %d/%m/%Y")
        else:
            current_time = timestamp
        
        # If another notification is visible, queue this one
        if self.notification_popup.isVisible():
            print("Queueing notification as another is active")
            self.pending_notification = {
                "match": match,
                "rfid_id": rfid_id,
                "face_name": face_name,
                "match_score": match_score,
                "current_time": current_time,
                "rfid_name": rfid_name
            }
            return
        
        # Show the notification
        self._show_notification(match, rfid_id, face_name, match_score, current_time, rfid_name)
    
    def _show_notification(self, match, rfid_id, face_name, match_score, current_time, rfid_name):
        """Display notification with verification result"""
        try:
            # Force notification popup to parent if needed
            if not self.notification_popup.parent():
                self.notification_popup.setParent(self)
                
            # Make sure it's not hidden
            if not self.notification_popup.isVisible():
                self.notification_popup.show()
                
            if match:
                title = "✅ XÁC THỰC THÀNH CÔNG"
                info_text = f"ID: {rfid_id}\nTên: {face_name}\nĐiểm số: {match_score:.2f}\nThời gian: {current_time}"
                self.notification_popup.show_popup(title, info_text, True, True, 8000)  # Longer duration
                print(f"Showing success notification for {face_name}")
            else:
                title = "❌ XÁC THỰC THẤT BẠI"
                info_text = f"ID: {rfid_id}\nRFID: {rfid_name}\nMặt: {face_name}\nĐiểm số: {match_score:.2f}\nThời gian: {current_time}"
                self.notification_popup.show_popup(title, info_text, False, True, 8000)  # Longer duration
                print(f"Showing failure notification for {face_name} vs {rfid_name}")
        except Exception as e:
            print(f"Error showing notification: {e}")
            import traceback
            traceback.print_exc()
            self.active_notification = False  # Reset flag on error
    
    @Slot()
    def handle_pending_notification(self):
        """Handle displaying queued notifications"""
        if self.pending_notification:
            print("Processing pending notification from queue")
            
            # Extract notification data
            notif = self.pending_notification
            self.pending_notification = None
            
            # Show notification
            self._show_notification(
                notif["match"],
                notif["rfid_id"],
                notif["face_name"],
                notif["match_score"],
                notif["current_time"],
                notif["rfid_name"]
            )
        else:
            print("No pending notifications in queue")
    
    @Slot()
    def reset_verification(self):
        """Reset verification state"""
        print("Resetting face recognition verification state")
        
        # Close any active notification
        if self.notification_popup.isVisible():
            print("Closing notification during reset")
            # Use direct call instead of invoke method to avoid race conditions
            self.notification_popup.hide_popup()
        
        # Reset flags immediately
        self.active_notification = False
        self.pending_notification = None
        
        # Reset ZenSys state
        if hasattr(self.face_system, "current_rfid"):
            self.face_system.current_rfid = None
        
        if hasattr(self.face_system, "verification_result"):
            self.face_system.verification_result = None
        
        # Signal reset to parent components
        self.verification_reset.emit()
        print("Verification reset complete")
    
    def on_system_callback(self, action, data):
        """Handle callbacks from the ZenSys system"""
        print(f"Received system callback: {action}")
        
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
            # Extract verification data
            result = data.get("result", {})
            if result:
                print(f"Processing verification result: match={result.get('match', False)}")
                verification_data = {
                    "match": result.get("match", False) or data.get("match", False),
                    "rfid_id": data.get("rfid_id", ""),
                    "face_name": data.get("face_name", "Unknown"),
                    "rfid_name": data.get("rfid_name", "Unknown"),
                    "match_score": data.get("face_score", 0),
                    "timestamp": data.get("timestamp", "")
                }
                
                # Emit signal with result (safe for cross-thread)
                self.verification_signal.emit(verification_data)
                
                # Also emit completion signal
                self.verification_complete.emit(verification_data)
    
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
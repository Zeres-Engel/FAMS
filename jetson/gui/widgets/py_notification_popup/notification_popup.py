import sys
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QLabel, QFrame, 
                             QApplication, QHBoxLayout, QPushButton, QSpacerItem, QSizePolicy)
from PySide6.QtCore import (Qt, QPropertyAnimation, Property, QPoint, QEasingCurve, 
                          QTimer, QParallelAnimationGroup, Signal, Slot)
from PySide6.QtGui import QColor, QPainter, QPixmap, QIcon, QFont

class NotificationPopup(QFrame):
    """
    Widget hiển thị thông báo popup từ dưới lên khi có sự kiện xác thực
    """
    
    # Signal để thông báo khi popup đóng
    closed = Signal()
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Set parent if provided
        if parent:
            self.setParent(parent)
        
        # Kích thước và flags cho popup
        self.setMinimumWidth(400)
        self.setMaximumWidth(500)
        self.setMinimumHeight(200)
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.Tool)
        self.setAttribute(Qt.WA_TranslucentBackground)
        
        # Theo dõi trạng thái đóng/mở
        self._is_visible = False
        self._animation_running = False
        
        # Timer for auto-close
        self.timer = QTimer(self)
        self.timer.setSingleShot(True)
        self.timer.timeout.connect(self.hide_popup)
        
        # Set up UI
        self.setup_ui()
        
        # Set initial position (hidden)
        if parent:
            self.move(parent.width() - self.width() - 20, parent.height())
        else:
            self.move(QApplication.desktop().availableGeometry().width() - self.width() - 20, 
                    QApplication.desktop().availableGeometry().height())
        
        # Hide initially
        self.hide()
        print("Notification popup initialized")
    
    def setup_ui(self):
        # Main layout
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(10, 10, 10, 10)
        
        # Content frame
        self.content_frame = QFrame()
        self.content_frame.setObjectName("notification_frame")
        self.content_frame.setStyleSheet("""
            #notification_frame {
                background-color: #FFFFFF;
                border-radius: 10px;
                border: 1px solid #EEEEEE;
            }
        """)
        
        # Content layout
        content_layout = QVBoxLayout(self.content_frame)
        content_layout.setContentsMargins(15, 15, 15, 15)
        content_layout.setSpacing(10)
        
        # Header layout with title and close button
        header_layout = QHBoxLayout()
        
        # Title label
        self.title_label = QLabel("Notification Title")
        self.title_label.setStyleSheet("""
            font-size: 16px;
            font-weight: bold;
            color: #333333;
        """)
        
        # Close button
        self.close_button = QPushButton()
        self.close_button.setFixedSize(20, 20)
        self.close_button.setStyleSheet("""
            QPushButton {
                background-color: transparent;
                border: none;
                color: #888888;
                font-size: 16px;
                font-weight: bold;
            }
            QPushButton:hover {
                color: #333333;
            }
        """)
        self.close_button.setText("✕")
        self.close_button.setCursor(Qt.PointingHandCursor)
        self.close_button.clicked.connect(self.hide_popup)
        
        # Add widgets to header layout
        header_layout.addWidget(self.title_label)
        header_layout.addStretch()
        header_layout.addWidget(self.close_button)
        
        # Content label
        self.content_label = QLabel("Notification content goes here.")
        self.content_label.setWordWrap(True)
        self.content_label.setStyleSheet("""
            font-size: 14px;
            color: #555555;
        """)
        
        # Add layouts to main content layout
        content_layout.addLayout(header_layout)
        content_layout.addWidget(self.content_label)
        
        # Add content frame to main layout
        self.layout.addWidget(self.content_frame)
    
    def show_popup(self, title, content, success=True, auto_close=True, duration=5000):
        """Show notification popup with content"""
        print(f"Show popup called: {title} (success={success}, auto_close={auto_close})")
        
        try:
            # Set content
            self.title_label.setText(title)
            self.content_label.setText(content)
            
            # Set color based on success/failure
            if success:
                self.content_frame.setStyleSheet("""
                    #notification_frame {
                        background-color: #FFFFFF;
                        border-radius: 10px;
                        border-left: 5px solid #4CAF50;
                    }
                """)
            else:
                self.content_frame.setStyleSheet("""
                    #notification_frame {
                        background-color: #FFFFFF;
                        border-radius: 10px;
                        border-left: 5px solid #F44336;
                    }
                """)
            
            # Force stop any running animations
            if hasattr(self, 'anim') and self.anim is not None:
                if self.anim.state() == QPropertyAnimation.Running:
                    print("Stopping running animation")
                    self.anim.stop()
            
            # Đảm bảo popup hiển thị ngay cả khi đang hiển thị 1 thông báo khác
            # Buộc ẩn popup hiện tại trước khi hiển thị popup mới
            if self.isVisible() and self._is_visible:
                # Bỏ qua animation đóng, chỉ cập nhật nội dung và vị trí
                print("Popup already visible, updating content directly")
                
                # Đảm bảo vị trí đúng (dưới cùng bên phải)
                if self.parent():
                    parent_rect = self.parent().rect()
                    target_pos = QPoint(parent_rect.width() - self.width() - 20, 
                                      parent_rect.height() - self.height() - 20)
                    self.move(target_pos)
                
                # Cập nhật trạng thái
                self._is_visible = True
                self._animation_running = False
                
                # Nếu auto-close được bật, khởi động lại timer
                if auto_close:
                    if self.timer.isActive():
                        self.timer.stop()
                    self.timer.start(duration)
                    print(f"Restarted auto-close timer: {duration}ms")
                return
                
            # Hiển thị popup cho lần đầu
            # Position popup in bottom right corner of parent
            if self.parent():
                parent_rect = self.parent().rect()
                self.move(parent_rect.width() - self.width() - 20, parent_rect.height() + 10)
                
                # Make sure we're visible but not yet in view
                self.show()
                
                # Adjust size
                self.adjustSize()
                
                # Setup entry animation
                self.anim = QPropertyAnimation(self, b"pos")
                self.anim.setDuration(500)
                self.anim.setStartValue(QPoint(parent_rect.width() - self.width() - 20, parent_rect.height() + 10))
                self.anim.setEndValue(QPoint(parent_rect.width() - self.width() - 20, parent_rect.height() - self.height() - 20))
                self.anim.setEasingCurve(QEasingCurve.OutCubic)
                self.anim.finished.connect(self._on_show_finished)
                self._animation_running = True
                self.anim.start()
                
                print(f"Starting popup animation from {self.anim.startValue()} to {self.anim.endValue()}")
            
            # Set auto-close timer if enabled
            if auto_close:
                # Cancel existing timer if running
                if self.timer.isActive():
                    self.timer.stop()
                self.timer.start(duration)
                print(f"Auto-close timer started: {duration}ms")
        
        except Exception as e:
            print(f"Error showing popup: {e}")
            import traceback
            traceback.print_exc()
            
            # Phục hồi sau lỗi - đảm bảo popup vẫn hiển thị
            try:
                if self.parent():
                    parent_rect = self.parent().rect()
                    target_pos = QPoint(parent_rect.width() - self.width() - 20, 
                                      parent_rect.height() - self.height() - 20)
                    self.move(target_pos)
                    self.show()
                    self._is_visible = True
                    
                    if auto_close and not self.timer.isActive():
                        self.timer.start(duration)
            except:
                pass
    
    def _on_show_finished(self):
        """Called when show animation finishes"""
        self._is_visible = True
        self._animation_running = False
        print("Popup animation finished, popup is now visible")
    
    @Slot()
    def hide_popup(self):
        """Animate hiding the popup"""
        print("Hide popup called")
        
        # Don't do anything if already hidden or animation in progress
        if not self._is_visible and not self.isVisible():
            print("Popup already hidden, ignoring hide call")
            return
            
        # Cancel timer if running
        if self.timer.isActive():
            self.timer.stop()
            print("Auto-close timer stopped")
        
        # Force-stop any running animations
        if hasattr(self, 'anim') and self.anim is not None and self.anim.state() == QPropertyAnimation.Running:
            self.anim.stop()
            print("Stopped running animation during hide")
            
        # If we aren't visible or no parent, just hide directly
        if not self.isVisible() or not self.parent():
            print("Hiding popup directly (no animation)")
            self.hide()
            self._is_visible = False
            self._animation_running = False
            self.closed.emit()
            return
            
        # Get current position and parent rect
        parent_rect = self.parent().rect()
        current_pos = self.pos()
        
        # Create hide animation
        self.anim = QPropertyAnimation(self, b"pos")
        self.anim.setDuration(500)
        self.anim.setStartValue(current_pos)
        self.anim.setEndValue(QPoint(current_pos.x(), parent_rect.height() + 10))
        self.anim.setEasingCurve(QEasingCurve.OutCubic)
        self.anim.finished.connect(self._on_hide_finished)
        
        # Update state
        self._is_visible = False
        self._animation_running = True
        
        # Start animation
        print(f"Starting hide animation from {self.anim.startValue()} to {self.anim.endValue()}")
        self.anim.start()
    
    def _on_hide_finished(self):
        """Called when hide animation finishes"""
        # Update state
        self._animation_running = False
        
        # Hide widget
        self.hide()
        
        # Mark as hidden
        self._is_visible = False
        
        # Emit closed signal
        print("Popup hidden, emitting closed signal")
        self.closed.emit()
    
    def showEvent(self, event):
        """Override showEvent to adjust size"""
        super().showEvent(event)
        # Size adjustment
        self.adjustSize()
        print(f"Popup show event, size: {self.width()}x{self.height()}")
    
    def paintEvent(self, event):
        """Add shadow to frame"""
        super().paintEvent(event)
        # No custom painting needed as we use stylesheet for styling
    
# Test code for standalone usage
if __name__ == "__main__":
    app = QApplication(sys.argv)
    
    # Main window for testing
    window = QWidget()
    window.setGeometry(100, 100, 800, 600)
    window.setWindowTitle("Notification Test")
    
    # Create notification
    notification = NotificationPopup(window)
    
    # Button to trigger notification
    success_btn = QPushButton("Show Success", window)
    success_btn.move(200, 200)
    success_btn.clicked.connect(lambda: notification.show_popup("Success", "This is a success message with a lot of text that should wrap properly.", True, True, 3000))
    
    error_btn = QPushButton("Show Error", window)
    error_btn.move(400, 200)
    error_btn.clicked.connect(lambda: notification.show_popup("Error", "This is an error message.", False, True, 3000))
    
    # Show window
    window.show()
    
    sys.exit(app.exec()) 
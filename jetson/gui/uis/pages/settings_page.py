from PySide6.QtCore import Qt, Signal, QTimer
from PySide6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel, 
                             QLineEdit, QComboBox, QPushButton, QFrame, QSizePolicy)
from PySide6.QtGui import QFont, QColor

class PasswordLineEdit(QLineEdit):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setEchoMode(QLineEdit.Password)
        self.setStyleSheet("""
            QLineEdit {
                background-color: white;
                border-radius: 8px;
                border: 2px solid #1976d2;
                padding: 8px;
                color: #333333;
                font-size: 12px;
            }
            QLineEdit:focus {
                border: 2px solid #2196f3;
            }
        """)

class SettingsPage(QWidget):
    settings_saved = Signal(dict)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        
        # Set background color
        self.setStyleSheet("background-color: #f5f5f5;")
        
        # Main layout
        self.main_layout = QVBoxLayout(self)
        self.main_layout.setContentsMargins(20, 20, 20, 20)
        self.main_layout.setSpacing(20)
        
        # Title with blue accent
        self.title_frame = QFrame()
        self.title_frame.setStyleSheet("background-color: #1976d2; border-radius: 10px;")
        self.title_frame.setMaximumHeight(60)
        self.title_frame.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)
        
        self.title_layout = QVBoxLayout(self.title_frame)
        self.title_layout.setContentsMargins(0, 0, 0, 0)
        
        self.title_label = QLabel("Settings")
        self.title_label.setAlignment(Qt.AlignCenter)
        font = QFont()
        font.setPointSize(16)
        font.setBold(True)
        self.title_label.setFont(font)
        self.title_label.setStyleSheet("color: white;")
        self.title_layout.addWidget(self.title_label)
        
        self.main_layout.addWidget(self.title_frame)
        
        # Content frame with rounded corners and blue border
        self.content_frame = QFrame()
        self.content_frame.setStyleSheet("""
            QFrame {
                background-color: white;
                border-radius: 10px;
                border: 3px solid #1976d2;
                padding: 10px;
            }
        """)
        self.content_layout = QVBoxLayout(self.content_frame)
        self.content_layout.setSpacing(20)
        self.content_layout.setContentsMargins(15, 15, 15, 15)
        
        # API URL Settings
        self.api_frame = self.create_setting_frame("API URL:")
        self.api_input = QLineEdit()
        self.api_input.setPlaceholderText("Enter API URL")
        self.api_input.setStyleSheet("""
            QLineEdit {
                background-color: white;
                border-radius: 8px;
                border: 2px solid #1976d2;
                padding: 8px;
                color: #333333;
                font-size: 12px;
            }
            QLineEdit:focus {
                border: 2px solid #2196f3;
            }
        """)
        self.api_input.setMinimumHeight(40)
        self.api_frame.layout().addWidget(self.api_input)
        
        self.content_layout.addWidget(self.api_frame)
        
        # Access Token Settings
        self.token_frame = self.create_setting_frame("Access Token:")
        self.token_input = PasswordLineEdit()
        self.token_input.setPlaceholderText("Enter Access Token")
        self.token_input.setMinimumHeight(40)
        self.token_frame.layout().addWidget(self.token_input)
        
        self.content_layout.addWidget(self.token_frame)
        
        # Device ID / Room Selection
        self.device_frame = self.create_setting_frame("Room Selection (Device ID):")
        self.device_combo = QComboBox()
        self.device_combo.setStyleSheet("""
            QComboBox {
                background-color: white;
                border-radius: 8px;
                border: 2px solid #1976d2;
                padding: 8px;
                color: #333333;
                font-size: 12px;
                min-height: 40px;
            }
            QComboBox::drop-down {
                subcontrol-origin: padding;
                subcontrol-position: top right;
                width: 25px;
                border-left-width: 1px;
                border-left-color: #1976d2;
                border-left-style: solid;
                border-top-right-radius: 8px;
                border-bottom-right-radius: 8px;
            }
            QComboBox QAbstractItemView {
                background-color: white;
                border: 2px solid #1976d2;
                border-radius: 8px;
                color: #333333;
                selection-background-color: #e3f2fd;
                selection-color: #1976d2;
            }
        """)
        
        # Populate rooms from the CSV
        rooms = [
            "Room 101 Building A",
            "Room 102 Building A",
            "Room 101 Building B",
            "Room 102 Building B",
            "Room 101 Building C",
            "Room 102 Building C"
        ]
        
        for i, room in enumerate(rooms):
            self.device_combo.addItem(room, i+1)  # Store device ID as user data
        
        self.device_frame.layout().addWidget(self.device_combo)
        
        self.content_layout.addWidget(self.device_frame)
        
        # Save Button with hover effects
        self.save_button = QPushButton("Save Settings")
        self.save_button.setMinimumHeight(50)
        self.save_button.setCursor(Qt.PointingHandCursor)
        self.save_button.setStyleSheet("""
            QPushButton {
                background-color: #1976d2;
                color: white;
                border-radius: 10px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #2196f3;
            }
            QPushButton:pressed {
                background-color: #0d47a1;
            }
        """)
        self.save_button.clicked.connect(self.save_settings)
        
        self.content_layout.addWidget(self.save_button)
        
        # Add content frame to main layout
        self.main_layout.addWidget(self.content_frame)
        
        # Add stretch to push everything to the top
        self.main_layout.addStretch()
    
    def create_setting_frame(self, title):
        frame = QFrame()
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(8)
        
        label = QLabel(title)
        label.setStyleSheet("color: #1976d2; font-weight: bold; font-size: 13px;")
        layout.addWidget(label)
        
        return frame
        
    def save_settings(self):
        settings = {
            "api_url": self.api_input.text(),
            "access_token": self.token_input.text(),
            "device_id": self.device_combo.currentData(),
            "room": self.device_combo.currentText()
        }
        self.settings_saved.emit(settings)
        
        # Visual feedback when saved
        self.save_button.setStyleSheet("""
            QPushButton {
                background-color: #43a047;
                color: white;
                border-radius: 10px;
                font-weight: bold;
                font-size: 14px;
            }
        """)
        
        # Reset button style after 1 second
        QTimer.singleShot(1000, self.reset_button_style)
        
    def reset_button_style(self):
        self.save_button.setStyleSheet("""
            QPushButton {
                background-color: #1976d2;
                color: white;
                border-radius: 10px;
                font-weight: bold;
                font-size: 14px;
            }
            QPushButton:hover {
                background-color: #2196f3;
            }
            QPushButton:pressed {
                background-color: #0d47a1;
            }
        """)
        
    def load_settings(self, settings):
        if "api_url" in settings:
            self.api_input.setText(settings["api_url"])
        if "access_token" in settings:
            self.token_input.setText(settings["access_token"])
        if "device_id" in settings:
            index = self.device_combo.findData(settings["device_id"])
            if index >= 0:
                self.device_combo.setCurrentIndex(index) 
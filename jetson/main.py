import os
import sys
import json
from PySide6.QtGui import QIcon 
from PySide6.QtWidgets import QMainWindow, QApplication
from gui.core.json_settings import Settings
from gui.uis.windows.main_window import *
from gui.widgets import *
from gui.uis.windows.main_window.functions_main_window import *

# IMPORT ZENSYS FACTORY
from src.core.zensys_factory import get_default_instance

os.environ["QT_FONT_DPI"] = "96"
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()

        # Create UI
        self.ui = UI_MainWindow()

        # Setup UI
        self.ui.setup_ui(self)

        # Create setting
        settings = Settings()
        self.settings = settings.items

        # Hide grips
        self.hide_grips = True
        # Setup UI on window
        SetupMainWindow.setup_gui(self)

        # Connect settings page signals
        self.setup_settings_page()

        # Show
        self.show()

    def setup_settings_page(self):
        # Connect settings saved signal
        if hasattr(self.ui.load_pages, 'settings_page'):
            self.ui.load_pages.settings_page.settings_saved.connect(self.save_app_settings)
            
            # Load existing settings if available
            self.load_app_settings()

    def save_app_settings(self, settings_data):
        try:
            # Create settings directory if it doesn't exist
            os.makedirs('data/settings', exist_ok=True)
            
            # Save settings to JSON file
            with open('data/settings/app_settings.json', 'w') as f:
                json.dump(settings_data, f, indent=4)
        except Exception as e:
            print(f"Error saving settings: {e}")

    def load_app_settings(self):
        try:
            # Check if settings file exists
            if os.path.exists('data/settings/app_settings.json'):
                with open('data/settings/app_settings.json', 'r') as f:
                    settings_data = json.load(f)
                    
                # Load settings to the settings page
                if hasattr(self.ui.load_pages, 'settings_page'):
                    self.ui.load_pages.settings_page.load_settings(settings_data)
        except Exception as e:
            print(f"Error loading settings: {e}")

    def closeEvent(self, event):
        # Đảm bảo đóng camera và RFID reader khi tắt ứng dụng
        try:
            # Chỉ thực hiện nếu đang ở trang Face Recognition
            if hasattr(self.ui.load_pages, 'face_recognition_page') and \
               hasattr(self.ui.load_pages.face_recognition_page, 'face_widget'):
                
                # Dừng RFID listener
                self.ui.load_pages.face_recognition_page.face_widget.face_system.stop_rfid_listening()
                
                # Giải phóng camera
                if hasattr(self.ui.load_pages.face_recognition_page.face_widget, 'cap') and \
                   self.ui.load_pages.face_recognition_page.face_widget.cap is not None:
                    self.ui.load_pages.face_recognition_page.face_widget.cap.release()
        except Exception as e:
            print(f"Error closing resources: {e}")
            
        event.accept()

    def btn_clicked(self):
        btn = SetupMainWindow.setup_btns(self)

        if btn.objectName() == "btn_0":
            self.ui.left_menu.select_only_one(btn.objectName())
            MainFunctions.set_page(self, self.ui.load_pages.page_1)

        if btn.objectName() == "btn_1":
            self.ui.left_menu.select_only_one(btn.objectName())
            MainFunctions.set_page(self, self.ui.load_pages.page_2)
 
        if btn.objectName() == "btn_2":
            self.ui.left_menu.select_only_one(btn.objectName())
            MainFunctions.set_page(self, self.ui.load_pages.page_3)

    def btn_released(self):
        btn = SetupMainWindow.setup_btns(self)

    def resizeEvent(self, event):
        SetupMainWindow.resize_grips(self)

    def mousePressEvent(self, event):
        self.dragPos = event.globalPosition()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setWindowIcon(QIcon("icon.ico"))
    window = MainWindow()
    sys.exit(app.exec())
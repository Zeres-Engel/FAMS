import os
import sys
from PySide6.QtGui import QIcon 
from PySide6.QtWidgets import QMainWindow, QApplication
from gui.core.json_settings import Settings
from gui.uis.windows.main_window import *
from gui.widgets import *
from gui.uis.windows.main_window.functions_main_window import *

# IMPORT ZENSYS FACTORY
from src.core.zensys_factory import get_default_instance

os.environ["QT_FONT_DPI"] = "96"

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

        # Show
        self.show()

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
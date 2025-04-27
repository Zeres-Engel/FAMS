from PySide6.QtWidgets import QWidget, QVBoxLayout, QLabel, QFrame
from PySide6.QtCore import Qt

from gui.widgets.py_face_recognition import FaceRecognitionWidget

class FaceRecognitionPage(QWidget):
    def __init__(self):
        super().__init__()
        
        # SET LAYOUT
        self.layout = QVBoxLayout(self)
        self.layout.setContentsMargins(0, 0, 0, 0)
        self.layout.setSpacing(0)
        
        # CREATE ZENSYS FACE RECOGNITION WIDGET
        self.face_widget = FaceRecognitionWidget()
        
        # ADD WIDGET TO LAYOUT
        self.layout.addWidget(self.face_widget) 
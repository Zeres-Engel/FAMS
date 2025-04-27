import os
# Fix OpenMP runtime issues
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
os.environ['OMP_NUM_THREADS'] = '4'

import sys
from PySide6.QtWidgets import QApplication, QMessageBox
from src.gui.MainWindow import MainWindow
from src.core.api.config import APIConfig
from src.core.zensys_factory import get_message_manager


def main():
    print("\n===== STARTING FACE RECOGNITION & RFID SYSTEM =====")
    
    # Kiểm tra cấu hình API
    api_config_valid = APIConfig.validate_config()  
    if not api_config_valid:
        print("WARNING: API configuration has issues. System will run but API calls may fail.")
    
    # Khởi tạo MessageManager với cấu hình từ .env
    # Mặc định: Kafka = False, API = True (ưu tiên HTTP API)
    # Có thể bật Kafka nếu muốn dùng song song
    use_kafka = os.getenv("USE_KAFKA", "False").lower() in ("true", "1", "t", "yes")
    use_api = os.getenv("USE_API", "True").lower() in ("true", "1", "t", "yes")
    
    print(f"\n==== MESSAGING CONFIGURATION ====")
    print(f"Using Kafka: {use_kafka}")
    print(f"Using API: {use_api}")
    
    # Khởi tạo message manager singleton với cấu hình
    message_manager = get_message_manager(use_kafka=use_kafka, use_api=use_api)
    
    # Khởi động ứng dụng
    app = QApplication(sys.argv)
    window = MainWindow()
    
    # Hiển thị cảnh báo nếu cấu hình API có vấn đề
    if not api_config_valid:
        QMessageBox.warning(
            window,
            "API Configuration Warning",
            "API configuration has issues. The system will run but attendance data may not be sent to the server.\n\n"
            "Please check the console output for more details and update the .env file accordingly."
        )
    
    window.show()
    sys.exit(app.exec())
    
if __name__ == "__main__":
    main()
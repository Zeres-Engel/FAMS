"""
Ví dụ về cách sử dụng ZenSys với API và Kafka
"""
import os
import sys
import time
from pathlib import Path
import cv2
import numpy as np
from datetime import datetime

# Add project root to Python path
project_root = str(Path(__file__).parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from src.core.zensys_factory import (
    get_default_instance,
    get_attendance_service,
    get_message_manager
)

def mock_rfid_scan():
    """
    Giả lập quét thẻ RFID
    """
    print("\n=== Quét thẻ RFID ===")
    # Danh sách RFID giả lập
    mock_rfids = [
        {"rfid_id": "0005563074", "user_id": "thanhnpst1"},
        {"rfid_id": "0007654321", "user_id": "nguyenvana"},
        {"rfid_id": "0001234567", "user_id": "tranthib"}
    ]
    
    # Chọn ngẫu nhiên một RFID
    import random
    return random.choice(mock_rfids)

def mock_face_detection():
    """
    Giả lập phát hiện khuôn mặt
    """
    print("=== Phát hiện khuôn mặt ===")
    
    # Tạo ảnh khuôn mặt giả lập
    face_img = np.zeros((112, 112, 3), dtype=np.uint8)
    cv2.circle(face_img, (56, 56), 40, (255, 255, 255), -1)
    cv2.circle(face_img, (40, 40), 5, (0, 0, 0), -1)  # Left eye
    cv2.circle(face_img, (72, 40), 5, (0, 0, 0), -1)  # Right eye
    cv2.ellipse(face_img, (56, 70), (20, 10), 0, 0, 180, (0, 0, 0), 2)  # Mouth
    
    return face_img

def example_attendance_flow():
    """
    Ví dụ về luồng điểm danh
    """
    print("Starting attendance example flow...")
    
    # Khởi tạo ZenSys
    zensys = get_default_instance()
    
    # Giả lập quét thẻ RFID
    rfid_info = mock_rfid_scan()
    rfid_id = rfid_info["rfid_id"]
    user_id = rfid_info["user_id"]
    
    print(f"RFID quét được: {rfid_id}, Người dùng: {user_id}")
    
    # Giả lập phát hiện khuôn mặt
    face_img = mock_face_detection()
    print(f"Đã phát hiện khuôn mặt kích thước: {face_img.shape}")
    
    # Tạo đường dẫn lưu trữ
    save_dir = Path("data/attendance") / user_id
    save_dir.mkdir(parents=True, exist_ok=True)
    
    # Lưu ảnh khuôn mặt
    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
    face_path = str(save_dir / f"{timestamp}.jpg")
    cv2.imwrite(face_path, face_img)
    
    # Tạo thông tin điểm danh
    attendance_data = {
        "deviceId": int(os.getenv('DEVICE_ID', '1')),
        "userId": user_id,
        "RFID_ID": rfid_id,
        "CheckIn": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "CheckInFace": face_path
    }
    
    # In thông tin điểm danh
    print("\n=== Thông tin điểm danh ===")
    print(f"Device ID: {attendance_data['deviceId']}")
    print(f"User ID: {attendance_data['userId']}")
    print(f"RFID ID: {attendance_data['RFID_ID']}")
    print(f"Check In: {attendance_data['CheckIn']}")
    print(f"Check In Face: {attendance_data['CheckInFace']}")
    
    # Gửi dữ liệu điểm danh qua API
    attendance_service = get_attendance_service()
    result = attendance_service.send_attendance(attendance_data)
    
    print("\n=== Kết quả gửi API ===")
    print(f"Success: {result.success}")
    print(f"Message: {result.message}")
    print(f"Status Code: {result.status_code}")
    
    # Gửi dữ liệu qua Kafka
    message_manager = get_message_manager()
    kafka_result = message_manager.send_attendance_event(attendance_data)
    
    print("\n=== Kết quả gửi Kafka ===")
    print(f"Success: {kafka_result}")
    
    # Lấy lịch sử điểm danh
    history_result = attendance_service.get_attendance_history(user_id)
    
    print("\n=== Lịch sử điểm danh ===")
    print(f"Success: {history_result.success}")
    print(f"Message: {history_result.message}")
    if history_result.data:
        print(f"Số lượng kết quả: {len(history_result.data.get('records', []))}")

def example_kafka_consumer():
    """
    Ví dụ về Kafka consumer
    """
    print("\n=== Khởi động Kafka Consumer ===")
    
    def handle_attendance_message(message_data):
        """Xử lý thông điệp điểm danh từ Kafka"""
        print(f"Nhận thông điệp điểm danh: {message_data}")
    
    # Khởi tạo message manager
    message_manager = get_message_manager()
    
    # Đăng ký consumer
    message_manager.start_consumer(
        topic=message_manager.KAFKA_ATTENDANCE_TOPIC,
        message_handler=handle_attendance_message
    )
    
    print("Consumer đang lắng nghe. Ấn Ctrl+C để dừng...")
    
    try:
        # Giữ consumer chạy
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("Đang dừng consumer...")
        message_manager.stop_consumer()
        print("Consumer đã dừng.")

if __name__ == "__main__":
    # Chạy ví dụ điểm danh
    example_attendance_flow()
    
    # Chạy ví dụ Kafka consumer (bỏ comment để chạy)
    # example_kafka_consumer() 
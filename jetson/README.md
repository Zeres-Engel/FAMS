# Face Recognition and RFID Authentication System

## Overview
This application combines face recognition, depth estimation, and RFID card detection to create a secure authentication system. The system verifies whether the person swiping an RFID card is the legitimate owner by comparing their face with stored reference images.

## Key Features
- **Continuous Face Detection**: Monitors the camera feed to detect faces in real-time
- **RFID Authentication**: Supports RFID card scanning for initial user identification
- **Face Recognition**: Verifies the identity of the person by comparing with a gallery of registered faces
- **Face Anti-Spoofing**: Uses depth maps to detect fake faces (photos, masks, etc.)
- **Modern GUI**: Built with PySide6 for a clean and responsive interface
- **Attendance Logging**: Records attendance with timestamp and face image 
- **Comprehensive Logging System**: Logs system events, RFID scans, and verification results

## System Workflow
1. The system continuously detects faces through the webcam
2. When an RFID card is swiped, the system captures the detected face
3. The face is normalized and cropped for verification
4. Simultaneously, a depth map is generated to perform anti-spoofing checks
5. The system verifies if the person swiping the card matches the registered RFID owner
6. Authentication results are displayed in real-time
7. Attendance information is logged in JSON format to the terminal and saved to files

## Attendance Log Format
The system logs attendance in the following JSON format to the terminal:
```json
{
  "deviceId": 1,
  "userId": "thanhnpst1",
  "RFID_ID": "0005563074",
  "CheckIn": "2023-08-15 14:30:27",
  "CheckInFace": "data/attendance/thanhnpst1/2023-08-15_14-30-27.jpg"
}
```

This format is designed for easy integration with other microservices and can be captured from the terminal output.

## Logging System
The system includes a comprehensive logging framework with multiple components:

1. **Attendance Logger**: Records attendance events and saves face images
   - Output format: Simple JSON format to terminal
   - File storage: Face images saved to user-specific folders

2. **RFID Logger**: Tracks RFID card scans and verification results
   - Logs stored in: `data/logs/rfid/rfid_YYYY-MM-DD.json`
   - Records timestamp, RFID ID, and verification results

3. **System Logger**: Records system events and error messages
   - Logs stored in: `data/logs/system/system_YYYY-MM-DD.log`
   - Standard logging format with timestamps and severity levels

## Technical Details
- **Face Detection & Recognition**: Using ZenFace neural network models
- **Anti-Spoofing**: MiDaS depth estimation model analyzes face depth patterns
- **RFID Simulation**: Keyboard input emulates RFID card reading
- **Vector Database**: FAISS for efficient face embedding storage and matching
- **GUI Framework**: PySide6 (Qt for Python)
- **Attendance Storage**: Face images and logs saved in organized directory structure
- **Module Architecture**: Optimized module structure to prevent circular imports and improve maintainability
- **Factory Pattern**: Uses a factory pattern for creating and managing ZenSys instances

## Architecture Overview
The system is designed with a modular architecture that separates concerns:

1. **Core System (ZenSys)**: Central coordinator that integrates all components
2. **Face Module (ZenFace)**: Handles face detection and recognition
3. **Managers**: Specialized components for RFID, anti-spoofing, depth estimation, etc.
4. **Factory Pattern**: Provides singleton access to the system through `zensys_factory`

## Requirements
- Python 3.8+
- CUDA-capable GPU (recommended)
- Required Python packages:
  - PySide6
  - OpenCV
  - NumPy
  - FAISS
  - PyTorch
  - ONNX Runtime
  - Timm (for MiDaS depth estimation)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/face-rfid-auth.git
cd face-rfid-auth

# Install dependencies
pip install -r requirements.txt

# Run the application
python app.py
```

## Usage
1. Register faces in the gallery by placing reference images in the `data/gallery/{person_name}/` folder
2. Add RFID cards to the database by modifying the JSON file at `assets/database/rfid.json`
3. Run the application
4. Swipe an RFID card (simulated with keyboard input)
5. Look at the camera for face verification
6. The system will output JSON attendance data to the terminal and save logs

## Configuration
Edit the configuration parameters in `assets/configs/config.yaml` to customize:
- Recognition thresholds
- Anti-spoofing sensitivity
- Gallery and database paths
- Logging parameters
- Device ID and other settings

## Project Structure
- `app.py`: Application entry point
- `src/gui/`: GUI components
  - `MainWindow.py`: Main application window
- `src/core/`: Core functionality
  - `zensys_factory.py`: Factory module for creating and managing ZenSys instances
  - `zensys/`: ZenSys package
    - `zensys.py`: Main ZenSys class implementation
    - `face_recognition_manager.py`: Manages face recognition
    - `anti_spoofing_manager.py`: Manages anti-spoofing features
    - `depth_manager.py`: Handles depth estimation
    - `rfid_manager.py`: Manages RFID card detection
    - `attendance_manager.py`: Handles attendance logging
  - `zen_face/`: Face detection and recognition package
    - `face_operator.py`: Face class definition and operations
    - `main_pipeline.py`: ZenFace pipeline implementation
  - `faiss_manager/`: FAISS database management
- `src/log/`: Logging components
  - `attendance_logger.py`: Records attendance events
  - `rfid_logger.py`: Logs RFID and verification events
  - `system_logger.py`: System-wide logging functionality
- `model/`: ML models
  - `MiDaS/`: Depth estimation
  - `RFID/`: RFID simulation and verification
  - `FaceAnti/`: Anti-spoofing detection
  - `utils/`: Model utility functions
    - `face_align.py`: Face alignment algorithms
- `utils/`: Utility functions
  - `config_utils.py`: Configuration management
- `data/`: Storage for galleries, databases and logs
  - `gallery/`: Reference face images
  - `attendance/`: Attendance face images 
  - `logs/`: System, RFID and attendance logs
- `assets/`: Application assets
  - `database/`: FAISS index and RFID mappings
  - `configs/`: Configuration files
  - `weights/`: Model weights

## Module Organization
The system employs a carefully designed module structure to prevent circular imports:

1. **Factory Pattern**: The `zensys_factory.py` module provides factory functions to create and manage ZenSys instances, avoiding circular imports between modules.

2. **Package Structure**:
   - `zen_face` package contains the face detection and recognition functionality
   - `zensys` package contains the main system class and manager components
   - Each package has a clean `__init__.py` that only exposes necessary classes

3. **Dependency Direction**:
   - GUI depends on Core modules
   - Core modules follow a clear dependency hierarchy:
     - `zensys` → `zen_face` (but not the other way around)
     - `zensys_factory` → `zensys` (to avoid circular imports)

## Performance Optimization
- The system is optimized for real-time performance on modest hardware
- Face detection is limited to finding the largest face for efficiency
- The FAISS database provides fast vector similarity search
- Depth maps are processed efficiently for anti-spoofing

## License
[MIT License](LICENSE)

## Acknowledgments
- MiDaS for depth estimation
- FAISS for efficient similarity search
- ZenFace for face detection and recognition
- ONNX Runtime for optimized inference 

# MiDaS Depth Model Checker

Script để trích xuất và hiển thị thông tin từ mô hình MiDaS cho phân tích độ sâu khuôn mặt và kiểm tra liveness.

## Cách sử dụng

1. Đảm bảo các thư viện cần thiết đã được cài đặt:
   ```
   pip install torch numpy opencv-python matplotlib einops
   ```

2. **Tải đầy đủ mô hình MiDaS và các phụ thuộc để sử dụng hoàn toàn offline:**
   ```
   python download_full_model.py
   ```
   Script này sẽ:
   - Tải mô hình MiDaS Small từ torch hub
   - Sao chép tất cả các file checkpoint cần thiết
   - Sao chép các repo được sử dụng
   - Lưu tất cả vào thư mục `assets/weights/`

3. Chạy script chính:
   ```
   python extract_depth_checkin.py
   ```
   Script sẽ tự động sử dụng các tệp đã được tải về và cấu hình PyTorch để sử dụng repo local, không cần kết nối internet.

## Tính năng

- Hiển thị ảnh gốc, bản đồ độ sâu màu và bản đồ độ sâu grayscale
- Đánh dấu vùng khuôn mặt giả định (có thể tích hợp bộ phát hiện khuôn mặt thực tế)
- Phân tích và hiển thị các thông số liveness dựa trên thông tin độ sâu
- Hiển thị kết quả "LIVE FACE" hoặc "FAKE FACE" dựa trên ngưỡng đã cài đặt

## Phím tắt (khi chạy webcam)

- `q` - Thoát chương trình
- `t` - Hiển thị các ngưỡng hiện tại trong console
- `+` - Tăng ngưỡng variance (tăng độ nhạy phát hiện fake)
- `-` - Giảm ngưỡng variance (giảm độ nhạy phát hiện fake)

## Tùy chỉnh

- Thay đổi biến `use_webcam = False` trong script để sử dụng ảnh tĩnh thay vì webcam
- Điều chỉnh đường dẫn ảnh test tại biến `img_path`
- Đặt `set_custom_thresholds = True` và điều chỉnh giá trị trong phương thức `depth_manager.set_thresholds()` để thay đổi các ngưỡng mặc định

## Các thông số depth được sử dụng

Script sẽ hiển thị các thông số độ sâu như:
- Variance (độ biến thiên độ sâu)
- Mean (độ sâu trung bình) 
- Median (giá trị độ sâu trung vị)
- Min/Max (giá trị độ sâu nhỏ nhất/lớn nhất)
- Depth Range (phạm vi độ sâu)

## Tiêu chí đánh giá liveness

Một khuôn mặt được coi là "LIVE" khi thỏa mãn tất cả các điều kiện sau:
- Variance > depth_variance_threshold (mặc định: 5000.0)
- Depth Range > depth_range_threshold (mặc định: 30.0)
- Min Depth > min_depth_threshold (mặc định: 50.0)
- Max Depth < max_depth_threshold (mặc định: 200.0)

## Các loại mô hình hỗ trợ

1. **MidasSmall**: Tải mô hình trực tiếp từ torch hub (cần kết nối internet)
2. **CustomFile**: Sử dụng file `.pt` đã lưu chỉ chứa state_dict của mô hình
3. **FullModel**: Sử dụng mô hình đầy đủ đã lưu (hoạt động hoàn toàn offline)

Các thông số này được sử dụng để đánh giá tính chân thực của khuôn mặt. 
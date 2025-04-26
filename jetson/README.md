# Face Recognition and RFID Authentication System

## Overview
This application combines face recognition, depth estimation, and RFID card detection to create a secure authentication system. The system verifies whether the person swiping an RFID card is the legitimate owner by comparing their face with stored reference images.

## Key Features
- **Continuous Face Detection**: Monitors the camera feed to detect faces in real-time
- **RFID Authentication**: Supports RFID card scanning for initial user identification
- **Face Recognition**: Verifies the identity of the person by comparing with a gallery of registered faces
- **Face Anti-Spoofing**: Uses depth maps to detect fake faces (photos, masks, etc.)
- **Modern GUI**: Built with PySide6 for a clean and responsive interface
- **Attendance Logging**: Records attendance with timestamp and face image when authentication is successful

## System Workflow
1. The system continuously detects faces through the webcam
2. When an RFID card is swiped, the system captures the detected face
3. The face is normalized and cropped for verification
4. Simultaneously, a depth map is generated to perform anti-spoofing checks
5. The system verifies if the person swiping the card matches the registered RFID owner
6. Authentication results are displayed in real-time
7. On successful authentication, attendance is logged to the terminal and face images are saved

## Attendance Log Format
The system logs attendance in the following JSON format to the terminal:
```json
{
  "classroomId": 1,
  "userId": "user_name",
  "RFID_ID": "rfid_card_id",
  "CheckIn": "YYYY-MM-DD HH:MM:SS",
  "CheckInFace": "path/to/saved/face/image.jpg"
}
```

This terminal output can be easily integrated with other microservices by capturing and parsing the JSON data.

## Technical Details
- **Face Detection & Recognition**: Using ZenFace neural network models
- **Anti-Spoofing**: MiDaS depth estimation model analyzes face depth patterns
- **RFID Simulation**: Keyboard input emulates RFID card reading
- **Vector Database**: FAISS for efficient face embedding storage and matching
- **GUI Framework**: PySide6 (Qt for Python)
- **Attendance Storage**: Face images are saved in user-specific folders

## Requirements
- Python 3.8+
- CUDA-capable GPU (recommended)
- Required Python packages:
  - PySide6
  - OpenCV
  - NumPy
  - FAISS
  - PyTorch

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
2. Add RFID cards to the database by modifying the RFID database in the code
3. Run the application
4. Swipe an RFID card (simulated with keyboard input)
5. Look at the camera for face verification
6. The system will display the verification result and log attendance if successful

## Configuration
Edit the configuration parameters in `utils/config_utils.py` to customize:
- Recognition thresholds
- Anti-spoofing sensitivity
- Gallery and database paths
- Model parameters

## Project Structure
- `app.py`: Application entry point
- `src/gui/`: GUI components
  - `MainWindow.py`: Main application window
- `src/core/`: Core functionality
  - `zensys.py`: Central system integrating all components
  - `zenface.py`: Face detection and recognition
  - `logger.py`: Attendance logging functionality
- `model/`: ML models
  - `MiDaS/`: Depth estimation
  - `RFID/`: RFID simulation and verification
  - `FaceAnti/`: Anti-spoofing detection
- `utils/`: Utility functions
  - `test_logger.py`: Test utility for the attendance logger
- `data/`: Storage for galleries and databases
  - `attendance/`: Saved attendance face images organized by user

## License
[MIT License](LICENSE)

## Acknowledgments
- MiDaS for depth estimation
- FAISS for efficient similarity search
- ZenFace for face detection and recognition 
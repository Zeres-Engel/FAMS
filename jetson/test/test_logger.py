import sys
import os
import time
import cv2
import numpy as np
from pathlib import Path

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from src.core.logger import AttendanceLogger

def create_test_image(size=(112, 112)):
    """Create a simple test image"""
    # Create a black image
    img = np.zeros((size[0], size[1], 3), np.uint8)
    
    # Draw a face-like pattern
    center = (size[0] // 2, size[1] // 2)
    radius = min(size) // 3
    
    # Draw face circle
    cv2.circle(img, center, radius, (200, 200, 200), -1)  # Face
    
    # Draw eyes
    eye_radius = radius // 4
    left_eye = (center[0] - radius // 2, center[1] - radius // 4)
    right_eye = (center[0] + radius // 2, center[1] - radius // 4)
    cv2.circle(img, left_eye, eye_radius, (255, 255, 255), -1)  # Left eye
    cv2.circle(img, right_eye, eye_radius, (255, 255, 255), -1)  # Right eye
    
    # Draw mouth
    mouth_start = (center[0] - radius // 2, center[1] + radius // 2)
    mouth_end = (center[0] + radius // 2, center[1] + radius // 2)
    cv2.line(img, mouth_start, mouth_end, (255, 255, 255), 2)
    
    return img

def test_attendance_logger():
    """Test the attendance logger functionality"""
    # Initialize logger
    logger = AttendanceLogger()
    print("Attendance logger initialized")
    
    # Create and save test image
    test_img = create_test_image()
    print("Test image created")
    
    # Log attendance with test image
    user_id = "test_user"
    rfid_id = "0005563074"
    
    print(f"Logging attendance for user: {user_id}, RFID: {rfid_id}")
    record = logger.log_attendance(
        user_id=user_id,
        rfid_id=rfid_id,
        face_image=test_img,
        classroom_id=1
    )
    
    print("Attendance record created:")
    print(f"- Classroom ID: {record['classroomId']}")
    print(f"- User ID: {record['userId']}")
    print(f"- RFID ID: {record['RFID_ID']}")
    print(f"- Check-in time: {record['CheckIn']}")
    print(f"- Face image path: {record['CheckInFace']}")
    
    # Verify the file exists
    if os.path.exists(record['CheckInFace']):
        print(f"Image successfully saved at: {record['CheckInFace']}")
    else:
        print("WARNING: Image was not saved correctly")

if __name__ == "__main__":
    test_attendance_logger() 
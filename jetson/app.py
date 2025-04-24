import os
# Fix OpenMP runtime issues
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'
os.environ['OMP_NUM_THREADS'] = '4'

import sys
import argparse
from pathlib import Path
import time
import cv2
from datetime import datetime
import json
import requests

# Add project root to Python path
project_root = str(Path(__file__).parent)
if project_root not in sys.path:
    sys.path.append(project_root)

# Import required modules
from api.attendance_api import AttendanceSystem
from api.rfid_api import RFIDAPIClient

def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(description='FAMS Jetson Nano Application')
    parser.add_argument('--mode', type=str, default='gui', 
                        choices=['gui', 'attendance', 'api-test'],
                        help='Operating mode (gui, attendance, api-test)')
    parser.add_argument('--api-url', type=str, default='http://localhost:3002/api-nodejs',
                        help='API base URL for backend server')
    parser.add_argument('--camera', type=int, default=0,
                        help='Camera device ID')
    
    return parser.parse_args()

def run_gui():
    """Run the GUI application"""
    from PySide6.QtWidgets import QApplication
    from src.gui import MainWindow

    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())

def run_attendance(api_url, camera_id=0):
    """
    Main function to run the attendance system with RFID and face verification
    """
    # Initialize RFID System
    try:
        rfid_system = RFIDSystem()
        rfid_system.start()
        print("RFID System initialized successfully")
    except Exception as e:
        print(f"Error initializing RFID system: {e}")
        return

    # Initialize Face Recognition System
    face_recognizer = FaceRecognizer()
    print("Face recognition system initialized")

    # Initialize Attendance API System
    attendance_system = AttendanceSystem(api_url=api_url)
    print(f"Attendance system initialized with API URL: {api_url}")

    # Initialize RFID API Client and authenticate
    rfid_api = RFIDAPIClient(api_url=api_url)
    token = rfid_api.authenticate()
    if token:
        print("RFID API authenticated successfully")
        attendance_system.set_auth_token(token)
    else:
        print("Failed to authenticate with RFID API")
        rfid_system.stop()
        return

    # Initialize camera
    camera = cv2.VideoCapture(camera_id)
    if not camera.isOpened():
        print(f"Error: Could not open camera {camera_id}")
        rfid_system.stop()
        return

    # Set camera resolution and parameters
    camera.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    camera.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

    # Variables for RFID cooldown
    last_rfid_time = 0
    rfid_cooldown = 3  # seconds

    # Main loop
    try:
        while True:
            # Read frame from camera
            ret, frame = camera.read()
            if not ret:
                print("Failed to capture image")
                time.sleep(0.1)
                continue

            # Create a copy of the frame for display
            display_frame = frame.copy()
            
            # Show system status on screen
            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cv2.putText(display_frame, f"System Time: {current_time}", (10, 30), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            
            # Check for RFID card (not too frequently to avoid flooding)
            current_timestamp = time.time()
            if current_timestamp - last_rfid_time > rfid_cooldown:
                rfid_data = rfid_system.read_card_data()
                
                if rfid_data:
                    last_rfid_time = current_timestamp
                    card_id = rfid_data.get('card_id')
                    print(f"RFID Card detected: {card_id}")
                    
                    # Show card detection on screen
                    cv2.putText(display_frame, f"Card detected: {card_id}", (10, 70), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                    cv2.putText(display_frame, "Looking for face...", (10, 110), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                    cv2.imshow("Attendance System", display_frame)
                    cv2.waitKey(1)
                    
                    # Get user data from RFID API
                    user_data = rfid_api.get_user_by_card(card_id)
                    
                    if user_data:
                        user_id = user_data.get('id')
                        user_name = user_data.get('name', 'Unknown')
                        print(f"User identified: {user_name} (ID: {user_id})")
                        
                        # Show user info on screen
                        cv2.putText(display_frame, f"User: {user_name}", (10, 150), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                        cv2.putText(display_frame, "Verifying face...", (10, 190), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                        cv2.imshow("Attendance System", display_frame)
                        cv2.waitKey(1)
                        
                        # Perform face recognition (give a few seconds for the user to position)
                        face_verified = False
                        face_check_start = time.time()
                        face_check_timeout = 5  # seconds to wait for face
                        
                        while time.time() - face_check_start < face_check_timeout:
                            ret, frame = camera.read()
                            if not ret:
                                continue
                                
                            # Check face in frame
                            face_locations = face_recognizer.detect_faces(frame)
                            
                            if face_locations:
                                # Process face for recognition
                                # This is a simplified check - in production you would compare
                                # against stored face encodings of the user
                                face_verified = True
                                break
                                
                            # Update display to show searching for face
                            display_frame = frame.copy()
                            cv2.putText(display_frame, f"User: {user_name}", (10, 150), 
                                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                            cv2.putText(display_frame, f"Verifying face... {int(face_check_timeout - (time.time() - face_check_start))}s", 
                                        (10, 190), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
                            cv2.imshow("Attendance System", display_frame)
                            cv2.waitKey(1)
                        
                        # Process attendance based on verification
                        if face_verified:
                            # Record attendance with face image as verification
                            success = attendance_system.handle_attendance_verification(
                                user_id=user_id,
                                verification_image=frame,
                                rfid_card_id=card_id
                            )
                            
                            if success:
                                attendance_status = attendance_system.get_attendance_status()
                                status_color = (0, 255, 0)  # Green for success
                                status_message = f"Attendance recorded: {attendance_status}"
                            else:
                                status_color = (0, 0, 255)  # Red for failure
                                status_message = "Failed to record attendance"
                        else:
                            status_color = (0, 0, 255)  # Red for failure
                            status_message = "Face verification failed"
                            
                        # Display result
                        cv2.putText(display_frame, status_message, (10, 230), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, status_color, 2)
                        cv2.imshow("Attendance System", display_frame)
                        cv2.waitKey(2000)  # Show result for 2 seconds
                    else:
                        # User not found for card
                        cv2.putText(display_frame, "Unknown card, user not found", (10, 150), 
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                        cv2.imshow("Attendance System", display_frame)
                        cv2.waitKey(2000)  # Show for 2 seconds
            
            # Show instruction on screen when idle
            cv2.putText(display_frame, "Present RFID card to record attendance", (10, 430), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
            
            # Show the frame
            cv2.imshow("Attendance System", display_frame)
            
            # Check for exit key
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
    except KeyboardInterrupt:
        print("Program interrupted by user")
    except Exception as e:
        print(f"Error in main loop: {e}")
    finally:
        # Cleanup
        print("Cleaning up resources...")
        rfid_system.stop()
        camera.release()
        cv2.destroyAllWindows()
        print("System shutdown complete")

def run_api_test(api_url):
    """
    Test function to verify the API connectivity
    """
    print(f"Testing API connectivity to: {api_url}")
    
    # Initialize the Attendance API
    attendance_system = AttendanceSystem(api_url=api_url)
    
    # Initialize RFID API Client and authenticate
    rfid_api = RFIDAPIClient(api_url=api_url)
    
    print("Testing RFID API authentication...")
    token = rfid_api.authenticate()
    if token:
        print("✅ RFID API authentication successful")
        print(f"Token: {token[:10]}...")  # Only show first part of token for security
        
        # Set the token in attendance system
        attendance_system.set_auth_token(token)
        
        # Test demo attendance submission
        print("\nTesting attendance submission...")
        demo_data = {
            'userId': 'test123',
            'rfidId': 'DEMO_RFID_001',
            'status': 'present',
            'classroomId': 1
        }
        
        # Create a simple attendance record for testing
        try:
            # Set auth token
            attendance_system.auth_token = token
            attendance_system.auth_headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {token}'
            }
            
            print(f"Using token: {token[:10]}...")
            
            # Create a timestamp
            now = datetime.now()
            timestamp = now.isoformat()
            
            # Prepare attendance data
            attendance_data = {
                'rfidId': demo_data['rfidId'],
                'userId': demo_data['userId'],
                'checkIn': timestamp,
                'timestamp': timestamp,
                'deviceId': 'jetson-nano-001',
                'location': 'Main Entrance',
                'classroomId': demo_data['classroomId'],
                'status': demo_data['status'],
                'date': now.strftime("%Y-%m-%d")
            }
            
            print("Sending demo attendance data:")
            print(json.dumps(attendance_data, indent=2))
            
            # URL có dạng http://fams.io.vn/api-nodejs/attendance/record
            # api-nodejs đã bao gồm base URL
            response = requests.post(
                f"{api_url}/attendance/record",
                json=attendance_data,
                headers=attendance_system.auth_headers,
                timeout=10
            )
            
            print(f"Response status: {response.status_code}")
            try:
                print("Response content:")
                print(json.dumps(response.json(), indent=2))
            except:
                print(f"Response text: {response.text[:200]}")
                
            if response.status_code in (200, 201):
                print("✅ Successfully sent attendance data")
            else:
                print(f"❌ Failed to send attendance data: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Error testing attendance API: {str(e)}")
            import traceback
            traceback.print_exc()
            
    else:
        print("❌ RFID API authentication failed")
    
    print("\nAPI test completed")

def main():
    """Main entry point"""
    args = parse_args()
    
    if args.mode == 'gui':
        run_gui()
    elif args.mode == 'attendance':
        run_attendance(args.api_url, args.camera)
    elif args.mode == 'api-test':
        run_api_test(args.api_url)

if __name__ == "__main__":
    main()
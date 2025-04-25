import os
import sys
import json
import requests
import base64
import cv2
import numpy as np
import time
from datetime import datetime
from io import BytesIO
from pathlib import Path
from PIL import Image

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

# Import local modules
from api.rfid_api import RFIDApi
from api.face_verification import FaceVerification

class AttendanceSystem:
    def __init__(self, api_url=None, classroom_id=1):
        """
        Initialize the attendance system
        
        Args:
            api_url (str): Base URL for the API
            classroom_id (int): ID of the classroom for attendance
        """
        self.api_url = api_url or "http://fams.io.vn/api-nodejs"
        
        # Ensure api_url does not end with trailing slash
        if self.api_url.endswith('/'):
            self.api_url = self.api_url[:-1]
            
        # Define API endpoints
        self.attendance_endpoint = f"{self.api_url}/attendance/record"
        self.auth_endpoint = f"{self.api_url}/auth/login"
        
        # Initialize API clients
        self.rfid_api = RFIDApi(api_base_url=self.api_url)
        self.face_verification = FaceVerification()
        
        # Set classroom ID
        self.classroom_id = classroom_id
        
        # Authentication
        self.auth_token = None
        self.auth_headers = {
            'Content-Type': 'application/json'
        }
        
        # Status tracking
        self.last_attendance_status = None
        self.last_attendance_time = None
        
        # Try to authenticate on initialization by using RFID API's token
        self._set_auth_token_from_rfid_api()
        
    def _set_auth_token_from_rfid_api(self):
        """Set authentication token from RFID API"""
        if self.rfid_api.auth_token:
            self.auth_token = self.rfid_api.auth_token
            self.auth_headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.auth_token}'
            }
            return True
        
        # Try to authenticate RFID API
        self.rfid_api._authenticate()
        
        # Now try again
        if self.rfid_api.auth_token:
            self.auth_token = self.rfid_api.auth_token
            self.auth_headers = {
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.auth_token}'
            }
            return True
            
        return False
        
    def authenticate(self, username="admin", password="1234"):
        """
        Authenticate with the backend API directly
        
        Args:
            username (str): Username for authentication
            password (str): Password for authentication
            
        Returns:
            bool: True if authentication successful, False otherwise
        """
        auth_data = {
            "userId": username,
            "password": password
        }
        
        try:
            print(f"Authenticating with API at {self.auth_endpoint}")
            response = requests.post(
                self.auth_endpoint,
                json=auth_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('token')
                self.auth_headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.auth_token}'
                }
                print("✅ Authentication successful")
                return True
            else:
                print(f"❌ Authentication failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Authentication error: {str(e)}")
            return False
        
    def start(self):
        """Start the attendance system"""
        # Start RFID API to listen for RFID scans
        self.rfid_api.start()
        print("Attendance system started")
        
    def stop(self):
        """Stop the attendance system"""
        self.rfid_api.stop()
        print("Attendance system stopped")
    
    def _determine_attendance_status(self):
        """
        Determine attendance status based on time
        
        Returns:
            str: "present", "late", or "absent"
        """
        # Get current time
        now = datetime.now()
        current_hour = now.hour
        current_minute = now.minute
        
        # Assume classes start at the beginning of each hour
        minutes_late = current_minute
        
        # Determine status
        status = "present"
        if minutes_late > 15 and minutes_late <= 30:
            status = "late"
        elif minutes_late > 30:
            status = "absent"
            
        return status
    
    def _encode_image_base64(self, image):
        """
        Encode image to base64
        
        Args:
            image (numpy.ndarray): Image to encode
            
        Returns:
            str: Base64 encoded image
        """
        if image is None:
            return None
            
        # Convert to JPEG
        success, buffer = cv2.imencode('.jpg', image)
        if not success:
            return None
            
        # Encode to base64
        return base64.b64encode(buffer).decode('utf-8')
    
    def get_attendance_status(self):
        """
        Get the status of the last attendance record
        
        Returns:
            str: Status of the last attendance record
        """
        return self.last_attendance_status or "unknown"
    
    def record_attendance(self, rfid_id, frame=None):
        """
        Record attendance for RFID ID with optional face verification
        
        Args:
            rfid_id (str): RFID ID
            frame (numpy.ndarray): Optional camera frame for face verification
            
        Returns:
            dict: Attendance record result
        """
        # Validate authentication
        if not self.auth_token:
            print("Authentication required. Please authenticate first.")
            if not self.authenticate():
                return {"success": False, "error": "Authentication failed"}
        
        # Step 1: Verify RFID exists and get user ID
        user_id = self.rfid_api.get_user_id_from_rfid(rfid_id)
        if not user_id:
            print(f"Cannot record attendance: Unknown RFID {rfid_id}")
            return {
                "success": False,
                "error": "Unknown RFID"
            }
            
        # Step 2: Perform face verification if frame is provided
        verification_data = None
        face_image_base64 = None
        
        if frame is not None:
            verification_data = self.face_verification.verify_face(frame, rfid_id)
            face_image_base64 = self._encode_image_base64(frame)
        
        # Step 3: Determine attendance status
        status = self._determine_attendance_status()
        self.last_attendance_status = status
        
        # Step 4: Record attendance with the API
        timestamp = datetime.now().isoformat()
        self.last_attendance_time = timestamp
        
        # Create payload according to the NodeJS API documentation
        attendance_data = {
            'rfidId': rfid_id,
            'userId': user_id,
            'checkIn': timestamp,
            'timestamp': timestamp,
            'deviceId': 'jetson-nano-001',
            'location': 'Main Entrance',
            'classroomId': self.classroom_id,
            'status': status
        }
        
        # Add verification data if provided
        if verification_data:
            attendance_data.update({
                'faceVerified': verification_data.get('match', False),
                'verificationScore': verification_data.get('score', 0.0),
                'antiSpoofingResult': verification_data.get('anti_spoofing', False)
            })
            
        # Add face image if available
        if face_image_base64:
            attendance_data['faceImage'] = f"data:image/jpeg;base64,{face_image_base64}"
        
        # Log the request data 
        print(f"Recording attendance with data:")
        print(f"  RFID ID: {rfid_id}")
        print(f"  User ID: {user_id}")
        print(f"  Status: {status}")
        print(f"  Face verification: {bool(verification_data)}")
        
        # Send to API
        try:
            print("Sending attendance data to server...")
            print(f"API URL: {self.attendance_endpoint}")
            
            response = requests.post(
                self.attendance_endpoint,
                json=attendance_data,
                headers=self.auth_headers,
                timeout=10
            )
            
            # Log the response
            print(f"Response status: {response.status_code}")
            try:
                response_text = response.json()
                print(f"Response data: {json.dumps(response_text, indent=2)}")
            except:
                print(f"Response text: {response.text[:200]}")
            
            if response.status_code in (200, 201):
                response_data = response.json()
                print(f"✅ Successfully recorded attendance for RFID: {rfid_id}")
                print(f"✅ User ID: {user_id}")
                print(f"✅ Status: {status}")
                
                return {
                    "success": True,
                    "data": response_data,
                    "status": status,
                    "userId": user_id,
                    "timestamp": timestamp
                }
            else:
                print(f"❌ Failed to record attendance: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "error": f"API Error: {response.status_code}",
                    "details": response.text
                }
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection error with server. Please check network connection and server URL.")
            print(f"   Server URL: {self.api_url}")
            return {
                "success": False,
                "error": "Connection Error"
            }
        except requests.exceptions.Timeout:
            print(f"❌ Timeout when connecting to server. Server not responding.")
            return {
                "success": False,
                "error": "Timeout Error"
            }
        except Exception as e:
            print(f"❌ Error recording attendance: {str(e)}")
            print(f"   Error type: {e.__class__.__name__}")
            return {
                "success": False,
                "error": f"Error: {str(e)}"
            }
    
    def handle_attendance_verification(self, user_id=None, verification_image=None, rfid_card_id=None):
        """
        Handle attendance verification process
        
        Args:
            user_id (str): User ID
            verification_image (numpy.ndarray): Image for face verification
            rfid_card_id (str): RFID card ID
            
        Returns:
            bool: True if verification successful and attendance recorded
        """
        if not rfid_card_id:
            print("RFID card ID is required for attendance verification")
            return False
            
        # Record attendance
        result = self.record_attendance(
            rfid_id=rfid_card_id,
            frame=verification_image
        )
        
        return result.get('success', False)
    
    def set_auth_token(self, token):
        """
        Set authentication token manually
        
        Args:
            token (str): Authentication token
            
        Returns:
            bool: True if token was set, False otherwise
        """
        if not token:
            return False
            
        self.auth_token = token
        self.auth_headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }
        return True

# Testing function
def test_attendance_system():
    """Test the attendance system with sample data"""
    api_url = "http://fams.io.vn/api-nodejs"  # Change to your API URL
    
    # Initialize system
    attendance_system = AttendanceSystem(api_url=api_url)
    
    # Authenticate
    if not attendance_system.authenticate():
        print("Authentication failed, exiting test")
        return
    
    # Test with dummy RFID
    test_rfid = "RFID12345"  # Change to a valid RFID in your system
    
    # Record attendance (no face verification)
    result = attendance_system.record_attendance(test_rfid)
    
    print("Attendance recording result:")
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    # Test the attendance system
    test_attendance_system()
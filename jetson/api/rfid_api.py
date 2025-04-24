import os
import sys
import json
import time
import requests
from pathlib import Path
import threading
from datetime import datetime

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

# Import RFID from the model directory
from model.RFID.rfid import RFID
from utils.config_utils import config

class RFIDApi:
    def __init__(self, api_base_url=None):
        """
        Initialize the RFID API with configuration
        
        Args:
            api_base_url (str): Base URL for API
        """
        self.api_base_url = api_base_url or "http://fams.io.vn/api-nodejs"
        
        # Ensure api_base_url does not end with /api
        if self.api_base_url.endswith('/api'):
            self.api_base_url = self.api_base_url[:-4]
            
        # Define endpoints
        self.rfid_endpoint = f"{self.api_base_url}/rfid"
        self.auth_endpoint = f"{self.api_base_url}/auth/login"
        self.attendance_endpoint = f"{self.api_base_url}/attendance/record"
        
        # Authentication
        self.auth_token = None
        self.auth_headers = {
            'Content-Type': 'application/json'
        }
        
        # RFID state
        self.rfid_database = {}  # Map of RFID IDs to user info
        self.last_scanned_id = None
        self.scan_history = []
        
        # Threading
        self._stop_event = threading.Event()
        self._listener_thread = None
        self.running = False
        
        # Try to authenticate at initialization
        self._authenticate()
        
    def _authenticate(self):
        """Authenticate with the API to get auth token"""
        auth_data = {
            "userId": "admin",  # Use admin account for system integration
            "password": "1234"  # Mật khẩu mặc định
        }
        
        try:
            print(f"Đang xác thực với API tại {self.auth_endpoint}")
            print(f"Dữ liệu xác thực: {json.dumps(auth_data)}")
            
            response = requests.post(
                self.auth_endpoint,
                json=auth_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            print(f"Mã trạng thái phản hồi: {response.status_code}")
            print(f"Headers phản hồi: {dict(response.headers)}")
            
            # In nội dung phản hồi
            try:
                response_json = response.json()
                print(f"Nội dung phản hồi: {json.dumps(response_json, indent=2, ensure_ascii=False)}")
            except:
                print(f"Nội dung phản hồi (không phải JSON): {response.text[:200]}")
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get('token')
                self.auth_headers = {
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {self.auth_token}'
                }
                print("✅ API Authentication successful")
                return True
            else:
                print(f"❌ API Authentication failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ API Authentication error: {str(e)}")
            print(f"   Loại lỗi: {e.__class__.__name__}")
            return False
    
    def start(self):
        """Start the RFID listener thread"""
        if self._listener_thread and self._listener_thread.is_alive():
            print("RFID listener already running")
            return
            
        self.running = True
        self._stop_event.clear()
        self._listener_thread = threading.Thread(target=self._rfid_listener_loop)
        self._listener_thread.daemon = True
        self._listener_thread.start()
        print("RFID listener started")
        
        # Sync RFID database
        self._sync_rfid_database()
    
    def stop(self):
        """Stop the RFID listener thread"""
        self._stop_event.set()
        self.running = False
        if self._listener_thread:
            self._listener_thread.join(timeout=2.0)
        print("RFID listener stopped")
    
    def _rfid_listener_loop(self):
        """
        Main loop that simulates/listens for RFID scans
        In a real implementation, this would interface with hardware
        """
        print("RFID listener started")
        
        # For demonstration, this example just waits for user input
        # In a real implementation, this would listen to RFID hardware events
        try:
            while self.running and not self._stop_event.is_set():
                # Simulate hardware polling or event handling
                time.sleep(0.1)
                
                # For testing purposes - simulate RFID scan by checking a file
                self._check_rfid_file()
        except Exception as e:
            print(f"RFID listener error: {str(e)}")
            self.running = False
    
    def _check_rfid_file(self):
        """
        Check for RFID scans saved in a file (for testing only)
        In a real implementation, this would interface with hardware
        """
        rfid_file = os.path.join(project_root, "data", "last_rfid.txt")
        
        try:
            if os.path.exists(rfid_file):
                with open(rfid_file, 'r') as f:
                    rfid_id = f.read().strip()
                    
                if rfid_id and rfid_id != self.last_scanned_id:
                    # Only process if it's a new ID
                    self._process_rfid_scan(rfid_id)
                    # Remove or rename the file to avoid processing again
                    os.remove(rfid_file)
        except Exception as e:
            print(f"Error checking RFID file: {str(e)}")
    
    def _process_rfid_scan(self, rfid_id):
        """
        Process a new RFID scan
        
        Args:
            rfid_id (str): The scanned RFID ID
        """
        print(f"Đọc mã RFID: {rfid_id}")
        self.last_scanned_id = rfid_id
        self.scan_history.append({
            'rfid_id': rfid_id,
            'timestamp': time.time()
        })
        
        # Verify RFID in database
        self._verify_rfid(rfid_id)
    
    def _verify_rfid(self, rfid_id):
        """
        Verify RFID exists in database
        
        Args:
            rfid_id (str): RFID ID to verify
        
        Returns:
            bool: True if verified, False otherwise
        """
        # First check local cache
        if rfid_id in self.rfid_database:
            user_info = self.rfid_database[rfid_id]
            print(f"Xác thực RFID thành công: {rfid_id} (User: {user_info.get('user_id', 'Unknown')})")
            return True
            
        # If not in cache, check API
        try:
            response = requests.get(
                f"{self.rfid_endpoint}/{rfid_id}",
                headers=self.auth_headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    rfid_data = data.get('data', {})
                    user_id = rfid_data.get('UserID')
                    
                    # Add to local cache
                    self.rfid_database[rfid_id] = {
                        'user_id': user_id,
                        'status': rfid_data.get('Status', 'active'),
                        'last_verified': time.time()
                    }
                    
                    print(f"Xác thực RFID thành công: {rfid_id} (User: {user_id})")
                    return True
                    
            print(f"Xác thực RFID thất bại: {rfid_id}")
            return False
            
        except Exception as e:
            print(f"Lỗi xác thực RFID: {str(e)}")
            return False
    
    def _sync_rfid_database(self):
        """Sync RFID database from API"""
        try:
            response = requests.get(
                self.rfid_endpoint,
                headers=self.auth_headers,
                params={'limit': 1000},  # Get up to 1000 records
                timeout=15
            )
            
            if response.status_code == 200:
                data = response.json()
                rfid_list = data.get('data', [])
                
                # Update local database
                for rfid in rfid_list:
                    rfid_id = rfid.get('RFID_ID')
                    user_id = rfid.get('UserID')
                    
                    if rfid_id and user_id:
                        self.rfid_database[rfid_id] = {
                            'user_id': user_id,
                            'status': rfid.get('Status', 'active'),
                            'last_synced': time.time()
                        }
                
                print(f"Đã đồng bộ {len(rfid_list)} thẻ RFID từ hệ thống")
                return True
            else:
                print(f"Đồng bộ RFID thất bại: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"Lỗi đồng bộ RFID: {str(e)}")
            return False
    
    def record_attendance(self, rfid_id, verification_data=None):
        """
        Record attendance for RFID ID
        
        Args:
            rfid_id (str): RFID ID
            verification_data (dict): Optional face verification data
            
        Returns:
            bool: True if successful, False otherwise
        """
        # Get user ID for this RFID
        user_id = None
        if rfid_id in self.rfid_database:
            user_id = self.rfid_database[rfid_id].get('user_id')
        
        # If we don't have the user ID, try to verify first
        if not user_id:
            if not self._verify_rfid(rfid_id):
                print(f"Không thể ghi nhận điểm danh: RFID không xác định")
                return False
                
            # Get the user ID after verification
            if rfid_id in self.rfid_database:
                user_id = self.rfid_database[rfid_id].get('user_id')
        
        # Get current time in ISO format
        timestamp = time.strftime("%Y-%m-%dT%H:%M:%S")
        
        # Determine attendance status based on time
        now = time.localtime()
        current_hour = now.tm_hour
        current_minute = now.tm_min
        
        # Assume classes start at the beginning of each hour
        minutes_late = current_minute
        
        # Determine status
        status = "present"
        if minutes_late > 15 and minutes_late <= 30:
            status = "late"
        elif minutes_late > 30:
            status = "absent"
        
        # Prepare attendance data
        attendance_data = {
            'rfidId': rfid_id,
            'userId': user_id,
            'checkIn': timestamp,
            'timestamp': timestamp,
            'deviceId': 'jetson-nano-001',
            'location': 'Main Entrance',
            'classroomId': 1,
            'status': status
        }
        
        # Add verification data if provided
        if verification_data:
            attendance_data.update({
                'faceVerified': verification_data.get('match', False),
                'verificationScore': verification_data.get('score', 0.0),
                'antiSpoofingResult': verification_data.get('anti_spoofing', False)
            })
        
        # Print the JSON data being sent
        print("\n=== GỬI DỮ LIỆU ĐIỂM DANH LÊN SERVER ===")
        print(f"URL: {self.attendance_endpoint}")
        print("JSON Data:")
        print(json.dumps(attendance_data, indent=2, ensure_ascii=False))
        print("="*50)
        
        # Send to API
        try:
            print("Đang gửi dữ liệu lên server...")
            response = requests.post(
                self.attendance_endpoint,
                json=attendance_data,
                headers=self.auth_headers,
                timeout=10
            )
            
            # Print the response
            print("\n=== PHẢN HỒI TỪ SERVER ===")
            print(f"Mã trạng thái: {response.status_code}")
            print(f"Headers: {dict(response.headers)}")
            
            try:
                response_json = response.json()
                print("Dữ liệu phản hồi:")
                print(json.dumps(response_json, indent=2, ensure_ascii=False))
            except:
                print("Nội dung phản hồi:")
                print(response.text[:500])  # Chỉ hiển thị 500 ký tự đầu tiên nếu nội dung dài
            
            print("="*50)
            
            if response.status_code in (200, 201):
                print(f"✅ Ghi nhận điểm danh thành công cho RFID: {rfid_id}")
                print(f"✅ User ID: {user_id}")
                print(f"✅ Trạng thái: {status}")
                print(f"✅ Thời gian: {timestamp}")
                return True
            else:
                print(f"❌ Ghi nhận điểm danh thất bại: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Lỗi kết nối với server. Vui lòng kiểm tra kết nối mạng và URL server.")
            print(f"   URL server: {self.api_base_url}")
            return False
        except requests.exceptions.Timeout:
            print(f"❌ Timeout khi kết nối đến server. Server không phản hồi.")
            return False
        except Exception as e:
            print(f"❌ Lỗi ghi nhận điểm danh: {str(e)}")
            print(f"   Lớp lỗi: {e.__class__.__name__}")
            return False
    
    def get_user_id_from_rfid(self, rfid_id):
        """
        Get user ID associated with RFID ID
        
        Args:
            rfid_id (str): RFID ID
            
        Returns:
            str: User ID or None if not found
        """
        # Check local cache first
        if rfid_id in self.rfid_database:
            return self.rfid_database[rfid_id].get('user_id')
            
        # Try to verify if not in cache
        if self._verify_rfid(rfid_id):
            return self.rfid_database[rfid_id].get('user_id')
            
        return None


# For testing
def test_rfid_api():
    """Test RFID API module"""
    api = RFIDApi(api_base_url="http://localhost:3002/api-nodejs")
    api.start()
    
    try:
        # Test RFID processing
        test_rfid = "0005563074"  # Example RFID from console output
        print(f"\nProcessing test RFID: {test_rfid}")
        user_id = api.get_user_id_from_rfid(test_rfid)
        
        if user_id:
            print(f"Found user ID: {user_id}")
            # Test attendance recording
            result = api.record_attendance(test_rfid)
            print(f"Attendance recording result: {result}")
        else:
            print("User ID not found for RFID")
        
        # Simulate RFID scan by writing to file
        data_dir = os.path.join(project_root, "data")
        os.makedirs(data_dir, exist_ok=True)
        
        with open(os.path.join(data_dir, "last_rfid.txt"), "w") as f:
            f.write(test_rfid)
        
        print("Added test RFID to scan file. Waiting for processing...")
        time.sleep(5)  # Wait for RFID to be processed
        
    except KeyboardInterrupt:
        print("Test interrupted by user")
    finally:
        api.stop()
        print("Test completed")


if __name__ == "__main__":
    test_rfid_api()

class RFIDAPIClient:
    """
    Client for interacting with the RFID API on the backend server
    """
    
    def __init__(self, api_url="http://localhost:3000/api", username=None, password=None):
        """
        Initialize the RFID API Client
        
        Args:
            api_url (str): Base URL for the API
            username (str): Username for API authentication (defaults to env var)
            password (str): Password for API authentication (defaults to env var)
        """
        self.api_url = api_url
        self.username = username or os.environ.get("RFID_API_USERNAME", "admin")
        self.password = password or os.environ.get("RFID_API_PASSWORD", "1234")
        self.auth_token = None
        self.token_expiry = None
    
    def authenticate(self):
        """
        Authenticate with the API and get an access token
        
        Returns:
            str: Authentication token if successful, None otherwise
        """
        try:
            auth_url = f"{self.api_url}/auth/login"
            auth_data = {
                "userId": self.username,  # Dùng userId thay vì username
                "password": self.password
            }
            
            print(f"Authenticating with API: {auth_url}")
            print(f"Auth data: {json.dumps(auth_data)}")
            
            response = requests.post(auth_url, json=auth_data)
            
            print(f"Response status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"Response data: {json.dumps(data)}")
                self.auth_token = data.get("data", {}).get("accessToken")
                # Set token expiry (usually 24 hours)
                self.token_expiry = datetime.now().timestamp() + 86400  # 24 hours in seconds
                return self.auth_token
            else:
                print(f"Authentication failed: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error during authentication: {e}")
            return None
    
    def _ensure_authenticated(self):
        """
        Ensure that we have a valid authentication token
        
        Returns:
            bool: True if authenticated, False otherwise
        """
        current_time = datetime.now().timestamp()
        
        # If no token or token expired, try to authenticate
        if not self.auth_token or (self.token_expiry and current_time >= self.token_expiry):
            return self.authenticate() is not None
        
        return True
    
    def get_user_by_card(self, card_id):
        """
        Get user information based on RFID card ID
        
        Args:
            card_id (str): The RFID card ID
            
        Returns:
            dict: User data if found, None otherwise
        """
        if not self._ensure_authenticated():
            print("Failed to authenticate for user lookup")
            return None
        
        try:
            user_url = f"{self.api_url}/users/rfid/{card_id}"
            headers = {
                "Authorization": f"Bearer {self.auth_token}"
            }
            
            response = requests.get(user_url, headers=headers)
            
            if response.status_code == 200:
                user_data = response.json()
                return user_data
            elif response.status_code == 404:
                print(f"No user found with card ID: {card_id}")
                return None
            else:
                print(f"Error fetching user: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error getting user by card: {e}")
            return None
    
    def get_user_attendance(self, user_id, date=None):
        """
        Get attendance records for a specific user
        
        Args:
            user_id (str): The user ID
            date (str): Optional date in YYYY-MM-DD format. If None, gets today's attendance.
            
        Returns:
            dict: Attendance data if found, None otherwise
        """
        if not self._ensure_authenticated():
            print("Failed to authenticate for attendance lookup")
            return None
        
        try:
            # Format the date parameter
            date_param = ""
            if date:
                date_param = f"?date={date}"
            
            attendance_url = f"{self.api_url}/attendance/user/{user_id}{date_param}"
            headers = {
                "Authorization": f"Bearer {self.auth_token}"
            }
            
            response = requests.get(attendance_url, headers=headers)
            
            if response.status_code == 200:
                attendance_data = response.json()
                return attendance_data
            elif response.status_code == 404:
                print(f"No attendance records found for user: {user_id}")
                return None
            else:
                print(f"Error fetching attendance: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"Error getting user attendance: {e}")
            return None 
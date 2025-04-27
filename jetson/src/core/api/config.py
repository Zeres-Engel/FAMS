import os
from dotenv import load_dotenv
from pathlib import Path
import sys

# Load environment variables from .env file
dotenv_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(dotenv_path)

class APIConfig:
    """Configuration class for API settings loaded from .env file"""
    
    # Lấy URL API trực tiếp từ .env, không thêm bất kỳ path bổ sung nào
    API_ENDPOINT = os.getenv('API_CHECK_ATTENDANCE', '')
    ACCESS_TOKEN = os.getenv('ACCESS_TOKEN', '')
    
    # In ra thông tin cấu hình khi khởi tạo
    print(f"\n==== API CONFIGURATION ====")
    print(f"API Endpoint: {API_ENDPOINT}")
    print(f"Access Token Available: {'Yes' if ACCESS_TOKEN else 'No'}")
    
    # Xác thực cấu hình
    if not API_ENDPOINT:
        print(f"WARNING: API endpoint not properly configured in .env file")
        print(f"API calls will fail. Please update the API_CHECK_ATTENDANCE value in .env file.")
    
    if not ACCESS_TOKEN:
        print(f"WARNING: API access token is missing. API calls will likely fail.")
        print(f"Please update the ACCESS_TOKEN value in .env file.")
    
    # Request headers
    @classmethod
    def get_headers(cls):
        headers = {
            'Authorization': f'Bearer {cls.ACCESS_TOKEN}',
            'Content-Type': 'application/json'
        }
        return headers
    
    @classmethod
    def validate_config(cls):
        """Kiểm tra và xác nhận cấu hình API đã đúng chưa"""
        issues = []
        
        if not cls.API_ENDPOINT:
            issues.append("API_CHECK_ATTENDANCE environment variable is not configured.")
        
        if not cls.ACCESS_TOKEN:
            issues.append("ACCESS_TOKEN environment variable is not set.")
        
        if issues:
            print("\n==== API CONFIGURATION ISSUES ====")
            for issue in issues:
                print(f"- {issue}")
            print("API calls may fail until these issues are resolved.")
            return False
        
        return True 
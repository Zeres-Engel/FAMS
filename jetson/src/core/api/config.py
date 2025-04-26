import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables from .env file
dotenv_path = Path(__file__).parent.parent.parent.parent / '.env'
load_dotenv(dotenv_path)

class APIConfig:
    """Configuration class for API settings loaded from .env file"""
    
    API_ENDPOINT = os.getenv('API_CHECK_ATTENDANCE', 'https://api.checkattendance.com/api/v1/')
    ACCESS_TOKEN = os.getenv('ACCESS_TOKEN', '')
    
    # Request headers
    @classmethod
    def get_headers(cls):
        return {
            'Authorization': f'Bearer {cls.ACCESS_TOKEN}',
            'Content-Type': 'application/json'
        } 
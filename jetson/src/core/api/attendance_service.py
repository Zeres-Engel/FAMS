import requests
import json
from typing import Dict, Any, Optional
import logging

from src.core.api.config import APIConfig
from src.core.api.result import Result

class AttendanceService:
    """Service for sending attendance data to server"""
    
    def __init__(self):
        self.api_endpoint = APIConfig.API_ENDPOINT
        self.headers = APIConfig.get_headers()
        self.logger = logging.getLogger("AttendanceService")
    
    def send_attendance(self, attendance_data: Dict[str, Any]) -> Result:
        """
        Send attendance data to server
        
        Args:
            attendance_data: Dictionary containing attendance information
                {
                  "deviceId": 1,
                  "userId": "user_id",
                  "RFID_ID": "rfid_id",
                  "CheckIn": "2023-08-15 14:30:27",
                  "CheckInFace": "data/attendance/user_id/2023-08-15_14-30-27.jpg"
                }
                
        Returns:
            Result object containing response data
        """
        try:
            endpoint = f"{self.api_endpoint}/attendance"
            
            # Log the request
            self.logger.info(f"Sending attendance data: {json.dumps(attendance_data)}")
            
            # Send data to server
            response = requests.post(
                endpoint,
                headers=self.headers,
                json=attendance_data
            )
            
            # Process response
            if response.status_code == 200:
                response_data = response.json()
                return Result.success_result(
                    data=response_data,
                    message="Attendance sent successfully"
                )
            else:
                error_message = f"Failed to send attendance. Status code: {response.status_code}"
                
                try:
                    error_data = response.json()
                    error_message = error_data.get('message', error_message)
                except:
                    pass
                
                return Result.error_result(
                    message=error_message,
                    status_code=response.status_code
                )
                
        except Exception as e:
            self.logger.error(f"Error sending attendance: {str(e)}")
            return Result.error_result(
                message=f"Error sending attendance: {str(e)}",
                status_code=500
            )
    
    def get_attendance_history(self, user_id: str, from_date: Optional[str] = None, to_date: Optional[str] = None) -> Result:
        """
        Get attendance history for a user
        
        Args:
            user_id: User ID
            from_date: Start date in format YYYY-MM-DD (Optional)
            to_date: End date in format YYYY-MM-DD (Optional)
            
        Returns:
            Result object containing attendance history
        """
        try:
            endpoint = f"{self.api_endpoint}/attendance/{user_id}"
            
            # Add date filters if provided
            params = {}
            if from_date:
                params['from'] = from_date
            if to_date:
                params['to'] = to_date
            
            # Send request
            response = requests.get(
                endpoint,
                headers=self.headers,
                params=params
            )
            
            # Process response
            if response.status_code == 200:
                response_data = response.json()
                return Result.success_result(
                    data=response_data,
                    message="Attendance history retrieved successfully"
                )
            else:
                return Result.error_result(
                    message=f"Failed to get attendance history. Status code: {response.status_code}",
                    status_code=response.status_code
                )
                
        except Exception as e:
            self.logger.error(f"Error getting attendance history: {str(e)}")
            return Result.error_result(
                message=f"Error getting attendance history: {str(e)}",
                status_code=500
            ) 
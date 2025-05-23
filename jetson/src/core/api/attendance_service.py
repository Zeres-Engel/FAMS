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
                  "userId": "user_id",
                  "deviceId": 1,
                  "checkIn": "2023-08-15T14:30:27Z",
                  "checkInFace": "data:image/jpeg;base64,...",
                  "faceVectorList": [
                    {
                      "vectorType": "front",
                      "vector": [0.1, 0.2, 0.3, ...],
                      "score": 0.95
                    }
                  ]
                }
                
        Returns:
            Result object containing response data
        """
        try:
            # Sử dụng trực tiếp URL API đã cấu hình từ .env thay vì thêm /attendance
            endpoint = self.api_endpoint
            
            # In thông tin endpoint và headers để gỡ lỗi
            print(f"DEBUG API - Sending attendance data to: {endpoint}")
            print(f"DEBUG API - Headers: {self.headers}")
            print(f"DEBUG API - Using HTTP Method: PUT")
            
            # Loại bỏ vector và ảnh để in log gọn hơn
            debug_data = attendance_data.copy()
            if "faceVectorList" in debug_data and debug_data["faceVectorList"]:
                vector_count = len(debug_data["faceVectorList"])
                vector_type = debug_data["faceVectorList"][0]["vectorType"]
                vector_score = debug_data["faceVectorList"][0]["score"]
                debug_data["faceVectorList"] = f"[{vector_count} vectors of type '{vector_type}', score: {vector_score}]"
            
            if "checkInFace" in debug_data and debug_data["checkInFace"]:
                debug_data["checkInFace"] = "data:image/jpeg;base64,...[truncated]"
            
            # Log the request
            self.logger.info(f"Sending attendance data: {json.dumps(debug_data)}")
            print(f"DEBUG API - Sending data: {json.dumps(debug_data, indent=2)}")
            
            # Send data to server using PUT method
            response = requests.put(
                endpoint,
                headers=self.headers,
                json=attendance_data,
                timeout=10  # Thêm timeout
            )
            
            # Process response
            print(f"DEBUG API - Response status: {response.status_code}")
            print(f"DEBUG API - Response headers: {response.headers}")
            
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    print(f"DEBUG API - Response data: {json.dumps(response_data, indent=2)}")
                    return Result.success_result(
                        data=response_data,
                        message="Attendance sent successfully"
                    )
                except Exception as e:
                    print(f"DEBUG API - Error parsing response JSON: {e}")
                    return Result.success_result(
                        data={"raw_response": response.text},
                        message="Attendance sent successfully (non-JSON response)"
                    )
            else:
                error_message = f"Failed to send attendance. Status code: {response.status_code}"
                
                try:
                    error_data = response.json()
                    error_message = error_data.get('message', error_message)
                    print(f"DEBUG API - Error response: {json.dumps(error_data, indent=2)}")
                except Exception as e:
                    print(f"DEBUG API - Non-JSON error response: {response.text}")
                    error_message = f"{error_message}, Response: {response.text}"
                
                return Result.error_result(
                    message=error_message,
                    status_code=response.status_code
                )
                
        except requests.exceptions.ConnectionError as e:
            error_msg = f"Connection error: {str(e)}"
            self.logger.error(error_msg)
            print(f"DEBUG API - {error_msg}")
            print(f"DEBUG API - Please check if the server is running and accessible: {self.api_endpoint}")
            return Result.error_result(
                message=error_msg,
                status_code=503  # Service Unavailable
            )
        except requests.exceptions.Timeout as e:
            error_msg = f"Request timeout: {str(e)}"
            self.logger.error(error_msg)
            print(f"DEBUG API - {error_msg}")
            return Result.error_result(
                message=error_msg,
                status_code=504  # Gateway Timeout
            )
        except Exception as e:
            error_msg = f"Error sending attendance: {str(e)}"
            self.logger.error(error_msg)
            print(f"DEBUG API - {error_msg}")
            return Result.error_result(
                message=error_msg,
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
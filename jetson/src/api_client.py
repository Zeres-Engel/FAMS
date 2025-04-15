import requests
import json
from datetime import datetime
from typing import Dict, Any, Optional
import traceback

class APIClient:
    """Client for interacting with the Face Recognition & RFID API Server"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.headers = {
            "Content-Type": "application/json"
        }
    
    def record_access(self, 
                      rfid: str, 
                      room: str, 
                      person_name: Optional[str] = None,
                      verification_result: Optional[bool] = None,
                      confidence_score: Optional[float] = None) -> Dict[str, Any]:
        """
        Record an access event with RFID and room information
        
        Args:
            rfid: The RFID card ID
            room: The room or location identifier
            person_name: Name of the person (optional)
            verification_result: Whether face verification was successful
            confidence_score: Confidence score of face recognition
            
        Returns:
            Dict containing the server response
        """
        try:
            data = {
                "rfid": rfid,
                "room": room,
                "timestamp": datetime.now().isoformat(),
            }
            
            # Add optional fields if provided
            if person_name:
                data["person_name"] = person_name
            if verification_result is not None:
                data["verification_result"] = verification_result
            if confidence_score is not None:
                data["confidence_score"] = confidence_score
                
            response = requests.post(
                f"{self.base_url}/api/access/record",
                headers=self.headers,
                json=data,
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error recording access: {response.status_code} - {response.text}")
                return {"error": f"Failed with status {response.status_code}", "details": response.text}
        except Exception as e:
            print(f"Exception in record_access: {str(e)}")
            traceback.print_exc()
            return {"error": str(e)}
    
    def verify_identity(self, rfid: str, face_name: str) -> Dict[str, Any]:
        """
        Verify if RFID matches the recognized face
        
        Args:
            rfid: The RFID card ID
            face_name: The name recognized from face recognition
            
        Returns:
            Dict containing verification result
        """
        try:
            response = requests.post(
                f"{self.base_url}/api/verify",
                headers=self.headers,
                params={"rfid": rfid, "face_name": face_name},
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error verifying identity: {response.status_code} - {response.text}")
                return {"error": f"Failed with status {response.status_code}", "details": response.text}
        except Exception as e:
            print(f"Exception in verify_identity: {str(e)}")
            return {"error": str(e)}
    
    def update_api_config(self, endpoint_url: str, api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Update API configuration for the external JSON service
        
        Args:
            endpoint_url: URL for the external JSON service
            api_key: Optional API key for authentication
            
        Returns:
            Dict containing the updated configuration
        """
        try:
            data = {
                "endpoint_url": endpoint_url
            }
            if api_key:
                data["api_key"] = api_key
                
            response = requests.post(
                f"{self.base_url}/api/config",
                headers=self.headers,
                json=data,
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error updating API config: {response.status_code} - {response.text}")
                return {"error": f"Failed with status {response.status_code}", "details": response.text}
        except Exception as e:
            print(f"Exception in update_api_config: {str(e)}")
            return {"error": str(e)}
    
    def get_api_config(self) -> Dict[str, Any]:
        """
        Get current API configuration
        
        Returns:
            Dict containing the current API configuration
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/config",
                headers=self.headers,
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                print(f"Error getting API config: {response.status_code} - {response.text}")
                return {"error": f"Failed with status {response.status_code}", "details": response.text}
        except Exception as e:
            print(f"Exception in get_api_config: {str(e)}")
            return {"error": str(e)} 
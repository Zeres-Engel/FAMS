import os
import sys
from pathlib import Path
from datetime import datetime
import json
import requests
from typing import Optional, Dict, Any
import uvicorn

# Add project root to Python path
project_root = str(Path(__file__).parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Import face recognition system components
from src.zensys import ZenSys
from utils.config_utils import config

# Create FastAPI app
app = FastAPI(title="Face Recognition & RFID API Server", 
              description="API Server for face recognition and RFID integration")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Can be restricted to specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize face recognition system
face_system = None

# Model for access record
class AccessRecord(BaseModel):
    rfid: str
    person_name: Optional[str] = None
    room: str
    timestamp: datetime = datetime.now()
    verification_result: Optional[bool] = None
    confidence_score: Optional[float] = None

# Model for API configuration
class APIConfig(BaseModel):
    endpoint_url: str
    api_key: Optional[str] = None

# Default API configuration
api_config = APIConfig(
    endpoint_url="http://example.com/api/access",
    api_key=""
)

# Helper function to get face system
def get_face_system():
    global face_system
    if face_system is None:
        face_system = ZenSys()
        # Load database if exists
        if not os.path.exists(os.path.join(config.db_path, "face_index.faiss")):
            face_system.process_gallery()
        face_system.load_database()
    return face_system

# Send data to external JSON service
async def send_to_json_service(access_record: AccessRecord):
    """Send access record to external JSON service"""
    try:
        headers = {}
        if api_config.api_key:
            headers["Authorization"] = f"Bearer {api_config.api_key}"
        
        response = requests.post(
            api_config.endpoint_url,
            json=access_record.dict(),
            headers=headers,
            timeout=10
        )
        
        if response.status_code >= 400:
            print(f"Error sending data to service: {response.status_code} - {response.text}")
        else:
            print(f"Data sent successfully: {response.status_code}")
    except Exception as e:
        print(f"Failed to send data to service: {str(e)}")

# Route to record access with RFID and room
@app.post("/api/access/record", response_model=AccessRecord)
async def record_access(
    record: AccessRecord,
    background_tasks: BackgroundTasks,
    face_sys: ZenSys = Depends(get_face_system)
):
    """Record an access event with RFID and room information"""
    try:
        # Get person name from RFID if not provided
        if not record.person_name:
            record.person_name = face_sys.rfid_system.get_name_from_id(record.rfid)
        
        # Add current timestamp if not provided
        if not record.timestamp:
            record.timestamp = datetime.now()
        
        # Send data to external service in background
        background_tasks.add_task(send_to_json_service, record)
        
        return record
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to record access: {str(e)}")

# Route to verify RFID against face recognition
@app.post("/api/verify", response_model=Dict[str, Any])
async def verify_identity(
    rfid: str,
    face_name: str,
    face_sys: ZenSys = Depends(get_face_system)
):
    """Verify if RFID matches the recognized face"""
    try:
        result = face_sys.rfid_system.verify_identity(rfid, face_name)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify identity: {str(e)}")

# Route to update API configuration
@app.post("/api/config", response_model=APIConfig)
async def update_api_config(config: APIConfig):
    """Update API configuration for the external JSON service"""
    global api_config
    api_config = config
    return api_config

# Route to get current API configuration
@app.get("/api/config", response_model=APIConfig)
async def get_api_config():
    """Get current API configuration"""
    return api_config

# Main entry point
if __name__ == "__main__":
    uvicorn.run("api_server:app", host="0.0.0.0", port=8000, reload=True) 
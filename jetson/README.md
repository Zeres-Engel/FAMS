# Face Recognition with RFID Integration

This system combines face recognition, depth sensing for anti-spoofing, and RFID card scanning for secure access control. It now includes a FastAPI server to send access records to an external system.

## Features

- Face detection and recognition using InsightFace
- RFID card scanning for two-factor authentication
- Depth sensing for 3D face anti-spoofing
- FastAPI server for sending access records to external systems
- PySide6-based GUI interface

## Requirements

- Python 3.8+
- CUDA-capable GPU (recommended)
- Webcam
- RFID reader (or keyboard simulation)

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/face-recognition-rfid.git
   cd face-recognition-rfid
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the application:
   ```
   python app.py
   ```

4. Run the API server (in a separate terminal):
   ```
   python api_server.py
   ```

## Usage

### Main Application

The main application (`app.py`) provides:
- Real-time face recognition
- RFID card scanning simulation via keyboard input
- Depth map visualization for anti-spoofing
- User verification against face recognition database

### API Server

The API server (`api_server.py`) provides:
- REST API for recording access events
- Endpoints for configuration
- Background task processing for sending data to external services

### API Endpoints

- `POST /api/access/record` - Record an access event with RFID and room information
- `POST /api/verify` - Verify if RFID matches the recognized face
- `POST /api/config` - Update API configuration for external JSON service
- `GET /api/config` - Get current API configuration

## Integration with External Systems

The system can send access records (RFID, person_name, room, timestamp, verification_result) to any external JSON service. Configure the endpoint URL and optional API key in the application's "Room & API Settings" dialog.

### Access Record Format

```json
{
  "rfid": "0005563074",
  "person_name": "John Doe",
  "room": "Office-101",
  "timestamp": "2023-06-01T14:30:22.123456",
  "verification_result": true,
  "confidence_score": 0.92
}
```

## Configuration

The system allows configuration of:
- Room ID - identifies the location of the access control system
- API Endpoint - URL for the external JSON service
- API Key - optional authentication key for the external service

## Security Notes

- The system uses depth sensing for basic anti-spoofing protection
- RFID verification provides a second factor for authentication
- For production use, consider implementing additional security measures 
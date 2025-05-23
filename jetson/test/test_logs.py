import sys
import os
import time
import cv2
import numpy as np
import json
import datetime
from pathlib import Path

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

def print_rfid_scan():
    """Print sample RFID scan JSON"""
    rfid_scan_info = {
        "event_type": "RFID_SCAN",
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "RFID_ID": "0005563074",
        "registered_name": "thanhnpst1",
        "status": "Waiting for face verification",
        "classroomId": 1
    }
    
    print("\n--- RFID SCAN DETECTED ---")
    print(json.dumps(rfid_scan_info, indent=2))
    print("-------------------------\n")

def print_verification_result():
    """Print sample verification result JSON"""
    verification_info = {
        "event_type": "FACE_VERIFICATION",
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "RFID_ID": "0005563074",
        "registered_name": "thanhnpst1",
        "detected_face": "thanhnpst1",
        "face_score": 0.92,
        "identity_match": True,
        "anti_spoofing": {
            "status": "LIVE",
            "is_live_face": True
        },
        "classroomId": 1
    }
    
    print("\n--- FACE VERIFICATION RESULT ---")
    print(json.dumps(verification_info, indent=2))
    
    # Sample anti-spoofing details
    anti_spoof_details = {
        "depth_variance": 0.023,
        "mean_gradient": 0.18,
        "min_depth": 0.12,
        "max_depth": 0.42,
        "depth_range": 0.30
    }
    print("\n--- ANTI-SPOOFING DETAILS ---")
    print(json.dumps(anti_spoof_details, indent=2))
    print("-----------------------------\n")

def print_attendance_log():
    """Print sample attendance log JSON"""
    attendance_record = {
        "classroomId": 1,
        "userId": "thanhnpst1",
        "RFID_ID": "0005563074",
        "CheckIn": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "CheckInFace": "data/attendance/thanhnpst1/2023-08-15_14-30-25.jpg"
    }
    
    print("\n--- ATTENDANCE LOG ---")
    print(json.dumps(attendance_record, indent=2))
    print("---------------------\n")

def simulate_full_pipeline():
    """Simulate the full attendance pipeline with all log formats"""
    print("\n=== Simulating Full Attendance Pipeline ===\n")
    
    print("1. User scans RFID card...")
    time.sleep(1)
    print_rfid_scan()
    
    print("2. Face detection and verification in progress...")
    time.sleep(1.5)
    print_verification_result()
    
    print("3. Attendance recorded...")
    time.sleep(1)
    print_attendance_log()
    
    print("\n=== Simulation Complete ===\n")

if __name__ == "__main__":
    simulate_full_pipeline() 
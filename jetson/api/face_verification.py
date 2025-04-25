import os
import sys
import cv2
import numpy as np
import base64
from pathlib import Path
import threading
import time

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

# Import face detection and recognition modules
from src.zenface import ZenFace
from src.zensys import ZenSys

class FaceVerification:
    def __init__(self):
        """Initialize the face verification system"""
        self.zen_sys = ZenSys()
        self.face_analyzer = self.zen_sys.face_analyzer
        
        # Load database for face recognition
        self.zen_sys.load_database()
        
        # Initialize state variables
        self.last_verified_face = None
        self.current_verification_result = None
        self._lock = threading.Lock()
        
    def verify_face(self, frame, rfid_id):
        """
        Verify a person's face against their RFID
        
        Args:
            frame (np.ndarray): Camera frame containing face
            rfid_id (str): RFID ID to verify against
            
        Returns:
            dict: Verification result containing match status, score, and anti-spoofing result
        """
        with self._lock:
            # Step 1: Get RFID user info from database
            rfid_user = self.zen_sys.rfid_system.get_name_from_id(rfid_id)
            if rfid_user == "Unknown":
                print(f"Unknown RFID: {rfid_id}")
                return {
                    "match": False,
                    "score": 0.0,
                    "anti_spoofing": False,
                    "error": "Unknown RFID"
                }
            
            # Step 2: Detect faces in the frame
            faces = self.face_analyzer.get(frame)
            if not faces:
                print("No face detected in frame")
                return {
                    "match": False,
                    "score": 0.0,
                    "anti_spoofing": False,
                    "error": "No face detected"
                }
            
            # Step 3: Use the largest face (should be the closest person)
            face = faces[0]  # The face detector is configured to only return the largest face
            
            # Store the face image for later use
            x1, y1, x2, y2 = [int(b) for b in face.bbox]
            face_crop = frame[max(0, y1):min(frame.shape[0], y2), max(0, x1):min(frame.shape[1], x2)]
            self.last_verified_face = face_crop
            
            # Step 4: Run face recognition to get the identity
            name, score = self.zen_sys.recognize_face(face.normed_embedding)
            
            # Step 5: Check if identity matches RFID user
            match = (name.lower() == rfid_user.lower())
            
            # Step 6: Run anti-spoofing checks if we have depth data
            anti_spoofing = False
            
            # If we have depth data, run anti-spoofing analysis
            try:
                depth_result = self.zen_sys.depth_predictor.predict_depth(frame)
                depth_map = depth_result['depth_map']
                
                if depth_map is not None:
                    anti_spoofing_result = self.zen_sys.process_depth_anti_spoofing(depth_map, face)
                    if anti_spoofing_result:
                        anti_spoofing = anti_spoofing_result.get("detection_result", False)
            except Exception as e:
                print(f"Error in anti-spoofing: {e}")
                anti_spoofing = False
            
            # Create verification result
            verification_result = {
                "match": match,
                "score": float(score),
                "anti_spoofing": anti_spoofing,
                "recognized_name": name,
                "rfid_name": rfid_user
            }
            
            # Store the result for later reference
            self.current_verification_result = verification_result
            
            return verification_result
            
    def encode_face_image(self, resize=None):
        """
        Encode the last verified face as a base64 string
        
        Args:
            resize (tuple, optional): Optional size to resize to (width, height)
            
        Returns:
            str: Base64 encoded JPEG image or None if no face
        """
        if self.last_verified_face is None:
            return None
            
        # Make a copy to avoid threading issues
        face_img = self.last_verified_face.copy()
        
        # Resize if requested
        if resize and len(resize) == 2:
            face_img = cv2.resize(face_img, resize)
        
        # Encode to JPEG
        _, buffer = cv2.imencode('.jpg', face_img, [cv2.IMWRITE_JPEG_QUALITY, 85])
        return base64.b64encode(buffer).decode('utf-8')
        
    def get_current_result(self):
        """Get the current verification result"""
        return self.current_verification_result
        
    def reset(self):
        """Reset the verification state"""
        with self._lock:
            self.last_verified_face = None
            self.current_verification_result = None 
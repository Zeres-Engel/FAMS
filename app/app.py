import sys
import os
import cv2
import numpy as np
import json
from PySide6.QtWidgets import (QApplication, QMainWindow, QLabel, QPushButton, 
                              QVBoxLayout, QHBoxLayout, QWidget, QProgressBar,
                              QMessageBox, QFileDialog)
from PySide6.QtCore import Qt, QTimer, Signal, QThread, Slot
from PySide6.QtGui import QImage, QPixmap

# Import existing face detection and analysis modules
from models.RetinaFace.retinaface import RetinaFace
from sixdrepnet import SixDRepNet
from models.utils.face_align import norm_crop

# Try to import AdaFace
try:
    from models.AdaFace.adaface_onnx import AdaFace
    HAS_ADAFACE = True
except ImportError as e:
    HAS_ADAFACE = False
    print(f"Warning: AdaFace model not found: {e}. Will use random vectors instead.")

class CameraThread(QThread):
    """Thread for camera capture to avoid UI freezing"""
    update_frame = Signal(np.ndarray)
    update_status = Signal(str)
    challenge_completed = Signal(str, tuple)  # pose_name, data_tuple
    
    def __init__(self, camera_id=0, score_threshold=0.5, min_size=122, aligned_size=112):
        super().__init__()
        self.camera_id = camera_id
        self.score_threshold = score_threshold
        self.min_size = min_size
        self.aligned_size = aligned_size
        self.running = False
        self.pose_name = None
        
        # Initialize detector and models
        self.detector = RetinaFace(model_file=os.path.join('assets','weights','retinaface.onnx'))
        self.detector.prepare(ctx_id=0)
        self.model = SixDRepNet()
        
        # Initialize face recognizer if available
        self.face_recognizer = None
        if HAS_ADAFACE:
            try:
                self.face_recognizer = AdaFace(model_file=os.path.join('assets','weights','adaface.onnx'))
                self.face_recognizer.prepare(ctx_id=0)
                print("AdaFace model loaded successfully")
            except Exception as e:
                print(f"Error loading AdaFace model: {e}")
    
    def is_valid_pose(self, pitch, yaw, roll):
        """Check if the current pose matches requirements"""
        if self.pose_name == 'front':
            return abs(pitch) < 5 and abs(yaw) < 5
        if self.pose_name == 'left':
            return yaw <= -15 and abs(pitch) < 5
        if self.pose_name == 'right':
            return yaw >= 15 and abs(pitch) < 5
        if self.pose_name == 'up':
            return pitch >= 15 and abs(yaw) < 5
        if self.pose_name == 'down':
            return pitch <= -15 and abs(yaw) < 5
        return False
    
    def set_pose(self, pose_name):
        """Set the current pose challenge"""
        self.pose_name = pose_name
    
    def run(self):
        """Main thread loop for camera capture and face analysis"""
        self.running = True
        cap = cv2.VideoCapture(self.camera_id)
        
        if not cap.isOpened():
            self.update_status.emit("Không thể mở camera")
            return
            
        while self.running:
            ret, frame = cap.read()
            if not ret:
                self.update_status.emit("Không thể đọc khung hình từ camera")
                break
                
            draw = frame.copy()
            
            # Process frame only if we have an active pose challenge
            if self.pose_name:
                bboxes, kpss = self.detector.detect(frame, input_size=(640,640))
                faces = []
                
                for i, (x1,y1,x2,y2,score) in enumerate(bboxes):
                    if score >= self.score_threshold:
                        area = (x2 - x1) * (y2 - y1)
                        kps = None if kpss is None else kpss[i]
                        faces.append((int(x1),int(y1),int(x2),int(y2),score, area, kps))
                
                if faces:
                    x1,y1,x2,y2,det_score,_,kps = max(faces, key=lambda x: x[5])
                    
                    if (x2-x1) < self.min_size or (y2-y1) < self.min_size:
                        cv2.putText(draw, "Please move closer: face too small", (50,50),
                                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,0,255), 2)
                        self.update_status.emit("Khuôn mặt quá nhỏ, hãy di chuyển gần camera hơn")
                    else:
                        cv2.rectangle(draw, (x1,y1),(x2,y2),(255,0,0),2)
                        cv2.putText(draw, f"S:{det_score:.2f}", (x1+5,y1+15),
                                    cv2.FONT_HERSHEY_SIMPLEX,0.5,(255,0,0),1)
                        
                        # Draw keypoints
                        if kps is not None:
                            for j in range(5):
                                cv2.circle(draw, (int(kps[j][0]), int(kps[j][1])), 2, (0,255,0), 2)
                        
                        face_img = frame[y1:y2, x1:x2]
                        try:
                            pitch, yaw, roll = self.model.predict(face_img)
                            p_val, y_val, r_val = float(pitch.item()), float(yaw.item()), float(roll.item())
                            
                            region = draw[y1:y2, x1:x2]
                            self.model.draw_axis(region, yaw, pitch, roll)
                            
                            cv2.putText(draw, f"P:{p_val:.1f} Y:{y_val:.1f} R:{r_val:.1f}",
                                        (x1, y1-25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0,255,0), 2)
                            
                            self.update_status.emit(f"P:{p_val:.1f} Y:{y_val:.1f} R:{r_val:.1f}")
                            
                            # Check if pose matches requirements
                            if self.is_valid_pose(p_val, y_val, r_val):
                                data = (draw.copy(), frame.copy(), (x1,y1,x2,y2), (p_val,y_val,r_val), det_score, kps)
                                self.challenge_completed.emit(self.pose_name, data)
                                self.pose_name = None  # Reset pose after completion
                        
                        except Exception as e:
                            self.update_status.emit(f"Lỗi phân tích pose: {str(e)}")
                else:
                    self.update_status.emit("Không phát hiện khuôn mặt")
            
            # Display instructions for current pose
            if self.pose_name:
                instructions = {
                    'front': 'Điều chỉnh camera ngang tầm mắt',
                    'right': 'Quay sang phải',
                    'left': 'Quay sang trái',
                    'up': 'Ngước lên',
                    'down': 'Cúi xuống'
                }
                cv2.putText(draw, f"{instructions.get(self.pose_name, '')}", (50,30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,255,255), 2)
            
            # Emit the processed frame
            self.update_frame.emit(draw)
        
        cap.release()
    
    def stop(self):
        """Stop the thread safely"""
        self.running = False
        self.wait()

def generate_face_vector(face_img, vector_size=512):
    """Generate a random face vector when AdaFace is not available"""
    return np.random.rand(vector_size).astype(np.float32)

class FaceChallengApp(QMainWindow):
    """Main application window for face challenge system"""
    def __init__(self):
        super().__init__()
        
        self.setWindowTitle("Face Challenge App")
        self.setMinimumSize(800, 600)
        
        # Challenge state
        self.challenges = ['front', 'right', 'left', 'up', 'down']
        self.current_challenge = -1  # Not started
        self.best_matches = {pose: None for pose in self.challenges}
        self.output_dir = 'output_faces'
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Initialize camera thread
        self.camera_thread = CameraThread()
        self.camera_thread.update_frame.connect(self.update_display)
        self.camera_thread.update_status.connect(self.update_status)
        self.camera_thread.challenge_completed.connect(self.on_challenge_completed)
        
        # Setup UI
        self.setup_ui()
    
    def setup_ui(self):
        """Create the application UI layout"""
        # Main layout
        main_layout = QVBoxLayout()
        
        # Camera display
        self.display_label = QLabel()
        self.display_label.setAlignment(Qt.AlignCenter)
        self.display_label.setMinimumSize(640, 480)
        main_layout.addWidget(self.display_label)
        
        # Status bar and progress
        status_layout = QHBoxLayout()
        self.status_label = QLabel("Ready to start")
        self.progress_bar = QProgressBar()
        self.progress_bar.setRange(0, len(self.challenges))
        self.progress_bar.setValue(0)
        status_layout.addWidget(self.status_label)
        status_layout.addWidget(self.progress_bar)
        main_layout.addLayout(status_layout)
        
        # Control buttons
        button_layout = QHBoxLayout()
        
        self.start_button = QPushButton("Start Challenge")
        self.start_button.clicked.connect(self.start_challenge)
        
        self.stop_button = QPushButton("Stop")
        self.stop_button.clicked.connect(self.stop_camera)
        self.stop_button.setEnabled(False)
        
        self.save_button = QPushButton("Save Results")
        self.save_button.clicked.connect(self.save_results)
        self.save_button.setEnabled(False)
        
        button_layout.addWidget(self.start_button)
        button_layout.addWidget(self.stop_button)
        button_layout.addWidget(self.save_button)
        
        main_layout.addLayout(button_layout)
        
        # Set the main widget
        container = QWidget()
        container.setLayout(main_layout)
        self.setCentralWidget(container)
    
    @Slot(np.ndarray)
    def update_display(self, frame):
        """Update the display with the latest camera frame"""
        h, w, ch = frame.shape
        bytes_per_line = ch * w
        qt_image = QImage(frame.data, w, h, bytes_per_line, QImage.Format_RGB888).rgbSwapped()
        self.display_label.setPixmap(QPixmap.fromImage(qt_image).scaled(
            self.display_label.width(), self.display_label.height(), 
            Qt.KeepAspectRatio, Qt.SmoothTransformation))
    
    @Slot(str)
    def update_status(self, message):
        """Update the status label with new information"""
        self.status_label.setText(message)
    
    def start_challenge(self):
        """Start the face challenge sequence"""
        self.current_challenge = 0
        self.progress_bar.setValue(0)
        self.best_matches = {pose: None for pose in self.challenges}
        
        # Start camera and set first pose
        self.camera_thread.set_pose(self.challenges[self.current_challenge])
        if not self.camera_thread.isRunning():
            self.camera_thread.start()
        
        # Update UI
        self.start_button.setEnabled(False)
        self.stop_button.setEnabled(True)
        self.save_button.setEnabled(False)
        
        self.update_status(f"Challenge {self.current_challenge+1}/{len(self.challenges)}: {self.get_pose_instruction()}")
    
    def stop_camera(self):
        """Stop the camera thread"""
        if self.camera_thread.isRunning():
            self.camera_thread.stop()
        
        self.start_button.setEnabled(True)
        self.stop_button.setEnabled(False)
    
    @Slot(str, tuple)
    def on_challenge_completed(self, pose_name, data):
        """Handle completion of a pose challenge"""
        self.best_matches[pose_name] = data
        self.current_challenge += 1
        self.progress_bar.setValue(self.current_challenge)
        
        if self.current_challenge < len(self.challenges):
            # Move to next challenge
            next_pose = self.challenges[self.current_challenge]
            self.camera_thread.set_pose(next_pose)
            self.update_status(f"Challenge {self.current_challenge+1}/{len(self.challenges)}: {self.get_pose_instruction()}")
        else:
            # All challenges completed
            self.update_status("All challenges completed! You can save the results.")
            self.camera_thread.set_pose(None)  # Stop detecting poses
            self.save_button.setEnabled(True)
    
    def get_pose_instruction(self):
        """Get instruction text for current pose"""
        instructions = {
            'front': 'Điều chỉnh camera ngang tầm mắt',
            'right': 'Quay sang phải',
            'left': 'Quay sang trái',
            'up': 'Ngước lên',
            'down': 'Cúi xuống'
        }
        current_pose = self.challenges[self.current_challenge]
        return instructions.get(current_pose, '')
    
    def save_results(self):
        """Save the captured face images and feature vectors"""
        # Ask for save directory
        dir_path = QFileDialog.getExistingDirectory(self, "Select Directory to Save Results", 
                                                  self.output_dir)
        if not dir_path:
            return
            
        self.output_dir = dir_path
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Save aligned images and create vectors
        face_vectors = {}
        aligned_size = 112  # Standard size for aligned faces
        
        for pose, data in self.best_matches.items():
            if data:
                _, orig_frame, _, _, _, kps = data
                
                # Only save aligned image if we have keypoints
                if kps is not None:
                    try:
                        aligned_img = norm_crop(orig_frame, kps, image_size=aligned_size)
                        aligned_path = os.path.join(self.output_dir, f"{pose}.jpg")
                        cv2.imwrite(aligned_path, aligned_img)
                        
                        # Generate face vector
                        if hasattr(self.camera_thread, 'face_recognizer') and self.camera_thread.face_recognizer is not None:
                            face_vector = self.camera_thread.face_recognizer.get_feat(aligned_img)[0]
                            face_vectors[pose] = face_vector.tolist()
                        else:
                            # Use random vector if AdaFace is not available
                            face_vector = generate_face_vector(aligned_img)
                            face_vectors[pose] = face_vector.tolist()
                    except Exception as e:
                        print(f"Error processing {pose}: {e}")
                        QMessageBox.warning(self, "Warning", f"Error processing {pose}: {e}")
        
        # Save vectors to JSON file
        if face_vectors:
            json_path = os.path.join(self.output_dir, "face_vectors.json")
            with open(json_path, 'w') as f:
                json.dump(face_vectors, f, indent=2)
            
            QMessageBox.information(self, "Success", 
                                   f"Saved {len(face_vectors)} face images and vectors to {self.output_dir}")
        else:
            QMessageBox.warning(self, "Warning", "No face vectors were generated!")
    
    def closeEvent(self, event):
        """Clean up resources when closing the application"""
        if self.camera_thread.isRunning():
            self.camera_thread.stop()
        event.accept()

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = FaceChallengApp()
    window.show()
    sys.exit(app.exec()) 
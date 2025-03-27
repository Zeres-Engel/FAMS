import cv2
import numpy as np
import faiss
import os
import glob
import sys
from pathlib import Path

# Add project root to Python path
project_root = str(Path(__file__).parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from src.zenface import ZenFace
import pickle
import time
from utils.config_utils import config
from model.MiDaS.DepthModel import DepthPredictor
from model.RFID.rfid import RFID
from model.FaceAnti.face_anti import FaceAntiSpoofing
from model.utils import face_align

class ZenSys:
    def __init__(self):
        # Khởi tạo ZenFace với đường dẫn weights từ config
        self.face_analyzer = ZenFace(allowed_modules=['detection', 'recognition'])
        self.face_analyzer.prepare(ctx_id=0)
        
        # Khởi tạo FAISS index
        self.dimension = config.embedding_dim
        self.index = faiss.IndexFlatIP(self.dimension)
        
        # Dictionary để lưu tên người theo index
        self.name_dict = {}
        
        self.depth_predictor = DepthPredictor(model_type="DPT_Large")
        self.database = None
        self.names = []
        
        # Thêm RFID
        self.rfid_system = RFID()
        self.current_rfid = None
        self.current_face_crop = None
        self.verification_result = None
        self._last_frame = None
        
        # Thêm Face Anti-spoofing
        self.face_anti = FaceAntiSpoofing()
        self.depth_face_crop = None
        self.anti_spoofing_result = None
        
    def process_gallery(self):
        """Convert all gallery images to face embeddings and store in FAISS"""
        # Kiểm tra nếu đã có database thì không cần convert lại
        if self.load_database():
            print("Database already exists, skipping gallery processing")
            return
            
        all_embeddings = []
        current_index = 0
        
        print(f"Processing gallery from: {config.gallery_path}")
        # Duyệt qua từng thư mục trong gallery
        for person_dir in glob.glob(os.path.join(config.gallery_path, "*")):
            person_name = os.path.basename(person_dir)
            print(f"Processing person: {person_name}")
            
            # Duyệt qua từng ảnh của người đó (hỗ trợ cả .jpg và .png)
            for img_path in glob.glob(os.path.join(person_dir, "*.[jp][pn][g]")):
                print(f"Processing image: {os.path.basename(img_path)}")
                img = cv2.imread(img_path)
                if img is None:
                    print(f"Failed to read image: {img_path}")
                    continue
                    
                # Phát hiện và lấy embedding của khuôn mặt
                faces = self.face_analyzer.get(img)
                if len(faces) > 0:
                    face = faces[0]  # Lấy khuôn mặt đầu tiên
                    if face.embedding is not None:
                        # Normalize embedding
                        embedding = face.normed_embedding.reshape(1, -1).astype('float32')
                        all_embeddings.append(embedding)
                        self.name_dict[current_index] = person_name
                        current_index += 1
                        print(f"Successfully processed face for: {person_name}")
                    else:
                        print(f"No embedding generated for face in: {img_path}")
                else:
                    print(f"No face detected in: {img_path}")
        
        if all_embeddings:
            # Gộp tất cả embeddings
            all_embeddings = np.vstack(all_embeddings)
            # Add vào FAISS index
            self.index.add(all_embeddings)
            
            # Lưu index và dictionary tên vào assets/database
            index_path = os.path.join(config.db_path, "face_index.faiss")
            dict_path = os.path.join(config.db_path, "name_dict.pkl")
            
            faiss.write_index(self.index, index_path)
            with open(dict_path, "wb") as f:
                pickle.dump(self.name_dict, f)
            print(f"Successfully saved database with {len(self.name_dict)} faces to {config.db_path}")
        else:
            print("No faces were processed from the gallery")
                
    def load_database(self):
        """Load FAISS index và dictionary tên từ assets/database"""
        index_path = os.path.join(config.db_path, "face_index.faiss")
        dict_path = os.path.join(config.db_path, "name_dict.pkl")
        
        if os.path.exists(index_path) and os.path.exists(dict_path):
            self.index = faiss.read_index(index_path)
            with open(dict_path, "rb") as f:
                self.name_dict = pickle.load(f)
            print(f"Loaded database with {len(self.name_dict)} faces from {config.db_path}")
            return True
        return False
    
    def recognize_face(self, face_embedding):
        """Nhận diện khuôn mặt từ embedding"""
        # Search trong FAISS index
        D, I = self.index.search(face_embedding.reshape(1, -1).astype('float32'), k=1)
        if D[0][0] > config.rec_threshold:  # Ngưỡng similarity từ config
            return self.name_dict[I[0][0]], D[0][0]
        return "Unknown", 0.0
        
    def run_webcam(self):
        """Chạy nhận diện qua webcam"""
        cap = cv2.VideoCapture(0)
        
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            # Get depth map
            depth_result = self.depth_predictor.predict_depth(frame)
            depth_map = depth_result['colored_depth']
            
            # Process face recognition
            faces = self.face_analyzer.get(frame)
            for face in faces:
                bbox = face.bbox
                embedding = face.normed_embedding
                name, score = self.recognize_face(embedding)  # Nhận cả name và score
                
                # Draw bounding box and name
                x1, y1, x2, y2 = [int(b) for b in bbox]
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
                # Hiển thị tên và độ tin cậy
                display_text = f"{name} ({score:.2f})"
                cv2.putText(frame, display_text, (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 0), 2)
            
            # Create combined display
            combined_frame = np.hstack((frame, depth_map))
            
            # Show the combined frame
            cv2.imshow('Face Recognition and Depth Estimation', combined_frame)
            
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
        cap.release()
        cv2.destroyAllWindows()

    def on_rfid_scanned(self, rfid_id):
        """Callback khi RFID được quét"""
        self.current_rfid = rfid_id
        # Reset xác thực
        self.current_face_crop = None
        self.verification_result = None
        
    def start_rfid_listening(self):
        """Bắt đầu lắng nghe RFID"""
        self.rfid_system.set_callback(self.on_rfid_scanned)
        self.rfid_system.start_listening()
        
    def stop_rfid_listening(self):
        """Dừng lắng nghe RFID"""
        self.rfid_system.stop_listening()
        
    def process_depth_anti_spoofing(self, depth_map, face):
        """
        Xử lý depth map cho face anti-spoofing
        """
        if depth_map is None or face is None:
            return None
            
        # Sử dụng face_anti để xử lý depth map
        result = self.face_anti.process_depth_map(depth_map, face.bbox)
        
        if result is not None:
            # Lưu depth face crop và kết quả anti-spoofing
            self.depth_face_crop = result["depth_visualization"]
            self.anti_spoofing_result = result["detection_result"]
            self.depth_variance = result["depth_variance"]
            self.mean_gradient = result["mean_gradient"]
            
        return result
        
    def process_verification(self, face):
        """
        Xử lý xác thực khi có RFID và khuôn mặt.
        
        Quy trình tối ưu:
        1. Lấy embedding đã được tạo từ face recognition
        2. So sánh với database để nhận diện danh tính
        3. Lưu khuôn mặt đã crop và align
        4. Xác thực danh tính với ID từ RFID
        5. Thực hiện kiểm tra anti-spoofing nếu có depth map
        """
        if self.current_rfid and face:
            # Lấy embedding đã được tạo từ ZenFace.get()
            embedding = face.normed_embedding
            
            # So sánh với database để nhận diện danh tính
            face_name, score = self.recognize_face(embedding)
            
            # Lưu khuôn mặt đã crop và align
            img = face.img  # Ảnh gốc được đính kèm trong gui.py
            if img is not None and face.kps is not None:
                try:
                    # Face alignment sử dụng 5 điểm landmarks
                    self.current_face_crop = face_align.norm_crop(img, landmark=face.kps, image_size=112)
                except Exception as e:
                    print(f"Error in face alignment: {e}")
                    # Fallback: Crop đơn giản nếu có lỗi
                    x1, y1, x2, y2 = [int(b) for b in face.bbox]
                    crop_img = img[max(0, y1):min(img.shape[0], y2), max(0, x1):min(img.shape[1], x2)]
                    if crop_img.size > 0:
                        self.current_face_crop = cv2.resize(crop_img, (112, 112))
                    else:
                        self.current_face_crop = None
            
            # Xác thực danh tính
            self.verification_result = self.rfid_system.verify_identity(
                self.current_rfid, face_name)
            
            return self.verification_result
        return None

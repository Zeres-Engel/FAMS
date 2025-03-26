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
                
            # Phát hiện khuôn mặt
            faces = self.face_analyzer.get(frame)
            
            # Vẽ kết quả
            for face in faces:
                bbox = face.bbox.astype(int)
                if face.embedding is not None:
                    name, conf = self.recognize_face(face.normed_embedding)
                    # Vẽ bbox
                    cv2.rectangle(frame, (bbox[0], bbox[1]), (bbox[2], bbox[3]), (0, 255, 0), 2)
                    # Hiển thị tên và độ tin cậy
                    text = f"{name} ({conf:.2f})"
                    cv2.putText(frame, text, (bbox[0], bbox[1]-10), 
                              cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)
            
            cv2.imshow("Face Recognition", frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
                
        cap.release()
        cv2.destroyAllWindows()

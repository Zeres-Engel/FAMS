import os
import glob
import numpy as np
import faiss
import pickle
import cv2
from pathlib import Path
import sys

# Add project root to Python path
project_root = str(Path(__file__).parent.parent.parent.parent)
if project_root not in sys.path:
    sys.path.append(project_root)

from utils.config_utils import config
from src.log.system_logger import SystemLogger

class FaceDatabase:
    """
    Quản lý cơ sở dữ liệu khuôn mặt sử dụng FAISS.
    - Tạo FAISS index từ bộ sưu tập ảnh khuôn mặt
    - Tìm kiếm khuôn mặt dựa trên embedding
    """
    
    def __init__(self, dimension=None):
        """
        Khởi tạo database khuôn mặt
        
        Args:
            dimension: Số chiều của embedding vector (mặc định từ config)
        """
        self.dimension = dimension or config.embedding_dim
        self.index = faiss.IndexFlatIP(self.dimension)
        self.name_dict = {}
        self.logger = SystemLogger()
        
    def process_gallery(self, face_analyzer, gallery_path=None, db_path=None):
        """
        Tạo FAISS index từ thư mục gallery chứa ảnh khuôn mặt
        
        Args:
            face_analyzer: Đối tượng ZenFace để phát hiện và tạo embedding
            gallery_path: Đường dẫn tới thư mục gallery (mặc định từ config)
            db_path: Đường dẫn lưu database (mặc định từ config)
            
        Returns:
            bool: True nếu tạo thành công
        """
        # Sử dụng đường dẫn từ config nếu không được chỉ định
        gallery_path = gallery_path or config.gallery_path
        db_path = db_path or config.db_path
        
        print("="*50)
        print(f"CREATING NEW FACE DATABASE")
        print(f"Gallery Path: {gallery_path}")
        print(f"Database Path: {db_path}")
        print("="*50)
        
        self.logger.info(f"Processing gallery from: {gallery_path}")
        
        all_embeddings = []
        current_index = 0
        processed_persons = set()
        
        # Duyệt qua từng thư mục trong gallery
        for person_dir in glob.glob(os.path.join(gallery_path, "*")):
            person_name = os.path.basename(person_dir)
            processed_persons.add(person_name)
            self.logger.info(f"Processing person: {person_name}")
            person_images_count = 0
            
            # Duyệt qua từng ảnh của người đó (hỗ trợ cả .jpg và .png)
            for img_path in glob.glob(os.path.join(person_dir, "*.[jp][pn][g]")):
                self.logger.info(f"Processing image: {os.path.basename(img_path)}")
                img = cv2.imread(img_path)
                if img is None:
                    self.logger.error(f"Failed to read image: {img_path}")
                    continue
                    
                # Phát hiện và lấy embedding của khuôn mặt
                faces = face_analyzer.get(img)
                if len(faces) > 0:
                    face = faces[0]  # Lấy khuôn mặt đầu tiên
                    if face.embedding is not None:
                        # Normalize embedding
                        embedding = face.normed_embedding.reshape(1, -1).astype('float32')
                        all_embeddings.append(embedding)
                        self.name_dict[current_index] = person_name
                        current_index += 1
                        person_images_count += 1
                        self.logger.info(f"Successfully processed face for: {person_name}")
                    else:
                        self.logger.warning(f"No embedding generated for face in: {img_path}")
                else:
                    self.logger.warning(f"No face detected in: {img_path}")
            
            print(f"Processed {person_images_count} images for person: {person_name}")
        
        if all_embeddings:
            # Gộp tất cả embeddings
            all_embeddings = np.vstack(all_embeddings)
            # Add vào FAISS index
            self.index = faiss.IndexFlatIP(self.dimension)  # Tạo index mới
            self.index.add(all_embeddings)
            
            # Lưu index và dictionary tên vào assets/database
            os.makedirs(db_path, exist_ok=True)
            index_path = os.path.join(db_path, "face_index.faiss")
            dict_path = os.path.join(db_path, "name_dict.pkl")
            
            faiss.write_index(self.index, index_path)
            with open(dict_path, "wb") as f:
                pickle.dump(self.name_dict, f)
                
            print("="*50)
            print(f"DATABASE CREATED SUCCESSFULLY")
            print(f"Total faces: {len(self.name_dict)}")
            print(f"Unique persons: {len(processed_persons)}")
            print(f"Database saved to: {db_path}")
            print("="*50)
            
            self.logger.info(f"Successfully saved database with {len(self.name_dict)} faces to {db_path}")
            return True
        else:
            print("="*50)
            print("DATABASE CREATION FAILED: No faces were processed")
            print("="*50)
            
            self.logger.error("No faces were processed from the gallery")
            return False
    
    def load_database(self, db_path=None):
        """
        Tải FAISS index và dictionary tên từ thư mục database
        
        Args:
            db_path: Đường dẫn tới thư mục database (mặc định từ config)
            
        Returns:
            bool: True nếu tải thành công
        """
        db_path = db_path or config.db_path
        index_path = os.path.join(db_path, "face_index.faiss")
        dict_path = os.path.join(db_path, "name_dict.pkl")
        
        if os.path.exists(index_path) and os.path.exists(dict_path):
            self.index = faiss.read_index(index_path)
            with open(dict_path, "rb") as f:
                self.name_dict = pickle.load(f)
            self.logger.info(f"Loaded database with {len(self.name_dict)} faces from {db_path}")
            return True
        return False
    
    def recognize_face(self, embedding, threshold=None):
        """
        Nhận diện khuôn mặt từ embedding
        
        Args:
            embedding: Vector embedding khuôn mặt
            threshold: Ngưỡng nhận diện (mặc định từ config)
            
        Returns:
            tuple: (name, score) - Tên người và độ tương đồng
        """
        threshold = threshold or config.rec_threshold
        
        # Đảm bảo embedding có đúng kích thước
        if len(embedding.shape) == 1:
            embedding = embedding.reshape(1, -1)
            
        # Search trong FAISS index
        D, I = self.index.search(embedding.astype('float32'), k=1)
        
        if D[0][0] > threshold:  # Ngưỡng similarity
            return self.name_dict[I[0][0]], D[0][0]
        return "Unknown", 0.0
    
    def get_database_stats(self):
        """
        Trả về thông tin thống kê về database
        
        Returns:
            dict: Thông tin thống kê
        """
        person_count = {}
        for person in self.name_dict.values():
            if person in person_count:
                person_count[person] += 1
            else:
                person_count[person] = 1
                
        return {
            "total_faces": len(self.name_dict),
            "unique_persons": len(person_count),
            "faces_per_person": person_count
        }
    
    def ensure_database(self, face_analyzer):
        """
        Always creates a new database from the gallery
        
        Args:
            face_analyzer: Đối tượng ZenFace để phát hiện và tạo embedding
            
        Returns:
            bool: True nếu database đã tạo thành công
        """
        self.logger.info("Creating new database from gallery")
        return self.process_gallery(face_analyzer) 
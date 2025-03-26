import cv2
import numpy as np
import faiss
import os
import glob
from face_analysis import FaceAnalysis
import pickle
import time

class FaceRecognitionSystem:
    def __init__(self):
        # Khởi tạo FaceAnalysis
        self.face_analyzer = FaceAnalysis()
        self.face_analyzer.prepare(ctx_id=0, det_size=(640, 640))
        
        # Khởi tạo FAISS index
        self.dimension = 512  # Dimension của face embedding
        self.index = faiss.IndexFlatIP(self.dimension)
        
        # Dictionary để lưu tên người theo index
        self.name_dict = {}
        
        # Path to gallery
        self.gallery_path = "data/gallery"
        
    def process_gallery(self):
        """Convert all gallery images to face embeddings and store in FAISS"""
        all_embeddings = []
        current_index = 0
        
        # Duyệt qua từng thư mục trong gallery
        for person_dir in glob.glob(os.path.join(self.gallery_path, "*")):
            person_name = os.path.basename(person_dir)
            
            # Duyệt qua từng ảnh của người đó
            for img_path in glob.glob(os.path.join(person_dir, "*.jpg")):
                img = cv2.imread(img_path)
                if img is None:
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
        
        if all_embeddings:
            # Gộp tất cả embeddings
            all_embeddings = np.vstack(all_embeddings)
            # Add vào FAISS index
            self.index.add(all_embeddings)
            
            # Lưu index và dictionary tên
            faiss.write_index(self.index, "face_index.faiss")
            with open("name_dict.pkl", "wb") as f:
                pickle.dump(self.name_dict, f)
                
    def load_database(self):
        """Load FAISS index và dictionary tên"""
        if os.path.exists("face_index.faiss") and os.path.exists("name_dict.pkl"):
            self.index = faiss.read_index("face_index.faiss")
            with open("name_dict.pkl", "rb") as f:
                self.name_dict = pickle.load(f)
            return True
        return False
    
    def recognize_face(self, face_embedding):
        """Nhận diện khuôn mặt từ embedding"""
        # Search trong FAISS index
        D, I = self.index.search(face_embedding.reshape(1, -1).astype('float32'), k=1)
        if D[0][0] > 0.6:  # Ngưỡng similarity
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

def main():
    face_system = FaceRecognitionSystem()
    
    # Kiểm tra xem đã có database chưa
    if not face_system.load_database():
        print("Processing gallery images...")
        face_system.process_gallery()
        print("Done processing gallery!")
    
    print("Starting webcam...")
    face_system.run_webcam()

if __name__ == "__main__":
    main() 
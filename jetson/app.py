import os
os.environ['KMP_DUPLICATE_LIB_OK']='TRUE'

from src.zensys import FaceRecognitionSystem

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
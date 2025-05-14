import os
import cv2
import torch
import numpy as np
from tqdm import tqdm
from app import RetinaFace, Aligner
import argparse

def parse_args():
    parser = argparse.ArgumentParser(description="Process videos to extract face images.")
    parser.add_argument("--input", type=str, required=True, help="Directory containing videos.")
    parser.add_argument("--output", type=str, required=True, help="Directory to save the processed images.")
    parser.add_argument("--network", type=str, default='mobilenet', choices=['resnet50', 'mobilenet'], help="Model type: 'resnet50' or 'mobilenet'. Default: 'mobilenet'.")
    parser.add_argument("--checkpoint_path", type=str, required=True, help="Path to the pretrained model checkpoint.")
    parser.add_argument("--batch_size", type=int, default=8, help="Number of frames to process in a batch.")
    parser.add_argument("--device", type=str, default='cuda' if torch.cuda.is_available() else 'cpu', help="Device to run the model on: 'cuda' or 'cpu'. Default is 'cuda' if available.")
    parser.add_argument("--score", type=float, default=0.95, help="Minimum score for a face to be processed. Default: 0.95.")
    parser.add_argument("--gpu_id", type=int, default=0, help="GPU ID to run the model on. Default is 0.")
    parser.add_argument("--skip_frames", type=int, default=0, help="Number of frames to skip between processed frames. Default is 0 (no skip).")
    return parser.parse_args()

def process_frames(detector, aligner, frames, output_paths, min_score):
    # Detect faces and landmarks
    all_faces = detector(frames, return_dict=True)
    
    for frame, faces, output_path in zip(frames, all_faces, output_paths):
        if len(faces) > 0:
            face = faces[0]
            score = face['score']
            if score >= min_score:
                kps = face['kps']
                
                # Align the face
                aligned_img = aligner(frame, kps)
                
                # Save the aligned face image
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                cv2.imwrite(output_path, aligned_img)
            else:
                print(f'Face detected in {output_path} but score {score} is less than {min_score}')
        else:
            print(f'No face detected in {output_path}')

def process_videos(detector, aligner, video_paths, output_dir, min_score, batch_size, skip_frames):
    for video_path in video_paths:
        cap = cv2.VideoCapture(video_path)
        frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        batch_frames = []
        output_paths = []

        relative_dir = os.path.relpath(os.path.dirname(video_path), args.input)
        video_output_dir = os.path.join(output_dir, relative_dir, os.path.splitext(os.path.basename(video_path))[0])

        for i in tqdm(range(frame_count), desc=f"Processing video {video_path}"):
            ret, frame = cap.read()
            if not ret:
                break
            
            if i % (skip_frames + 1) != 0:
                continue
            
            batch_frames.append(frame)
            output_paths.append(os.path.join(video_output_dir, f"frame_{i}.jpg"))

            if len(batch_frames) == batch_size or i == frame_count - 1:
                process_frames(detector, aligner, batch_frames, output_paths, min_score)
                batch_frames = []
                output_paths = []

        cap.release()

def main():
    args = parse_args()
    
    # Initialize RetinaFace detector
    detector = RetinaFace(network=args.network, model_path=args.checkpoint_path, device=args.device, gpu_id=args.gpu_id)
    
    # Standard points for 112x112 size
    std_points_112 = np.array(
        [
            [38.2946, 51.6963],
            [73.5318, 51.5014],
            [56.0252, 71.7366],
            [41.5493, 92.3655],
            [70.7299, 92.2041],
        ]
    )
    
    # Initialize Aligner with target size 112x112
    aligner = Aligner(std_points_112, size=112)
    
    # Get list of all video files in the input directory and its subdirectories
    video_paths = []
    for root, _, files in os.walk(args.input):
        for file in files:
            if file.lower().endswith(('mp4', 'avi', 'mov', 'mkv')):
                video_paths.append(os.path.join(root, file))
    
    # Process videos
    process_videos(detector, aligner, video_paths, args.output, args.score, args.batch_size, args.skip_frames)

if __name__ == "__main__":
    main()

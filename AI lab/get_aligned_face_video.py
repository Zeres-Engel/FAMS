import os
import cv2
import numpy as np
from tqdm import tqdm
from app import RetinaFace, SixDRep, Aligner
import argparse
import torch

def parse_args():
    parser = argparse.ArgumentParser(description="Process videos to extract face images and head poses.")
    parser.add_argument("--input", type=str, required=True, help="Directory containing videos.")
    parser.add_argument("--output", type=str, required=True, help="Directory to save the processed images.")
    parser.add_argument("--network", type=str, default='mobilenet', choices=['resnet50', 'mobilenet'], help="Model type: 'resnet50' or 'mobilenet'. Default: 'mobilenet'.")
    parser.add_argument("--checkpoint_path", type=str, required=True, help="Path to the pretrained model checkpoint.")
    parser.add_argument("--batch_size", type=int, default=8, help="Number of frames to process in a batch.")
    parser.add_argument("--device", type=str, default='cuda' if torch.cuda.is_available() else 'cpu', help="Device to run the model on: 'cuda' or 'cpu'. Default is 'cuda' if available.")
    parser.add_argument("--score", type=float, default=0.95, help="Minimum score for a face to be processed. Default: 0.95.")
    parser.add_argument("--gpu_id", type=int, default=0, help="GPU ID to run the model on. Default is 0.")
    parser.add_argument("--head_pose", action='store_true', help="Enable head pose estimation.")
    parser.add_argument("--head_pose_checkpoint_path", type=str, help="Path to the pretrained head pose model checkpoint.")
    parser.add_argument("--skip_frames", type=int, default=0, help="Number of frames to skip between processed frames. Default is 0 (no skip).")
    return parser.parse_args()

def load_frames_rgb(file, skip_frames=0, max_frames=-1, cvt_color=True):
    cap = cv2.VideoCapture(file)
    frames = []
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
        if frame_count % (skip_frames + 1) == 0:
            if cvt_color:
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            frames.append(frame)
        frame_count += 1
        if max_frames > 0 and len(frames) >= max_frames:
            break
    cap.release()
    return frames

def process_video(video_path, detector, head_pose_estimator, aligner, output_dir, batch_size, min_score, head_pose_enabled, skip_frames):
    frames = load_frames_rgb(video_path, skip_frames=skip_frames)
    print(f'Loaded {len(frames)} frames from {video_path}')
    
    video_name = os.path.splitext(os.path.basename(video_path))[0]
    all_faces = detector(frames, batch_size=batch_size, return_dict=True, threshold=min_score, resize=0.5, cv=True)
    if head_pose_enabled:
        head_poses = head_pose_estimator(all_faces, frames, batch_size=batch_size, update_dict=True, input_face_type='dict')
    
    video_output_dir = os.path.join(output_dir, video_name)
    os.makedirs(video_output_dir, exist_ok=True)

    for i, (faces, frame) in enumerate(tqdm(zip(all_faces, frames), total=len(frames), desc="Processing frames")):
        for j, face in enumerate(faces):
            kps = face['kps']
            box = face['box']  # Giả sử rằng 'box' là danh sách tọa độ của bounding box
            aligned_img = aligner(frame, kps)

            # Tạo tên file với thông tin bounding box và head pose (nếu có)
            box_str = "_".join(map(str, box.tolist()))
            if head_pose_enabled:
                pitch = float(face['head_pose']['pitch'])
                yaw = float(face['head_pose']['yaw'])
                roll = float(face['head_pose']['roll'])
                pose_str = f"{pitch:.2f}_{yaw:.2f}_{roll:.2f}"
                output_path = os.path.join(video_output_dir, f"{video_name}_frame_{i}_face_{j}_aligned_{box_str}_{pose_str}.jpg")
            else:
                output_path = os.path.join(video_output_dir, f"{video_name}_frame_{i}_face_{j}_aligned_{box_str}.jpg")

            cv2.imwrite(output_path, aligned_img)
    
    return

def main():
    args = parse_args()
    
    detector = RetinaFace(network=args.network, model_path=args.checkpoint_path, device=args.device, gpu_id=args.gpu_id)
    head_pose_estimator = None
    if args.head_pose:
        head_pose_estimator = SixDRep(gpu_id=args.gpu_id, dict_path=args.head_pose_checkpoint_path)
    
    std_points_112 = np.array(
        [
            [38.2946, 51.6963],
            [73.5318, 51.5014],
            [56.0252, 71.7366],
            [41.5493, 92.3655],
            [70.7299, 92.2041],
        ]
    )
    aligner = Aligner(std_points_112, size=112)

    video_paths = [os.path.join(root, file) for root, _, files in os.walk(args.input) for file in files if file.lower().endswith(('mp4', 'avi', 'mov', 'mkv'))]
    
    for video_path in tqdm(video_paths, desc="Processing videos"):
        process_video(video_path, detector, head_pose_estimator, aligner, args.output, args.batch_size, args.score, args.head_pose, args.skip_frames)

if __name__ == "__main__":
    main()

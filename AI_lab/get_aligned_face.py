import os
import cv2
import torch
import json
import numpy as np
from tqdm import tqdm
from app import RetinaFace, Aligner, SixDRep
import argparse

def parse_args():
    parser = argparse.ArgumentParser(description="Process images to extract face images.")
    parser.add_argument("--input", type=str, required=True, help="Directory containing images.")
    parser.add_argument("--output", type=str, required=True, help="Directory to save the processed images or JSON file.")
    parser.add_argument("--network", type=str, default='mobilenet', choices=['resnet50', 'mobilenet'], help="Model type: 'resnet50' or 'mobilenet'. Default: 'mobilenet'.")
    parser.add_argument("--checkpoint_path", type=str, required=True, help="Path to the pretrained model checkpoint.")
    parser.add_argument("--batch_size", type=int, default=8, help="Number of images to process in a batch for RetinaFace and head pose estimation.")
    parser.add_argument("--device", type=str, default='cuda' if torch.cuda.is_available() else 'cpu', help="Device to run the model on: 'cuda' or 'cpu'. Default is 'cuda' if available.")
    parser.add_argument("--score", type=float, default=0.95, help="Minimum score for a face to be processed. Default: 0.95.")
    parser.add_argument("--gpu_id", type=int, default=0, help="GPU ID to run the model on. Default is 0.")
    parser.add_argument("--continue", dest="continue_", action='store_true', help="Continue processing only new images, skipping images already processed.")
    parser.add_argument("--head_pose", action='store_true', help="Enable head pose estimation.")
    parser.add_argument("--head_pose_checkpoint_path", type=str, help="Path to the pretrained head pose model checkpoint.")
    parser.add_argument("--save_format", type=str, default='image', choices=['image', 'json'], help="Save format: 'image' or 'json'. Default: 'image'.")
    return parser.parse_args()

def pad_image_to_square(image, target_size=112):
    h, w = image.shape[:2]
    
    if h < target_size or w < target_size:
        pad_h = max(0, target_size - h)
        pad_w = max(0, target_size - w)
        padded_image = cv2.copyMakeBorder(image, pad_h // 2, pad_h - pad_h // 2, pad_w // 2, pad_w - pad_w // 2, cv2.BORDER_CONSTANT, value=[0, 0, 0])
        return padded_image
    
    return image

def pad_image_to_max_side(image):
    h, w = image.shape[:2]
    
    if h != w:
        size = max(h, w)
        padded_image = cv2.copyMakeBorder(image, (size - h) // 2, (size - h + 1) // 2, (size - w) // 2, (size - w + 1) // 2, cv2.BORDER_CONSTANT, value=[0, 0, 0])
        return padded_image
    
    return image

def group_images_by_size(images, paths):
    size_groups = {}
    
    for img, path in zip(images, paths):
        h, w = img.shape[:2]
        if (w, h) not in size_groups:
            size_groups[(w, h)] = {'images': [], 'paths': []}
        size_groups[(w, h)]['images'].append(img)
        size_groups[(w, h)]['paths'].append(path)
    
    return size_groups

def process_batch(detector, aligner, head_pose_estimator, img_paths, output_dir, head_pose_enabled, score, input_dir, processing_batch_size, save_format, json_file):
    images = []
    valid_paths = []
    
    for img_path in tqdm(img_paths, desc="Loading and preprocessing images"):
        img = cv2.imread(img_path)
        h, w = img.shape[:2]
        
        if min(h, w) < 112:
            img = pad_image_to_square(img)
        else:
            img = pad_image_to_max_side(img)
        
        h, w = img.shape[:2]
        if h != 112 and w != 112:
            img = pad_image_to_square(img, target_size=max(h, w))
        
        images.append(img)
        valid_paths.append(img_path)
    
    size_groups = group_images_by_size(images, valid_paths)
    
    json_data = []

    for size, group in size_groups.items():
        current_batch_size = min(processing_batch_size, len(group['images']))
        
        for start_idx in range(0, len(group['images']), current_batch_size):
            batch_images = group['images'][start_idx:start_idx + current_batch_size]
            batch_paths = group['paths'][start_idx:start_idx + current_batch_size]

            all_faces = detector(batch_images, batch_size=current_batch_size, return_dict=True, threshold=score)

            if head_pose_enabled and all_faces:
                head_pose_estimator(all_faces, batch_images, batch_size=current_batch_size, update_dict=True, input_face_type='dict')

            for img_path, faces in zip(batch_paths, all_faces):
                if len(faces) > 0:
                    face = max(faces, key=lambda f: f['score'])
                    kps = face['kps']
                    face_score = face['score']
                    
                    img = cv2.imread(img_path)
                    
                    img = pad_image_to_square(img)
                    aligned_img = aligner(img, kps) if kps.size else img
                    
                    relative_path = os.path.relpath(img_path, input_dir)
                    output_path = os.path.join(output_dir, relative_path)

                    image_id = os.path.basename(os.path.dirname(img_path))
                    
                    if head_pose_enabled and 'head_pose' in face:
                        pitch = float(face['head_pose']['pitch'])
                        yaw = float(face['head_pose']['yaw'])
                        roll = float(face['head_pose']['roll'])
                        
                        if save_format == 'image':
                            score_str = f"{face_score:.2f}"
                            if head_pose_enabled:
                                pose_str = f"{pitch:.2f}_{yaw:.2f}_{roll:.2f}"
                                output_path = output_path.replace('.jpg', f'_{pose_str}_{score_str}.jpg')
                            else:
                                output_path = output_path.replace('.jpg', f'_{score_str}.jpg')
                            os.makedirs(os.path.dirname(output_path), exist_ok=True)
                            cv2.imwrite(output_path, aligned_img)

                        elif save_format == 'json':
                            data_entry = {
                                "path": img_path,
                                "id": image_id,
                                "pitch": pitch,
                                "yaw": yaw,
                                "roll": roll,
                                "score": str(face_score),
                                "kps": kps.tolist()
                            }
                            json_data.append(data_entry)
                else:
                    data_entry = {
                        "path": img_path,
                        "id": os.path.basename(os.path.dirname(img_path)),
                        "score": "0.00",
                        "kps": []
                    }
                    json_data.append(data_entry)
                    print(f'No face detected in {img_path}')
            
    if save_format == 'json' and json_data:
        for entry in json_data:
            json.dump(entry, json_file)
            json_file.write("\n")

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

    img_paths = []
    for root, _, files in os.walk(args.input):
        for file in files:
            if file.lower().endswith(('png', 'jpg', 'jpeg', 'bmp')):
                img_paths.append(os.path.join(root, file))

    if args.continue_:
        if args.save_format == 'image':
            processed_images = set()
            for root, _, files in os.walk(args.output):
                for file in files:
                    if file.lower().endswith(('png', 'jpg', 'jpeg', 'bmp')):
                        processed_images.add(file.split('_')[0])
            img_paths = [img for img in img_paths if os.path.basename(img).split('_')[0] not in processed_images]
        else:
            json_output_path = os.path.join(args.output, 'output.json')
            processed_images = load_processed_images_from_json(json_output_path)
            img_paths = [img for img in img_paths if img not in processed_images]

    loading_batch_size = 1000
    num_batches = len(img_paths) // loading_batch_size + int(len(img_paths) % loading_batch_size > 0)

    print("Starting image processing...")

    json_file = None
    if args.save_format == 'json':
        json_output_path = os.path.join(args.output, 'output.json')

        os.makedirs(os.path.dirname(json_output_path), exist_ok=True)
        json_file = open(json_output_path, 'a')
        
    for batch_idx in tqdm(range(num_batches), desc="Processing batches"):
        batch_start = batch_idx * loading_batch_size
        batch_end = min((batch_idx + 1) * loading_batch_size, len(img_paths))
        batch_img_paths = img_paths[batch_start:batch_end]
        process_batch(detector, aligner, head_pose_estimator, batch_img_paths, args.output, args.head_pose, args.score, args.input, args.batch_size, args.save_format, json_file)
        
    if args.save_format == 'json':
        json_file.close()
    print("Image processing completed.")

if __name__ == "__main__":
    main()

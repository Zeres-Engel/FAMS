import torch
from app import network
import os
from torchvision import transforms
from PIL import Image
from sklearn.cluster import KMeans
import numpy as np
import shutil
import argparse
from tqdm import tqdm

def parse_args():
    parser = argparse.ArgumentParser(description="Cluster face embeddings using KMeans with cosine similarity.")
    parser.add_argument("--input", type=str, required=True, help="Directory containing the face images to cluster or directories of images.")
    parser.add_argument("--model_name", type=str, default="ir_101", help="Name of the model to use.")
    parser.add_argument("--checkpoint_path", type=str, required=True, help="Path to the pretrained model checkpoint.")
    parser.add_argument("--output", type=str, required=True, help="Directory to save the clustered images.")
    parser.add_argument("--num_clusters", type=int, default=5, help="Number of clusters for KMeans.")
    parser.add_argument("--batch_size", type=int, default=32, help="Number of images to process in a batch.")
    return parser.parse_args()

def load_model(model_name, checkpoint_path, device):
    model = network.build_model(model_name=model_name)
    model.to(device)

    ckpt = torch.load(checkpoint_path, map_location=device, weights_only=True)
    
    if 'state_dict' in ckpt:
        if any('model.' in key for key in ckpt['state_dict']):
            model.load_state_dict({key.replace('model.', ''): val
                                   for key, val in ckpt['state_dict'].items() if 'model.' in key})
        elif any('module.' in key for key in ckpt['state_dict']):
            model.load_state_dict({key.replace('module.', ''): val
                                   for key, val in ckpt['state_dict'].items() if 'module.' in key})
        else:
            model.load_state_dict(ckpt['state_dict'])
        print("Model state loaded successfully.")
    else:
        print("Checkpoint does not contain 'state_dict'.")
    
    model.eval()
    return model

def preprocess_images(input_dir, transform, batch_size, device, model):
    batch_images = []
    img_paths = []
    face_embeddings = {}

    for face_img in os.listdir(input_dir):
        img_path = os.path.join(input_dir, face_img)
        if os.path.isdir(img_path):
            continue
        img = Image.open(img_path).convert('RGB')
        img = transform(img)
        batch_images.append(img)
        img_paths.append(img_path)

        if len(batch_images) == batch_size:
            extract_embeddings(batch_images, img_paths, face_embeddings, device, model)
            batch_images = []
            img_paths = []

    if batch_images:
        extract_embeddings(batch_images, img_paths, face_embeddings, device, model)

    return face_embeddings

def extract_embeddings(batch_images, img_paths, face_embeddings, device, model):
    batch_images_tensor = torch.stack(batch_images).to(device)
    with torch.no_grad():
        embeddings = model(batch_images_tensor)[0]
        embeddings = embeddings.cpu().numpy()

    for emb, img_path in zip(embeddings, img_paths):
        face_embeddings[img_path] = emb

def cluster_embeddings(face_embeddings, num_clusters, output_dir, global_label_counter):
    if not face_embeddings:
        return global_label_counter

    embeddings = np.array(list(face_embeddings.values())).reshape(len(face_embeddings), -1)
    embeddings = embeddings / np.linalg.norm(embeddings, axis=1, keepdims=True)  # Normalize embeddings
    kmeans = KMeans(n_clusters=num_clusters, random_state=42)
    kmeans.fit(embeddings)
    labels = kmeans.labels_

    save_clustered_images(labels, face_embeddings, output_dir, global_label_counter)
    global_label_counter += labels.max() + 1

    return global_label_counter

def save_clustered_images(labels, face_embeddings, output_dir, global_label_counter):
    cluster_image_count = {}

    for label, face_img in zip(labels, face_embeddings.keys()):
        adjusted_label = label + global_label_counter
        dir_name = os.path.join(output_dir, str(adjusted_label))
        cluster_image_count[adjusted_label] = cluster_image_count.get(adjusted_label, 0) + 1

        os.makedirs(dir_name, exist_ok=True)
        dst_path = os.path.join(dir_name, f"{cluster_image_count[adjusted_label]}.png")
        shutil.copy(face_img, dst_path)  # Use full path for source

def process_directory(directory, output_dir, model, device, transform, num_clusters, global_label_counter, batch_size):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)

    for entry in tqdm(os.listdir(directory), desc=f"Processing {directory}"):
        entry_path = os.path.join(directory, entry)
        output_entry_path = os.path.join(output_dir, entry)
        
        if os.path.isdir(entry_path):
            global_label_counter = process_directory(entry_path, output_entry_path, model, device, transform, num_clusters, global_label_counter, batch_size)
        else:
            continue

    face_embeddings = preprocess_images(directory, transform, batch_size, device, model)
    global_label_counter = cluster_embeddings(face_embeddings, num_clusters, output_dir, global_label_counter)
    
    return global_label_counter

def main():
    args = parse_args()

    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    model = load_model(args.model_name, args.checkpoint_path, device)

    transform = transforms.Compose([
        transforms.Resize((112, 112)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
    ])

    os.makedirs(args.output, exist_ok=True)

    global_label_counter = 0

    if any(os.path.isdir(os.path.join(args.input, d)) for d in os.listdir(args.input)):
        global_label_counter = process_directory(args.input, args.output, model, device, transform, args.num_clusters, global_label_counter, args.batch_size)
    else:
        face_embeddings = preprocess_images(args.input, transform, args.batch_size, device, model)
        global_label_counter = cluster_embeddings(face_embeddings, args.num_clusters, args.output, global_label_counter)

if __name__ == "__main__":
    main()

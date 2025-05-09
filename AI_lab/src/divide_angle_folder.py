import os
import shutil
import pandas as pd
import numpy as np
import json

def create_directories_and_copy_images(df, base_dir, attribute, attribute_name):
    for _, row in df.iterrows():
        src_path = row['path']
        id = row['id']
        value = row[attribute_name]
        label = pd.cut([value], bins=bins, labels=labels)[0]
        if label:
            dest_dir = os.path.join(base_dir, attribute, label, id)
            if not os.path.exists(dest_dir):
                os.makedirs(dest_dir)
            shutil.copy(src_path, dest_dir)

# Load the JSON file into a Pandas DataFrame
json_file_path = input("Enter the path to the JSON file: ")

# Read JSON file
with open(json_file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Convert to DataFrame
df = pd.DataFrame(data)

# Define the bins and labels for the ranges
bins = np.arange(-90, 105, 15)
labels = [f"[{bins[i]}, {bins[i+1]}]" for i in range(len(bins)-1)]
labels[-1] = f"[{bins[-2]}, {bins[-1]}]"

# Create directories and copy images based on Pitch, Yaw, and Roll
output_dir = input("Enter the output directory: ")
categories = ['Pitch', 'Yaw', 'Roll']

for category in categories:
    create_directories_and_copy_images(df, output_dir, category, category.lower())

print("Images have been copied to the respective directories.")

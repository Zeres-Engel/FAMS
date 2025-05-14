import os
import json

def extract_pose_info(filename):
    # Split the filename and extract pitch, yaw, and roll
    parts = filename.rsplit('_', 4)  # Split from the right to avoid splitting the ID parts
    pitch = float(parts[-3])
    yaw = float(parts[-2])
    roll = float(parts[-1].rsplit('.', 1)[0])  # Remove the file extension
    return pitch, yaw, roll

def process_directory(directory):
    data = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(('.jpg', '.png', '.jpeg')):
                filepath = os.path.join(root, file)
                id = os.path.basename(root)
                pitch, yaw, roll = extract_pose_info(file)
                if pitch is not None and yaw is not None and roll is not None:
                    data.append({
                        'path': filepath,
                        'id': id,
                        'pitch': pitch,
                        'yaw': yaw,
                        'roll': roll
                    })
    return data

def main():
    input_directory = input("Enter the path to the directory containing the images: ")
    output_file = 'output.json'
    data = process_directory(input_directory)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)
    print(f'Data has been saved to {output_file}')

if __name__ == "__main__":
    main()

# Face Challenge App

A PySide6-based GUI application that guides users through a series of face poses and captures aligned face images with feature vectors.

## Features

- Performs face detection using RetinaFace
- Estimates head pose using SixDRepNet
- Guides users through a series of poses: front, right, left, up, down
- Creates aligned face images for each completed pose
- Generates face recognition vectors (using AdaFace if available, or random vectors)
- Provides real-time visual feedback with pose angles

## Requirements

- Python 3.7 or higher
- PySide6
- OpenCV
- NumPy
- ONNX Runtime

## Installation

1. Install the required packages:

```bash
pip install -r requirements.txt
```

2. Make sure the model weights are in the correct location:
   - RetinaFace: `assets/weights/retinaface.onnx`
   - AdaFace: `assets/weights/adaface.onnx` (optional)
   - SixDRepNet should be available in the root directory

## Usage

Run the application:

```bash
python app_gui.py
```

1. Click "Start Challenge" to begin the face capture process
2. Follow the on-screen instructions to complete each pose:
   - Front: Look directly at the camera
   - Right: Turn your head to the right
   - Left: Turn your head to the left
   - Up: Tilt your head upward
   - Down: Tilt your head downward
3. The app will automatically advance to the next pose when the current one is completed
4. After all poses are completed, click "Save Results" to save aligned face images and feature vectors

## Output

The application saves the following in the selected output directory:
- Aligned face images for each pose (front.jpg, right.jpg, etc.)
- A JSON file (face_vectors.json) containing feature vectors for each pose 
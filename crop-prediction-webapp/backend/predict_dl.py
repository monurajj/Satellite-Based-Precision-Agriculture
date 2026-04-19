#!/usr/bin/env python3
"""
DL Prediction API - Satellite image land cover classification.
Uses trained ResNet-50+SE model from Phase 2.
"""

import sys
import json
import os
import base64
import io
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms
from PIL import Image

# Optional: Grad-CAM
try:
    from pytorch_grad_cam import GradCAM
    from pytorch_grad_cam.utils.image import show_cam_on_image
    from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
    HAS_GRADCAM = True
except ImportError:
    HAS_GRADCAM = False

# ============================================================
# Model Definitions (must match training code)
# ============================================================

class SEBlock(nn.Module):
    def __init__(self, channels, reduction=16):
        super().__init__()
        self.squeeze = nn.AdaptiveAvgPool2d(1)
        self.excitation = nn.Sequential(
            nn.Linear(channels, channels // reduction, bias=False),
            nn.ReLU(inplace=True),
            nn.Linear(channels // reduction, channels, bias=False),
            nn.Sigmoid()
        )

    def forward(self, x):
        b, c, _, _ = x.size()
        y = self.excitation(self.squeeze(x).view(b, c)).view(b, c, 1, 1)
        return x * y.expand_as(x)


class ResNetSE(nn.Module):
    def __init__(self, num_classes=10, pretrained=False, use_se=True):
        super().__init__()
        import timm
        self.use_se = use_se
        self.backbone = timm.create_model('resnet50', pretrained=pretrained, num_classes=0)
        if use_se:
            self.se_block = SEBlock(channels=2048, reduction=16)
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(2048, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        features = self.backbone.forward_features(x)
        if self.use_se:
            features = self.se_block(features)
        features = F.adaptive_avg_pool2d(features, 1).flatten(1)
        return self.classifier(features)


# ============================================================
# Constants
# ============================================================

CLASS_NAMES = [
    'AnnualCrop', 'Forest', 'HerbaceousVegetation', 'Highway',
    'Industrial', 'Pasture', 'PermanentCrop', 'Residential',
    'River', 'SeaLake'
]

CLASS_DESCRIPTIONS = {
    'AnnualCrop': 'Seasonal agricultural crops (wheat, corn, rice, etc.)',
    'Forest': 'Dense tree coverage - forested area',
    'HerbaceousVegetation': 'Natural grassland and herbaceous plants',
    'Highway': 'Major road or transportation infrastructure',
    'Industrial': 'Industrial buildings, factories, or commercial zones',
    'Pasture': 'Grazing land for livestock',
    'PermanentCrop': 'Permanent plantations (orchards, vineyards)',
    'Residential': 'Housing and residential buildings',
    'River': 'River or stream water body',
    'SeaLake': 'Sea, lake, or large water body',
}

AGRICULTURE_CLASSES = {'AnnualCrop', 'PermanentCrop', 'Pasture', 'HerbaceousVegetation'}

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
MODEL_PATH = PROJECT_ROOT / "Phase2_DL" / "experiments" / "results" / "models" / "ResNet50_SE.pth"

# ============================================================
# Inference
# ============================================================

def load_model():
    """Load the trained ResNet-50+SE model."""
    model = ResNetSE(num_classes=10, pretrained=False, use_se=True)
    if MODEL_PATH.exists():
        model.load_state_dict(torch.load(str(MODEL_PATH), map_location='cpu', weights_only=True))
    else:
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
    model.eval()
    return model


def preprocess_image(image_path=None, image_bytes=None):
    """Load and preprocess an image for inference."""
    transform = transforms.Compose([
        transforms.Resize((64, 64)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])

    if image_bytes:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    elif image_path:
        img = Image.open(image_path).convert('RGB')
    else:
        raise ValueError("Provide image_path or image_bytes")

    tensor = transform(img).unsqueeze(0)
    return tensor, img


def generate_gradcam(model, input_tensor, predicted_class, original_img):
    """Generate Grad-CAM heatmap as base64 PNG."""
    if not HAS_GRADCAM:
        return None

    target_layer = model.backbone.layer4[-1]
    cam = GradCAM(model=model, target_layers=[target_layer])

    targets = [ClassifierOutputTarget(predicted_class)]
    grayscale_cam = cam(input_tensor=input_tensor, targets=targets)[0]

    # Prepare original image for overlay
    img_resized = original_img.resize((64, 64))
    img_np = np.array(img_resized).astype(np.float32) / 255.0
    cam_image = show_cam_on_image(img_np, grayscale_cam, use_rgb=True)

    # Convert to base64
    cam_pil = Image.fromarray(cam_image)
    cam_pil = cam_pil.resize((256, 256), Image.NEAREST)
    buffer = io.BytesIO()
    cam_pil.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


def classify(image_path=None, image_bytes=None):
    """Run classification on an image."""
    model = load_model()
    input_tensor, original_img = preprocess_image(image_path=image_path, image_bytes=image_bytes)

    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = F.softmax(outputs, dim=1)[0]

    predicted_idx = probabilities.argmax().item()
    predicted_class = CLASS_NAMES[predicted_idx]
    confidence = probabilities[predicted_idx].item()

    # All class probabilities
    class_probs = {
        CLASS_NAMES[i]: round(probabilities[i].item() * 100, 2)
        for i in range(len(CLASS_NAMES))
    }

    # Grad-CAM
    gradcam_base64 = generate_gradcam(model, input_tensor, predicted_idx, original_img)

    # Agriculture relevance
    is_agriculture = predicted_class in AGRICULTURE_CLASSES

    return {
        'predictedClass': predicted_class,
        'confidence': round(confidence * 100, 2),
        'description': CLASS_DESCRIPTIONS[predicted_class],
        'isAgriculture': is_agriculture,
        'classProbabilities': class_probs,
        'gradcam': gradcam_base64,
    }


# ============================================================
# CLI Entry Point (called by server.js)
# ============================================================

if __name__ == '__main__':
    try:
        input_data = json.loads(sys.stdin.read())

        if 'imagePath' in input_data:
            result = classify(image_path=input_data['imagePath'])
        elif 'imageBase64' in input_data:
            image_bytes = base64.b64decode(input_data['imageBase64'])
            result = classify(image_bytes=image_bytes)
        else:
            raise ValueError("No image provided")

        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

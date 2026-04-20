#!/usr/bin/env python3
"""
DL Prediction API - Ensemble satellite image land cover classification.
Runs BOTH EuroSAT and RESISC-45 trained models and merges predictions
into 11 unified land cover classes.
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
# Model Definition (same for both models)
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
# Paths
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
MODELS_DIR = PROJECT_ROOT / "Phase2_DL" / "experiments" / "results" / "models"

EUROSAT_MODEL_PATH = MODELS_DIR / "EuroSAT_ResNet50_SE.pth"
RESISC_MODEL_PATH = MODELS_DIR / "ResNet50_SE.pth"

# ============================================================
# Class Definitions
# ============================================================

EUROSAT_CLASSES = [
    'AnnualCrop', 'Forest', 'HerbaceousVegetation', 'Highway',
    'Industrial', 'Pasture', 'PermanentCrop', 'Residential',
    'River', 'SeaLake'
]

RESISC_CLASSES = [
    'Desert', 'Farmland', 'Forest', 'Highway', 'Industrial',
    'Lake', 'Meadow', 'Mountain', 'Residential', 'River'
]

# Unified 11 classes — maps from each model's classes
UNIFIED_CLASSES = [
    'Cropland', 'Pasture', 'Vegetation', 'Forest', 'Highway',
    'Industrial', 'Residential', 'River', 'Water Body',
    'Desert', 'Mountain'
]

# How EuroSAT classes map to unified classes
EUROSAT_TO_UNIFIED = {
    'AnnualCrop': 'Cropland',
    'PermanentCrop': 'Cropland',
    'Pasture': 'Pasture',
    'HerbaceousVegetation': 'Vegetation',
    'Forest': 'Forest',
    'Highway': 'Highway',
    'Industrial': 'Industrial',
    'Residential': 'Residential',
    'River': 'River',
    'SeaLake': 'Water Body',
}

# How RESISC-45 classes map to unified classes
RESISC_TO_UNIFIED = {
    'Farmland': 'Cropland',
    'Meadow': 'Pasture',
    'Forest': 'Forest',
    'Highway': 'Highway',
    'Industrial': 'Industrial',
    'Residential': 'Residential',
    'River': 'River',
    'Lake': 'Water Body',
    'Desert': 'Desert',
    'Mountain': 'Mountain',
}

UNIFIED_DESCRIPTIONS = {
    'Cropland': 'Agricultural cropland — seasonal or permanent farming fields',
    'Pasture': 'Grazing land, meadow, or pastoral grassland',
    'Vegetation': 'Natural herbaceous vegetation and grassland',
    'Forest': 'Dense tree coverage — forested area',
    'Highway': 'Major road or transportation infrastructure',
    'Industrial': 'Industrial buildings, factories, or commercial zones',
    'Residential': 'Housing and residential buildings',
    'River': 'River or stream water body',
    'Water Body': 'Lake, sea, wetland, or large water body',
    'Desert': 'Arid desert or barren land',
    'Mountain': 'Mountainous terrain',
}

AGRICULTURE_CLASSES = {'Cropland', 'Pasture', 'Vegetation'}

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# ============================================================
# Model Loading
# ============================================================

_model_cache = {}

def load_model(model_path, num_classes):
    """Load a ResNet-50+SE model from disk (cached)."""
    key = str(model_path)
    if key not in _model_cache:
        model = ResNetSE(num_classes=num_classes, pretrained=False, use_se=True)
        if model_path.exists():
            model.load_state_dict(torch.load(str(model_path), map_location='cpu', weights_only=True))
            model.eval()
            _model_cache[key] = model
        else:
            return None
    return _model_cache[key]


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


def run_single_model(model, input_tensor, class_names, class_mapping):
    """Run one model and map its output to unified classes."""
    with torch.no_grad():
        outputs = model(input_tensor)
        probs = F.softmax(outputs, dim=1)[0]

    unified_probs = {}
    for i, cls_name in enumerate(class_names):
        unified_name = class_mapping[cls_name]
        # Sum probabilities for classes that map to the same unified class
        if unified_name in unified_probs:
            unified_probs[unified_name] += probs[i].item()
        else:
            unified_probs[unified_name] = probs[i].item()

    return unified_probs


def generate_gradcam(model, input_tensor, class_names, predicted_unified_class, class_mapping, original_img):
    """Generate Grad-CAM from the model whose class most directly matches."""
    if not HAS_GRADCAM:
        return None

    # Find the original class index in this model that maps to the predicted unified class
    target_idx = None
    for i, cls_name in enumerate(class_names):
        if class_mapping[cls_name] == predicted_unified_class:
            target_idx = i
            break
    if target_idx is None:
        return None

    target_layer = model.backbone.layer4[-1]
    cam = GradCAM(model=model, target_layers=[target_layer])
    targets = [ClassifierOutputTarget(target_idx)]
    grayscale_cam = cam(input_tensor=input_tensor, targets=targets)[0]

    img_resized = original_img.resize((64, 64))
    img_np = np.array(img_resized).astype(np.float32) / 255.0
    cam_image = show_cam_on_image(img_np, grayscale_cam, use_rgb=True)

    cam_pil = Image.fromarray(cam_image)
    cam_pil = cam_pil.resize((256, 256), Image.NEAREST)
    buffer = io.BytesIO()
    cam_pil.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')


# ============================================================
# Ensemble Classification
# ============================================================

def classify(image_path=None, image_bytes=None):
    """Run ensemble classification using both models."""
    input_tensor, original_img = preprocess_image(image_path=image_path, image_bytes=image_bytes)

    # Load both models
    eurosat_model = load_model(EUROSAT_MODEL_PATH, num_classes=10)
    resisc_model = load_model(RESISC_MODEL_PATH, num_classes=10)

    # Use RESISC-45 as the primary model for the webapp.
    # EuroSAT is only used as fallback if RESISC-45 weights are missing.
    # Reason: Users upload Google Earth screenshots — RESISC-45 is trained
    # on Google Earth imagery worldwide. EuroSAT (European Sentinel-2) gives
    # confidently wrong predictions on Google Earth images and hurts accuracy.

    unified_probs = {cls: 0.0 for cls in UNIFIED_CLASSES}
    models_used = []

    if resisc_model is not None:
        # Primary: RESISC-45 (trained on Google Earth, worldwide)
        resisc_probs = run_single_model(resisc_model, input_tensor, RESISC_CLASSES, RESISC_TO_UNIFIED)
        for cls, prob in resisc_probs.items():
            unified_probs[cls] += prob
        models_used.append('RESISC-45')
    elif eurosat_model is not None:
        # Fallback: EuroSAT (only if RESISC-45 not available)
        eurosat_probs = run_single_model(eurosat_model, input_tensor, EUROSAT_CLASSES, EUROSAT_TO_UNIFIED)
        for cls, prob in eurosat_probs.items():
            unified_probs[cls] += prob
        models_used.append('EuroSAT')

    if len(models_used) == 0:
        raise FileNotFoundError("No model weights found. Train at least one model first.")

    # Normalize to sum to 1
    total = sum(unified_probs.values())
    if total > 0:
        unified_probs = {k: v / total for k, v in unified_probs.items()}

    # Find prediction
    predicted_class = max(unified_probs, key=unified_probs.get)
    confidence = unified_probs[predicted_class]

    # Format probabilities as percentages
    class_probs = {cls: round(prob * 100, 2) for cls, prob in unified_probs.items()}

    # Grad-CAM from the model that contributed most to the predicted class
    gradcam_base64 = None
    if resisc_model and any(RESISC_TO_UNIFIED.get(c) == predicted_class for c in RESISC_CLASSES):
        gradcam_base64 = generate_gradcam(
            resisc_model, input_tensor, RESISC_CLASSES,
            predicted_class, RESISC_TO_UNIFIED, original_img
        )
    elif eurosat_model and any(EUROSAT_TO_UNIFIED.get(c) == predicted_class for c in EUROSAT_CLASSES):
        gradcam_base64 = generate_gradcam(
            eurosat_model, input_tensor, EUROSAT_CLASSES,
            predicted_class, EUROSAT_TO_UNIFIED, original_img
        )

    is_agriculture = predicted_class in AGRICULTURE_CLASSES
    description = UNIFIED_DESCRIPTIONS.get(predicted_class, '')
    models_info = []
    if eurosat_model: models_info.append('EuroSAT')
    if resisc_model: models_info.append('RESISC-45')

    return {
        'predictedClass': predicted_class,
        'confidence': round(confidence * 100, 2),
        'description': description,
        'isAgriculture': is_agriculture,
        'classProbabilities': class_probs,
        'gradcam': gradcam_base64,
        'modelsUsed': models_info,
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

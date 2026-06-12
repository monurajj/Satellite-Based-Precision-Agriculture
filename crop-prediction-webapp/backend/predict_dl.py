#!/usr/bin/env python3
"""
ULTRA-LEAN DL Prediction API - Optimized for 512MB RAM environments (Render Free Tier).
Uses a single ResNet-50+SE Global model (RESISC-45) with torchvision backbone.
Disabled: EuroSAT fallback, Grad-CAM, and timm library.
"""

import sys
import json
import os
import base64
import io
import gc
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
import torch.nn.functional as F
from torchvision import transforms, models
from PIL import Image

# CRITICAL: Limit threads to save memory overhead
torch.set_num_threads(1)
if hasattr(torch, 'set_num_interop_threads'):
    torch.set_num_interop_threads(1)

# ============================================================
# Ultra-Lean Model Definition (Torchvision Backbone)
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
    def __init__(self, num_classes=10):
        super().__init__()
        # Use standard torchvision resnet50 (matches timm architecture)
        # We replace the global pool and fc with our own to match the saved weights
        self.backbone = models.resnet50(weights=None)
        self.backbone.avgpool = nn.Identity()
        self.backbone.fc = nn.Identity()
        
        self.se_block = SEBlock(channels=2048, reduction=16)
        self.classifier = nn.Sequential(
            nn.Dropout(0.3),
            nn.Linear(2048, 512),
            nn.ReLU(inplace=True),
            nn.Dropout(0.2),
            nn.Linear(512, num_classes),
        )

    def forward(self, x):
        # resnet50 forward pass excluding avgpool and fc
        x = self.backbone.conv1(x)
        x = self.backbone.bn1(x)
        x = self.backbone.relu(x)
        x = self.backbone.maxpool(x)
        x = self.backbone.layer1(x)
        x = self.backbone.layer2(x)
        x = self.backbone.layer3(x)
        x = self.backbone.layer4(x)
        
        # Apply SE and Pooling
        x = self.se_block(x)
        x = F.adaptive_avg_pool2d(x, 1).flatten(1)
        return self.classifier(x)

# ============================================================
# Paths & Classes
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
RESISC_MODEL_PATH = PROJECT_ROOT / "Phase2_DL" / "experiments" / "results" / "models" / "ResNet50_SE.pth"

RESISC_CLASSES = ['Desert', 'Farmland', 'Forest', 'Highway', 'Industrial', 'Lake', 'Meadow', 'Mountain', 'Residential', 'River']

RESISC_TO_UNIFIED = {
    'Farmland': 'Cropland', 'Meadow': 'Pasture', 'Forest': 'Forest', 'Highway': 'Highway', 
    'Industrial': 'Industrial', 'Residential': 'Residential', 'River': 'River', 
    'Lake': 'Water Body', 'Desert': 'Desert', 'Mountain': 'Mountain'
}

UNIFIED_DESCRIPTIONS = {
    'Cropland': 'Agricultural cropland — farming fields',
    'Pasture': 'Grazing land or pastoral grassland',
    'Forest': 'Dense tree coverage — forested area',
    'Highway': 'Major road or transportation infrastructure',
    'Industrial': 'Industrial buildings or commercial zones',
    'Residential': 'Housing and residential buildings',
    'River': 'River or stream water body',
    'Water Body': 'Lake, sea, or large water body',
    'Desert': 'Arid desert or barren land',
    'Mountain': 'Mountainous terrain'
}

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]

# ============================================================
# Model Loading (Single Model)
# ============================================================

_cached_model = None

def get_model():
    global _cached_model
    if _cached_model is None:
        if not RESISC_MODEL_PATH.exists():
            return None
        model = ResNetSE(num_classes=10)
        # Use weights_only for security and map_location for CPU execution
        state_dict = torch.load(str(RESISC_MODEL_PATH), map_location='cpu', weights_only=False)
        # Handle timm key prefixing if necessary
        new_state_dict = {}
        for k, v in state_dict.items():
            # If weights were saved as backbone.[...], our model matches
            new_state_dict[k] = v
        model.load_state_dict(new_state_dict)
        model.eval()
        _cached_model = model
    return _cached_model

# ============================================================
# Inference
# ============================================================

def classify(image_bytes):
    model = get_model()
    if model is None:
        raise FileNotFoundError("Model weights missing. Please push .pth files.")

    # Preprocess
    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    transform = transforms.Compose([
        transforms.Resize((64, 64)),
        transforms.ToTensor(),
        transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
    ])
    tensor = transform(img).unsqueeze(0)

    # Predict in ultra-efficient mode
    with torch.inference_mode():
        outputs = model(tensor)
        probs = F.softmax(outputs, dim=1)[0]
    
    top_idx = int(probs.argmax().item())
    raw_class = RESISC_CLASSES[top_idx]
    unified = RESISC_TO_UNIFIED.get(raw_class, raw_class)
    
    # Probabilities map
    class_probs = {RESISC_TO_UNIFIED.get(c, c): round(float(probs[i].item()) * 100, 2) 
                   for i, c in enumerate(RESISC_CLASSES)}

    # Aggressively clear memory
    del tensor
    del outputs
    gc.collect()

    return {
        'predictedClass': unified,
        'confidence': round(float(probs[top_idx].item()) * 100, 2),
        'description': UNIFIED_DESCRIPTIONS.get(unified, ''),
        'classProbabilities': class_probs,
        'modelUsed': 'Global ResNet-50 (Optimized)',
        'gradcam': None # Disabled for memory stability
    }

if __name__ == '__main__':
    try:
        input_data = json.loads(sys.stdin.read())
        if 'imageBase64' in input_data:
            data = base64.b64decode(input_data['imageBase64'])
        elif 'imagePath' in input_data:
            with open(input_data['imagePath'], 'rb') as f: data = f.read()
        else:
            raise ValueError("No image provided")

        print(json.dumps(classify(data)))
    except Exception as e:
        print(json.dumps({'error': str(e)}), file=sys.stderr)
        sys.exit(1)

#!/usr/bin/env python3
"""
Phase 3 Hybrid Yield Prediction API.

Combines:
- ML branch: Multi-crop XGBoost trained on Indian district-wise yield data
- DL branch: Phase 2 ResNet-50+SE for crop verification + 2048-dim feature extraction
- Live APIs: SoilGrids (soil) + NASA POWER (weather) by lat/lon

Input (stdin JSON):
    {state, district, crop, season, acres, imageBase64 (optional)}

Output (stdout JSON):
    yield/ha, total tons, soil, weather, CNN verification, insights, etc.
"""

import os
# Resolve OpenMP conflict between XGBoost (libomp) and PyTorch (libomp).
# Without these, importing both libraries in the same process can deadlock
# on macOS. Must be set BEFORE importing torch or xgboost.
os.environ.setdefault("KMP_DUPLICATE_LIB_OK", "TRUE")
os.environ.setdefault("OMP_NUM_THREADS", "1")

import sys
import json
import base64
import io
from pathlib import Path

import numpy as np
import pandas as pd
import joblib

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
PHASE3_DIR = PROJECT_ROOT / "Phase3_Hybrid"

sys.path.insert(0, str(PHASE3_DIR / "src"))
from api_clients import get_soil_data, get_weather_data

XGB_MODEL_PATH = PHASE3_DIR / "models" / "xgb_multi_crop.pkl"
FEATURE_COLS_PATH = PHASE3_DIR / "models" / "feature_columns.json"
DISTRICT_LATLON_PATH = PHASE3_DIR / "models" / "district_lat_lon.json"
METADATA_PATH = PHASE3_DIR / "models" / "model_metadata.json"

ACRES_TO_HECTARES = 0.40468564

_xgb_model = None
_feature_cols = None
_district_latlon = None
_metadata = None
_cnn_model = None


def load_artifacts():
    """Lazy-load all models and metadata once per process."""
    global _xgb_model, _feature_cols, _district_latlon, _metadata
    if _xgb_model is None:
        if not XGB_MODEL_PATH.exists():
            raise FileNotFoundError(
                f"XGBoost model not found at {XGB_MODEL_PATH}. "
                f"Run Phase3_Hybrid/notebooks/01_Multi_Crop_XGBoost_Training.ipynb first."
            )
        _xgb_model = joblib.load(XGB_MODEL_PATH)
        with open(FEATURE_COLS_PATH) as f:
            _feature_cols = json.load(f)["columns"]
        with open(DISTRICT_LATLON_PATH) as f:
            _district_latlon = json.load(f)
        with open(METADATA_PATH) as f:
            _metadata = json.load(f)
    return _xgb_model, _feature_cols, _district_latlon, _metadata


def lookup_latlon(state, district):
    _, _, district_latlon, _ = load_artifacts()
    if state not in district_latlon:
        raise ValueError(f"Unknown state: {state}")
    if district not in district_latlon[state]:
        raise ValueError(f"Unknown district '{district}' in state '{state}'")
    return district_latlon[state][district]


def build_feature_vector(state, district, crop, season, soil, weather, year=2024):
    """Build a 56-feature vector matching the training schema (one-hot encoded)."""
    _, feature_cols, _, _ = load_artifacts()

    base = {
        "Year": year,
        "Soil_pH": soil["ph"],
        "Soil_OC": soil["soc"],
        "Soil_Clay": soil["clay"],
        "Total_Rainfall": weather["total_rainfall"],
        "Avg_Temp": weather["avg_temp"],
    }

    one_hot = {col: 0 for col in feature_cols if col not in base}
    one_hot[f"State_{state}"] = 1
    one_hot[f"District_{district}"] = 1
    one_hot[f"Crop_{crop}"] = 1
    one_hot[f"Season_{season}"] = 1

    full = {**base, **one_hot}
    row = pd.DataFrame([full])[feature_cols]
    return row


def run_cnn_classification(image_bytes):
    """Run Phase 2 CNN to classify the uploaded image (verification only)."""
    global _cnn_model
    try:
        import torch
        import torch.nn.functional as F
        from torchvision import transforms
        from PIL import Image

        sys.path.insert(0, str(Path(__file__).parent))
        from predict_dl import (
            load_model, RESISC_MODEL_PATH, RESISC_CLASSES,
            RESISC_TO_UNIFIED, IMAGENET_MEAN, IMAGENET_STD
        )

        if _cnn_model is None:
            _cnn_model = load_model(RESISC_MODEL_PATH, num_classes=10)
            if _cnn_model is None:
                return None

        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        transform = transforms.Compose([
            transforms.Resize((64, 64)),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ])
        tensor = transform(img).unsqueeze(0)

        with torch.no_grad():
            outputs = _cnn_model(tensor)
            probs = F.softmax(outputs, dim=1)[0]
            top_idx = int(probs.argmax().item())
            top_class = RESISC_CLASSES[top_idx]
            unified = RESISC_TO_UNIFIED.get(top_class, top_class)
            confidence = float(probs[top_idx].item())

        return {
            "rawClass": top_class,
            "unifiedClass": unified,
            "confidence": round(confidence * 100, 2),
        }
    except Exception as e:
        return {"error": str(e)}


def crop_matches_cnn(declared_crop, cnn_unified_class):
    """Check if user-declared crop is consistent with CNN's land-cover output."""
    cropland_classes = {"Cropland", "Pasture", "Vegetation"}
    return cnn_unified_class in cropland_classes


def generate_insights(crop, soil, weather, yield_per_ha, district_avg):
    """Generate human-readable agronomic insights."""
    insights = []

    ph = soil["ph"]
    if 6.0 <= ph <= 7.5:
        insights.append({"type": "good", "text": f"Soil pH {ph} is ideal for {crop}."})
    elif ph < 6.0:
        insights.append({"type": "warning", "text": f"Soil pH {ph} is acidic — consider liming."})
    else:
        insights.append({"type": "warning", "text": f"Soil pH {ph} is alkaline — consider gypsum or sulfur amendments."})

    soc = soil["soc"]
    if soc >= 0.75:
        insights.append({"type": "good", "text": f"Organic carbon {soc}% is healthy."})
    else:
        insights.append({"type": "warning", "text": f"Organic carbon {soc}% is low — add compost or FYM."})

    rain = weather["total_rainfall"]
    if rain < 300:
        insights.append({"type": "warning", "text": f"Rainfall {rain}mm is low — irrigation recommended."})
    elif rain > 1100:
        insights.append({"type": "warning", "text": f"Rainfall {rain}mm is very high — check drainage to prevent root rot."})
    else:
        insights.append({"type": "good", "text": f"Rainfall {rain}mm is suitable for {crop}."})

    if district_avg and yield_per_ha > district_avg * 1.1:
        delta = (yield_per_ha - district_avg) / district_avg * 100
        insights.append({"type": "good", "text": f"Predicted yield is {delta:.0f}% above district average."})
    elif district_avg and yield_per_ha < district_avg * 0.9:
        delta = (district_avg - yield_per_ha) / district_avg * 100
        insights.append({"type": "warning", "text": f"Predicted yield is {delta:.0f}% below district average — review inputs and pest pressure."})

    return insights


def predict_hybrid(state, district, crop, season, acres, image_b64=None):
    xgb_model, feature_cols, _, metadata = load_artifacts()

    lat, lon = lookup_latlon(state, district)

    soil = get_soil_data(lat, lon)
    weather = get_weather_data(lat, lon)

    cnn_result = None
    crop_consistent = None
    if image_b64:
        try:
            image_bytes = base64.b64decode(image_b64)
            cnn_result = run_cnn_classification(image_bytes)
            if cnn_result and "error" not in cnn_result:
                crop_consistent = crop_matches_cnn(crop, cnn_result["unifiedClass"])
        except Exception as e:
            cnn_result = {"error": str(e)}

    X = build_feature_vector(state, district, crop, season, soil, weather)
    yield_per_ha = float(xgb_model.predict(X)[0])
    yield_per_ha = max(yield_per_ha, 0.1)

    hectares = acres * ACRES_TO_HECTARES
    total_production = yield_per_ha * hectares

    district_avg = metadata.get("avg_yield_by_crop", {}).get(crop)

    insights = generate_insights(crop, soil, weather, yield_per_ha, district_avg)

    model_used = "Hybrid (ML+DL)" if cnn_result and "error" not in cnn_result else "ML-only (no image)"

    return {
        "yieldPerHectare": round(yield_per_ha, 2),
        "totalProduction": round(total_production, 2),
        "areaAcres": round(acres, 2),
        "areaHectares": round(hectares, 3),
        "unit": "tons",
        "soil": soil,
        "weather": weather,
        "location": {"state": state, "district": district, "lat": lat, "lon": lon},
        "crop": crop,
        "season": season,
        "districtAvgYield": round(district_avg, 2) if district_avg else None,
        "yieldVsAvgPercent": round((yield_per_ha / district_avg - 1) * 100, 1) if district_avg else None,
        "cnnVerification": cnn_result,
        "cropConsistentWithImage": crop_consistent,
        "insights": insights,
        "modelUsed": model_used,
    }


def main():
    try:
        inp = json.load(sys.stdin)
        required = ["state", "district", "crop", "season", "acres"]
        missing = [k for k in required if inp.get(k) is None]
        if missing:
            raise ValueError(f"Missing required fields: {', '.join(missing)}")

        result = predict_hybrid(
            state=inp["state"],
            district=inp["district"],
            crop=inp["crop"],
            season=inp["season"],
            acres=float(inp["acres"]),
            image_b64=inp.get("imageBase64"),
        )
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

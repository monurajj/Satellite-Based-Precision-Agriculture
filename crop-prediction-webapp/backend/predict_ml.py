#!/usr/bin/env python3
"""
ML Prediction API - Uses the actual trained model from the main project.
Maps farmer inputs to model features and runs inference.
"""

import sys
import json
from pathlib import Path

# Project root for imports
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import numpy as np
import pandas as pd
import joblib
from sklearn.decomposition import PCA

# Paths
FEATURES_CSV = PROJECT_ROOT / "data" / "features.csv"
MERGED_CSV = PROJECT_ROOT / "data" / "merged_data.csv"
MODEL_PATH = PROJECT_ROOT / "experiments" / "results" / "best_model.joblib"

# Soil type -> (soil_pH, soil_OC, soil_clay) - from training data ranges
SOIL_PARAMS = {
    "loam": (6.4, 1.5, 25.0),
    "clay": (6.6, 2.5, 35.0),
    "sandy": (6.2, 0.8, 12.0),
    "silt": (6.5, 1.8, 18.0),
    "sandy-loam": (6.3, 1.2, 18.0),
    "clay-loam": (6.5, 2.0, 28.0),
    "other": (6.4, 1.5, 25.0),
}

# Feature order expected by model (from main pipeline)
FEATURE_COLS = [
    "ndvi_peak",
    "season_length",
    "cumulative_ndvi",
    "ndvi_grain_fill_slope",
    "precip_sum",
    "temp_mean",
    "solar_sum",
    "gdd_sum",
    "soil_pH",
    "soil_OC",
    "soil_clay",
    "B2", "B3", "B4", "B8", "B11", "B12",
    "pca_0", "pca_1", "pca_2",
    "ndvi_peak_x_precip_sum",
    "ndvi_peak_x_gdd_sum",
    "ndvi_peak_x_soil_OC",
    "gdd_sum_x_precip_sum",
]


def load_training_stats():
    """Load feature stats and fitted PCA from training data."""
    features_df = pd.read_csv(FEATURES_CSV)
    band_cols = ["B2", "B3", "B4", "B8", "B11", "B12"]
    band_means = features_df[band_cols].median().values
    pca = PCA(n_components=3)
    pca.fit(features_df[band_cols].fillna(features_df[band_cols].median()))
    return band_means, pca


def farmer_inputs_to_features(input_dict):
    """
    Map farmer form inputs to model feature vector.
    Input: cropType, landArea, soilType, rainfall, temperature, solarRad
    """
    soil_key = (input_dict.get("soilType") or "Loam").lower().replace(" ", "-")
    soil_key = soil_key if soil_key in SOIL_PARAMS else "other"
    soil_pH, soil_OC, soil_clay = SOIL_PARAMS[soil_key]

    rainfall = float(input_dict.get("rainfall") or 500)
    temp = float(input_dict.get("temperature") or 20)
    solar = float(input_dict.get("solarRad") or 150)

    # Weather aggregates (scaled to training ranges)
    # Training: precip_sum ~150-280, temp_mean ~16-21, solar_sum ~1300-1680, gdd ~140-210
    precip_sum = np.clip(rainfall * 0.45, 150, 300)
    temp_mean = np.clip(temp, 15, 22)
    solar_sum = np.clip(solar * 10, 1300, 1700)
    gdd_sum = np.clip(max(0, temp - 5) * 100, 140, 220)

    # NDVI peak: higher with better rain/temp (training range ~0.6-0.95)
    rain_factor = min(1.0, rainfall / 400)
    temp_factor = 0.8 + 0.2 * (temp / 22) if temp > 15 else 0.8
    ndvi_peak = np.clip(0.65 + 0.15 * rain_factor + 0.08 * temp_factor, 0.6, 0.92)

    season_length = 100.0
    cumulative_ndvi = np.clip(ndvi_peak * 65, 45, 65)
    ndvi_grain_fill_slope = -0.01

    # Spectral bands: use training median (we don't have satellite data)
    band_means, pca = load_training_stats()
    bands = band_means

    # PCA transform (use DataFrame to avoid sklearn feature-names warning)
    import warnings
    with warnings.catch_warnings(action="ignore"):
        band_df = pd.DataFrame(bands.reshape(1, -1), columns=["B2", "B3", "B4", "B8", "B11", "B12"])
        pca_transformed = pca.transform(band_df)[0]

    # Interactions
    ndvi_peak_x_precip_sum = ndvi_peak * precip_sum
    ndvi_peak_x_gdd_sum = ndvi_peak * gdd_sum
    ndvi_peak_x_soil_OC = ndvi_peak * soil_OC
    gdd_sum_x_precip_sum = gdd_sum * precip_sum

    feature_values = [
        ndvi_peak,
        season_length,
        cumulative_ndvi,
        ndvi_grain_fill_slope,
        precip_sum,
        temp_mean,
        solar_sum,
        gdd_sum,
        soil_pH,
        soil_OC,
        soil_clay,
        float(bands[0]),
        float(bands[1]),
        float(bands[2]),
        float(bands[3]),
        float(bands[4]),
        float(bands[5]),
        float(pca_transformed[0]),
        float(pca_transformed[1]),
        float(pca_transformed[2]),
        ndvi_peak_x_precip_sum,
        ndvi_peak_x_gdd_sum,
        ndvi_peak_x_soil_OC,
        gdd_sum_x_precip_sum,
    ]
    return np.array(feature_values).reshape(1, -1), FEATURE_COLS


def predict(input_dict):
    """Run ML prediction. Returns (yield_per_ha, total_yield)."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}. Run main.py first to train.")

    model = joblib.load(MODEL_PATH)
    X, cols = farmer_inputs_to_features(input_dict)

    # Ensure feature order matches model
    yield_per_ha = float(model.predict(X)[0])
    land_area = float(input_dict.get("landArea") or 1)
    total_yield = yield_per_ha * land_area

    return yield_per_ha, total_yield


def main():
    """CLI: read JSON from stdin, output JSON to stdout."""
    try:
        input_dict = json.load(sys.stdin)
        yield_per_ha, total_yield = predict(input_dict)
        print(json.dumps({
            "predictedYield": round(yield_per_ha, 2),
            "totalYield": round(total_yield, 2),
            "unit": "tons",
            "message": f"ML model: {yield_per_ha:.1f} tons/ha × {input_dict.get('landArea', 1)} ha = {total_yield:.1f} tons",
        }))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()

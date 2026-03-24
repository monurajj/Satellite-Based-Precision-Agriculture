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
from functools import lru_cache

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

# Crop type effects used to perturb mapped agronomic features.
# This is a proxy because the trained model does not include a native crop_type column.
CROP_EFFECTS = {
    "wheat": {"precip_scale": 1.00, "temp_shift": 0.0, "solar_scale": 1.00, "gdd_scale": 1.00, "ndvi_bias": 0.000, "season_scale": 1.00},
    "rice": {"precip_scale": 1.15, "temp_shift": 1.0, "solar_scale": 0.98, "gdd_scale": 1.04, "ndvi_bias": 0.015, "season_scale": 1.06},
    "corn": {"precip_scale": 1.08, "temp_shift": 1.5, "solar_scale": 1.03, "gdd_scale": 1.12, "ndvi_bias": 0.012, "season_scale": 0.97},
    "barley": {"precip_scale": 0.94, "temp_shift": -0.6, "solar_scale": 0.99, "gdd_scale": 0.93, "ndvi_bias": -0.008, "season_scale": 0.92},
    "soybean": {"precip_scale": 1.04, "temp_shift": 0.8, "solar_scale": 1.02, "gdd_scale": 1.00, "ndvi_bias": 0.006, "season_scale": 1.01},
    "cotton": {"precip_scale": 0.90, "temp_shift": 2.2, "solar_scale": 1.08, "gdd_scale": 1.18, "ndvi_bias": 0.010, "season_scale": 1.10},
    "sugarcane": {"precip_scale": 1.22, "temp_shift": 2.0, "solar_scale": 1.06, "gdd_scale": 1.25, "ndvi_bias": 0.022, "season_scale": 1.18},
    "potato": {"precip_scale": 0.95, "temp_shift": -1.1, "solar_scale": 0.97, "gdd_scale": 0.88, "ndvi_bias": -0.005, "season_scale": 0.90},
    "other": {"precip_scale": 1.00, "temp_shift": 0.0, "solar_scale": 1.00, "gdd_scale": 1.00, "ndvi_bias": 0.000, "season_scale": 1.00},
}

# Final yield adjustment by crop type.
# Keeps cropType impactful even when the core model saturates in a narrow range.
CROP_YIELD_MULTIPLIER = {
    "wheat": 1.00,
    "rice": 0.96,
    "corn": 1.04,
    "barley": 0.93,
    "soybean": 0.95,
    "cotton": 0.92,
    "sugarcane": 1.08,
    "potato": 1.02,
    "other": 1.00,
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


def _soft_clip(value, low, high, margin_factor=0.75):
    """
    Clip with wider margins so inputs retain variation while staying realistic.
    """
    span = max(1e-6, high - low)
    margin = span * margin_factor
    return float(np.clip(value, low - margin, high + margin))


@lru_cache(maxsize=1)
def load_training_stats():
    """Load feature stats and fitted PCA from training data."""
    features_df = pd.read_csv(FEATURES_CSV)
    band_cols = ["B2", "B3", "B4", "B8", "B11", "B12"]
    band_means = features_df[band_cols].median().values
    pca = PCA(n_components=3)
    pca.fit(features_df[band_cols].fillna(features_df[band_cols].median()))
    q = features_df.quantile([0.05, 0.95], numeric_only=True)
    bounds = {
        "precip_sum": (float(q.loc[0.05, "precip_sum"]), float(q.loc[0.95, "precip_sum"])),
        "temp_mean": (float(q.loc[0.05, "temp_mean"]), float(q.loc[0.95, "temp_mean"])),
        "solar_sum": (float(q.loc[0.05, "solar_sum"]), float(q.loc[0.95, "solar_sum"])),
        "gdd_sum": (float(q.loc[0.05, "gdd_sum"]), float(q.loc[0.95, "gdd_sum"])),
        "ndvi_peak": (float(q.loc[0.05, "ndvi_peak"]), float(q.loc[0.95, "ndvi_peak"])),
    }
    medians = {
        "season_length": float(features_df["season_length"].median()),
        "ndvi_grain_fill_slope": float(features_df["ndvi_grain_fill_slope"].median()),
    }
    return band_means, pca, bounds, medians


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
    crop_key = (input_dict.get("cropType") or "Wheat").lower().strip()
    crop_effect = CROP_EFFECTS.get(crop_key, CROP_EFFECTS["other"])

    rainfall_adj = rainfall * crop_effect["precip_scale"]
    temp_adj = temp + crop_effect["temp_shift"]
    solar_adj = solar * crop_effect["solar_scale"]

    # Data-driven, softer bounds to avoid collapsing many inputs to the same values.
    _, _, bounds, medians = load_training_stats()
    precip_sum = _soft_clip(rainfall_adj * 0.45, *bounds["precip_sum"])
    temp_mean = _soft_clip(temp_adj, *bounds["temp_mean"])
    solar_sum = _soft_clip(solar_adj * 10, *bounds["solar_sum"])
    gdd_sum = _soft_clip(max(0, temp_adj - 5) * 100 * crop_effect["gdd_scale"], *bounds["gdd_sum"])

    # NDVI peak: smooth response to rain/temp without hard saturation.
    rain_factor = rainfall_adj / (rainfall_adj + 350.0) if rainfall_adj > 0 else 0.0
    temp_factor = np.exp(-((temp_adj - 20.0) ** 2) / (2 * 7.5 ** 2))
    ndvi_base = 0.58 + 0.25 * rain_factor + 0.17 * temp_factor + crop_effect["ndvi_bias"]
    ndvi_peak = _soft_clip(ndvi_base, *bounds["ndvi_peak"])

    season_length = medians["season_length"] * crop_effect["season_scale"]
    cumulative_ndvi = ndvi_peak * (season_length * 0.56)
    ndvi_grain_fill_slope = medians["ndvi_grain_fill_slope"]

    # Spectral bands: use training median (we don't have satellite data)
    band_means, pca, _, _ = load_training_stats()
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
    crop_key = (input_dict.get("cropType") or "Wheat").lower().strip()
    crop_multiplier = CROP_YIELD_MULTIPLIER.get(crop_key, CROP_YIELD_MULTIPLIER["other"])
    yield_per_ha *= crop_multiplier
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

"""
Retrain the multi-crop XGBoost on ALL 28 Indian states + major UTs.

Run from project root:
    venv/bin/python Phase3_Hybrid/src/retrain_all_india.py

Overwrites:
    Phase3_Hybrid/models/xgb_multi_crop.pkl
    Phase3_Hybrid/models/feature_columns.json
    Phase3_Hybrid/models/district_lat_lon.json
    Phase3_Hybrid/models/model_metadata.json
    Phase3_Hybrid/data/india_crop_yield_synthetic.csv
"""

import os
os.environ.setdefault("OMP_NUM_THREADS", "1")

import json
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
import xgboost as xgb

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODELS_DIR = PROJECT_ROOT / "models"
DATA_DIR = PROJECT_ROOT / "data"
RESULTS_DIR = PROJECT_ROOT / "experiments" / "results"

for d in [MODELS_DIR, DATA_DIR, RESULTS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

np.random.seed(42)


# ============================================================
# All 28 Indian states + key UTs with major agricultural districts
# ============================================================

DISTRICT_LATLON = {
    "Andhra Pradesh": {
        "Visakhapatnam": [17.6868, 83.2185],
        "Vijayawada": [16.5062, 80.6480],
        "Guntur": [16.3067, 80.4365],
        "Kurnool": [15.8281, 78.0373],
        "Tirupati": [13.6288, 79.4192],
        "Anantapur": [14.6819, 77.6006],
    },
    "Arunachal Pradesh": {
        "Itanagar": [27.0844, 93.6053],
        "Tawang": [27.5859, 91.8594],
        "Pasighat": [28.0667, 95.3333],
    },
    "Assam": {
        "Guwahati": [26.1445, 91.7362],
        "Dibrugarh": [27.4728, 94.9120],
        "Silchar": [24.8333, 92.7789],
        "Tezpur": [26.6336, 92.7989],
        "Jorhat": [26.7509, 94.2037],
    },
    "Bihar": {
        "Patna": [25.5941, 85.1376],
        "Gaya": [24.7914, 85.0002],
        "Muzaffarpur": [26.1209, 85.3647],
        "Bhagalpur": [25.2425, 86.9842],
        "Darbhanga": [26.1542, 85.8918],
        "Purnia": [25.7771, 87.4753],
    },
    "Chhattisgarh": {
        "Raipur": [21.2514, 81.6296],
        "Bilaspur": [22.0797, 82.1409],
        "Durg": [21.1900, 81.2849],
        "Korba": [22.3458, 82.6963],
        "Rajnandgaon": [21.0974, 81.0379],
    },
    "Goa": {
        "Panaji": [15.4909, 73.8278],
        "Margao": [15.2832, 73.9862],
    },
    "Gujarat": {
        "Ahmedabad": [23.0225, 72.5714],
        "Surat": [21.1702, 72.8311],
        "Vadodara": [22.3072, 73.1812],
        "Rajkot": [22.3039, 70.8022],
        "Bhavnagar": [21.7645, 72.1519],
        "Junagadh": [21.5222, 70.4579],
        "Anand": [22.5645, 72.9289],
    },
    "Haryana": {
        "Gurugram": [28.4595, 77.0266],
        "Faridabad": [28.4089, 77.3178],
        "Karnal": [29.6857, 76.9905],
        "Hisar": [29.1492, 75.7217],
        "Rohtak": [28.8955, 76.6066],
        "Panipat": [29.3909, 76.9635],
        "Ambala": [30.3753, 76.7821],
    },
    "Himachal Pradesh": {
        "Shimla": [31.1048, 77.1734],
        "Manali": [32.2396, 77.1887],
        "Dharamshala": [32.2190, 76.3234],
        "Kullu": [31.9577, 77.1100],
        "Solan": [30.9045, 77.0967],
    },
    "Jharkhand": {
        "Ranchi": [23.3441, 85.3096],
        "Jamshedpur": [22.8046, 86.2029],
        "Dhanbad": [23.7957, 86.4304],
        "Bokaro": [23.6693, 86.1511],
        "Hazaribagh": [23.9929, 85.3594],
    },
    "Karnataka": {
        "Bangalore": [12.9716, 77.5946],
        "Mysore": [12.2958, 76.6394],
        "Belgaum": [15.8497, 74.4977],
        "Hubli": [15.3647, 75.1240],
        "Mangalore": [12.9141, 74.8560],
        "Gulbarga": [17.3297, 76.8343],
        "Davangere": [14.4644, 75.9218],
    },
    "Kerala": {
        "Thiruvananthapuram": [8.5241, 76.9366],
        "Kochi": [9.9312, 76.2673],
        "Kozhikode": [11.2588, 75.7804],
        "Thrissur": [10.5276, 76.2144],
        "Palakkad": [10.7867, 76.6548],
        "Kollam": [8.8932, 76.6141],
    },
    "Madhya Pradesh": {
        "Bhopal": [23.2599, 77.4126],
        "Indore": [22.7196, 75.8577],
        "Jabalpur": [23.1815, 79.9864],
        "Gwalior": [26.2183, 78.1828],
        "Ujjain": [23.1793, 75.7849],
        "Sagar": [23.8388, 78.7378],
        "Satna": [24.5854, 80.8313],
    },
    "Maharashtra": {
        "Mumbai": [19.0760, 72.8777],
        "Pune": [18.5204, 73.8567],
        "Nagpur": [21.1458, 79.0882],
        "Nashik": [19.9975, 73.7898],
        "Aurangabad": [19.8762, 75.3433],
        "Solapur": [17.6599, 75.9064],
        "Kolhapur": [16.7050, 74.2433],
        "Amravati": [20.9374, 77.7796],
    },
    "Manipur": {
        "Imphal": [24.8170, 93.9368],
    },
    "Meghalaya": {
        "Shillong": [25.5788, 91.8933],
        "Tura": [25.5132, 90.2026],
    },
    "Mizoram": {
        "Aizawl": [23.7271, 92.7176],
    },
    "Nagaland": {
        "Kohima": [25.6747, 94.1086],
        "Dimapur": [25.9090, 93.7266],
    },
    "Odisha": {
        "Bhubaneswar": [20.2961, 85.8245],
        "Cuttack": [20.4625, 85.8828],
        "Rourkela": [22.2604, 84.8536],
        "Sambalpur": [21.4669, 83.9756],
        "Berhampur": [19.3149, 84.7941],
        "Balasore": [21.4942, 86.9335],
    },
    "Punjab": {
        "Ludhiana": [30.9010, 75.8573],
        "Amritsar": [31.6340, 74.8723],
        "Patiala": [30.3398, 76.3869],
        "Jalandhar": [31.3260, 75.5762],
        "Bathinda": [30.2110, 74.9455],
        "Mohali": [30.7046, 76.7179],
        "Sangrur": [30.2493, 75.8424],
        "Ferozepur": [30.9258, 74.6133],
    },
    "Rajasthan": {
        "Jaipur": [26.9124, 75.7873],
        "Jodhpur": [26.2389, 73.0243],
        "Udaipur": [24.5854, 73.7125],
        "Kota": [25.2138, 75.8648],
        "Bikaner": [28.0229, 73.3119],
        "Ajmer": [26.4499, 74.6399],
        "Alwar": [27.5530, 76.6346],
    },
    "Sikkim": {
        "Gangtok": [27.3389, 88.6065],
    },
    "Tamil Nadu": {
        "Chennai": [13.0827, 80.2707],
        "Coimbatore": [11.0168, 76.9558],
        "Madurai": [9.9252, 78.1198],
        "Tiruchirappalli": [10.7905, 78.7047],
        "Salem": [11.6643, 78.1460],
        "Tirunelveli": [8.7139, 77.7567],
        "Erode": [11.3410, 77.7172],
    },
    "Telangana": {
        "Hyderabad": [17.3850, 78.4867],
        "Warangal": [17.9784, 79.5941],
        "Nizamabad": [18.6725, 78.0941],
        "Karimnagar": [18.4392, 79.1288],
        "Khammam": [17.2473, 80.1514],
    },
    "Tripura": {
        "Agartala": [23.8315, 91.2868],
    },
    "Uttar Pradesh": {
        "Lucknow": [26.8467, 80.9462],
        "Kanpur": [26.4499, 80.3319],
        "Meerut": [28.9845, 77.7064],
        "Agra": [27.1767, 78.0081],
        "Varanasi": [25.3176, 82.9739],
        "Allahabad": [25.4358, 81.8463],
        "Bareilly": [28.3670, 79.4304],
        "Aligarh": [27.8974, 78.0880],
        "Ghaziabad": [28.6692, 77.4538],
        "Gorakhpur": [26.7606, 83.3732],
    },
    "Uttarakhand": {
        "Dehradun": [30.3165, 78.0322],
        "Haridwar": [29.9457, 78.1642],
        "Nainital": [29.3919, 79.4542],
        "Roorkee": [29.8543, 77.8880],
        "Rudrapur": [28.9810, 79.4032],
    },
    "West Bengal": {
        "Kolkata": [22.5726, 88.3639],
        "Siliguri": [26.7271, 88.3953],
        "Durgapur": [23.5204, 87.3119],
        "Asansol": [23.6739, 86.9524],
        "Howrah": [22.5958, 88.2636],
        "Burdwan": [23.2324, 87.8615],
    },
    "Delhi": {
        "New Delhi": [28.6139, 77.2090],
        "North Delhi": [28.7041, 77.1025],
    },
    "Jammu and Kashmir": {
        "Srinagar": [34.0837, 74.7973],
        "Jammu": [32.7266, 74.8570],
        "Anantnag": [33.7311, 75.1487],
        "Baramulla": [34.2096, 74.3436],
    },
    "Puducherry": {
        "Puducherry": [11.9416, 79.8083],
    },
}


# Yield productivity factor — based on Indian agricultural data.
# Punjab/Haryana have intensive irrigated farming; NE states have hilly terrain;
# states with strong agriculture: Bihar, UP, Andhra are mid-tier.
STATE_FACTOR = {
    "Punjab": 1.25, "Haryana": 1.22, "Uttar Pradesh": 1.05,
    "West Bengal": 1.10, "Andhra Pradesh": 1.05, "Telangana": 1.05,
    "Tamil Nadu": 1.05, "Madhya Pradesh": 1.00, "Bihar": 0.95,
    "Maharashtra": 0.95, "Karnataka": 0.92, "Gujarat": 1.00,
    "Rajasthan": 0.85, "Odisha": 0.90, "Chhattisgarh": 0.92,
    "Jharkhand": 0.85, "Kerala": 0.95, "Assam": 0.90,
    "Himachal Pradesh": 0.85, "Uttarakhand": 0.85,
    "Goa": 0.85, "Sikkim": 0.80,
    "Arunachal Pradesh": 0.78, "Manipur": 0.80, "Meghalaya": 0.78,
    "Mizoram": 0.78, "Nagaland": 0.80, "Tripura": 0.85,
    "Delhi": 1.00, "Jammu and Kashmir": 0.85, "Puducherry": 1.00,
}


# ============================================================
# Crops
# ============================================================

CROPS_KHARIF = ["Rice", "Maize", "Jowar", "Bajra", "Ragi",
                "Pigeon Pea", "Soybean", "Cotton", "Sugarcane"]
CROPS_RABI = ["Wheat", "Chickpea", "Mustard"]

BASE_YIELD = {
    "Rice": 2.7, "Wheat": 3.4, "Maize": 3.0, "Jowar": 1.0,
    "Bajra": 1.2, "Ragi": 1.5, "Pigeon Pea": 1.0, "Soybean": 1.2,
    "Cotton": 0.5, "Sugarcane": 70.0, "Chickpea": 1.1, "Mustard": 1.2,
}


def make_yield_row(state, district, year, crop, season):
    base = BASE_YIELD[crop]
    sf = STATE_FACTOR.get(state, 1.0)
    year_trend = (year - 2000) * 0.005

    soil_ph = np.random.uniform(6.0, 8.5)
    soil_oc = np.random.uniform(0.4, 1.5)
    soil_clay = np.random.uniform(15, 45)

    # Coastal / heavy-monsoon states get more rain
    high_rain_states = {
        "Kerala", "Karnataka", "Maharashtra", "Goa", "Assam",
        "West Bengal", "Meghalaya", "Mizoram", "Manipur",
        "Nagaland", "Tripura", "Arunachal Pradesh"
    }
    if season == "Kharif":
        rainfall = (np.random.uniform(700, 1500) if state in high_rain_states
                    else np.random.uniform(400, 900))
        avg_temp = np.random.uniform(22, 32)
    else:
        rainfall = np.random.uniform(150, 500)
        avg_temp = np.random.uniform(15, 25)

    soil_effect = 1.0 + (soil_oc - 0.9) * 0.15
    rain_pivot = 700 if season == "Kharif" else 300
    rain_scale = 5000 if season == "Kharif" else 3000
    weather_effect = 1.0 + (rainfall - rain_pivot) / rain_scale
    noise = np.random.normal(1.0, 0.08)

    yield_val = base * sf * (1 + year_trend) * soil_effect * weather_effect * noise
    yield_val = max(yield_val, 0.1)

    return {
        "State": state, "District": district, "Year": year,
        "Season": season, "Crop": crop,
        "Soil_pH": round(soil_ph, 2), "Soil_OC": round(soil_oc, 2),
        "Soil_Clay": round(soil_clay, 1),
        "Total_Rainfall": round(rainfall, 1),
        "Avg_Temp": round(avg_temp, 1),
        "Yield_tha": round(yield_val, 3),
    }


def main():
    print("=" * 60)
    print("Retraining Phase 3 Hybrid model on ALL Indian states")
    print("=" * 60)

    n_states = len(DISTRICT_LATLON)
    n_districts = sum(len(v) for v in DISTRICT_LATLON.values())
    print(f"\nStates: {n_states}")
    print(f"Districts: {n_districts}")
    print(f"Crops: {len(CROPS_KHARIF) + len(CROPS_RABI)}")

    # Save lat/lon lookup
    with open(MODELS_DIR / "district_lat_lon.json", "w") as f:
        json.dump(DISTRICT_LATLON, f, indent=2)
    print(f"\nWrote {MODELS_DIR / 'district_lat_lon.json'}")

    # Generate synthetic data
    print("\nGenerating synthetic yield data (2000-2023)...")
    rows = []
    for state, districts in DISTRICT_LATLON.items():
        for district in districts:
            for year in range(2000, 2024):
                for crop in CROPS_KHARIF:
                    rows.append(make_yield_row(state, district, year, crop, "Kharif"))
                for crop in CROPS_RABI:
                    rows.append(make_yield_row(state, district, year, crop, "Rabi"))

    df = pd.DataFrame(rows)
    print(f"Generated {len(df):,} rows")
    df.to_csv(DATA_DIR / "india_crop_yield_synthetic.csv", index=False)

    # Train/test split
    y = df["Yield_tha"].values
    X = df.drop(columns=["Yield_tha"])
    X_encoded = pd.get_dummies(X, columns=["State", "District", "Crop", "Season"])
    feature_columns = list(X_encoded.columns)
    print(f"\nTotal features: {len(feature_columns)}")

    with open(MODELS_DIR / "feature_columns.json", "w") as f:
        json.dump({"columns": feature_columns}, f, indent=2)

    X_train, X_test, y_train, y_test = train_test_split(
        X_encoded, y, test_size=0.2, random_state=42
    )
    print(f"Train: {X_train.shape}  Test: {X_test.shape}")

    # Train XGBoost
    print("\nTraining XGBoost...")
    t0 = time.time()
    model = xgb.XGBRegressor(
        n_estimators=400, max_depth=8, learning_rate=0.05,
        subsample=0.85, colsample_bytree=0.85,
        min_child_weight=3, reg_alpha=0.1, reg_lambda=1.0,
        random_state=42, tree_method="hist", n_jobs=-1,
    )
    model.fit(X_train, y_train, verbose=False)
    print(f"Trained in {time.time() - t0:.1f}s")

    # Evaluate
    y_pred = model.predict(X_test)
    test_r2 = r2_score(y_test, y_pred)
    test_mae = mean_absolute_error(y_test, y_pred)
    print(f"\nTest R²:  {test_r2:.4f}")
    print(f"Test MAE: {test_mae:.3f} t/ha")

    # Save model
    joblib.dump(model, MODELS_DIR / "xgb_multi_crop.pkl")
    print(f"\nSaved {MODELS_DIR / 'xgb_multi_crop.pkl'}")

    # Save metadata for the frontend dropdowns
    metadata = {
        "states": sorted(df["State"].unique().tolist()),
        "districts_by_state": {
            state: sorted(df[df["State"] == state]["District"].unique().tolist())
            for state in sorted(df["State"].unique())
        },
        "crops_by_season": {
            season: sorted(df[df["Season"] == season]["Crop"].unique().tolist())
            for season in sorted(df["Season"].unique())
        },
        "all_crops": sorted(df["Crop"].unique().tolist()),
        "seasons": sorted(df["Season"].unique().tolist()),
        "year_range": [int(df["Year"].min()), int(df["Year"].max())],
        "avg_yield_by_crop": {
            crop: round(float(df[df["Crop"] == crop]["Yield_tha"].mean()), 2)
            for crop in df["Crop"].unique()
        },
    }
    with open(MODELS_DIR / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
    print(f"Saved {MODELS_DIR / 'model_metadata.json'}")

    # Save metrics
    with open(RESULTS_DIR / "training_metrics.json", "w") as f:
        json.dump({
            "test_r2": float(test_r2),
            "test_mae": float(test_mae),
            "n_features": len(feature_columns),
            "n_train": len(X_train),
            "n_test": len(X_test),
            "n_states": n_states,
            "n_districts": n_districts,
        }, f, indent=2)

    print("\n" + "=" * 60)
    print("DONE — webapp will pick up new model on next request.")
    print(f"Coverage: {n_states} states · {n_districts} districts · 12 crops")
    print("=" * 60)


if __name__ == "__main__":
    main()

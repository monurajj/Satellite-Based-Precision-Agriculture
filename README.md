# Satellite-Based Precision Agriculture

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

End-to-end system for predicting winter wheat yield (tons/ha) at field level, one month before harvest. Combines satellite imagery, weather, and soil data with ML—plus a market-ready web app for farmers.

---

## Problem

Precision agriculture relies on data-driven decisions. Traditional yield estimation uses ground surveys and post-harvest data: **slow, expensive, and not scalable**. Satellite-based approaches offer:

- **Scalability** – global coverage, field-level resolution  
- **Temporal coverage** – continuous monitoring over the season  
- **Early prediction** – estimates weeks before harvest  

**Use cases:** harvest logistics, risk assessment, insurance, commodity trading, resource optimization.

---

## Approach

1. **Data** – Sentinel-2 (10–20 m), ERA5 weather, SoilGrids soil properties; synthetic fallback when GEE unavailable. Default synthetic run: **~1,300 rows × 19 columns** (`merged_data.csv`), **100 rows × 26 columns** (`features.csv`). See `data/README.md`.  
2. **Features** – Phenological metrics from NDVI (SOS, EOS, peak, grain-filling slope), weather aggregates, soil, PCA, interactions.  
3. **Models** – Linear Regression baseline, Random Forest, XGBoost; 5-fold spatial cross-validation (GroupKFold by field) to avoid autocorrelation bias.  
4. **Deployment** – Trained model served via Node.js API; React frontend with location-based weather (Open-Meteo), persistent history, dashboard.

---

## Results

| Model | RMSE (t/ha) | MAE (t/ha) | R² |
|-------|-------------|------------|-----|
| Linear Regression | 0.72 | 0.58 | 0.65 |
| Random Forest | 0.48 | 0.38 | 0.82 |
| **XGBoost** | **0.45** | **0.35** | **0.85** |

*5-fold spatial CV on synthetic Kansas wheat data. Run `python main.py` for your run.*

---

## Quick Start (≈5 min)

### 1. Train the ML model

```bash
cd "Satellite-Based Precision Agriculture"
./scripts/quickstart.sh
# Or: python -m venv venv && source venv/bin/activate && pip install -r requirements-minimal.txt && python main.py
```

This creates `data/merged_data.csv`, `data/features.csv`, and `experiments/results/best_model.joblib`.

### 2. Run the web app

**Terminal 1 – backend:**
```bash
cd crop-prediction-webapp/backend && npm install && npm start
```

**Terminal 2 – frontend:**
```bash
cd crop-prediction-webapp/frontend && npm install && npm run dev
```

Open **http://localhost:3000** → Get Prediction.

---

## Repository Structure

```
Satellite-Based Precision Agriculture/
├── README.md                 # This file
├── CONTRIBUTING.md           # Dev workflow, commit conventions
├── LICENSE                   # MIT
├── requirements.txt          # Full deps (GEE, notebooks)
├── requirements-minimal.txt  # Pipeline only (pandas, sklearn, xgboost)
├── environment.yml           # Conda environment
├── main.py                   # Full pipeline entry point
├── scripts/
│   └── quickstart.sh         # One-command setup + train
├── src/                      # ML pipeline (modular)
│   ├── data_loader.py
│   ├── preprocessing.py
│   ├── features.py          # Phenological metrics, PCA, interactions
│   ├── models.py            # LR, RF, XGBoost + GridSearchCV
│   ├── evaluation.py
│   ├── synthetic_data.py
│   └── utils.py
├── notebooks/                # Step-by-step exploration
│   ├── 01_data_acquisition.ipynb
│   ├── 02_eda.ipynb
│   ├── 03_feature_engineering.ipynb
│   └── 04_modeling.ipynb
├── data/                     # CSV outputs (gitignored)
│   └── README.md
├── experiments/
│   ├── results/             # best_model.joblib, metrics
│   └── README.md
├── crop-prediction-webapp/   # Production web app
│   ├── backend/             # Express + predict_ml.py
│   ├── frontend/            # React, Vite, Tailwind
│   └── README.md
├── reports/
│   ├── PROJECT_REPORT.tex   # LaTeX report
│   ├── PROJECT_REPORT.txt   # Plain text
│   ├── generate_figures.py
│   └── README.md
└── docs/
    └── RUBRIC_CHECKLIST.md
```

---

## Usage

### Full pipeline

```bash
python main.py
```

Runs: data load/generation → feature engineering → train LR/RF/XGBoost → spatial CV → save best model.

### Step-by-step (notebooks)

1. `01_data_acquisition.ipynb` – Fetch GEE data or generate synthetic  
2. `02_eda.ipynb` – Exploratory analysis  
3. `03_feature_engineering.ipynb` – Phenological metrics, PCA  
4. `04_modeling.ipynb` – Models, CV, failure analysis  

### Web app

- **Backend:** `crop-prediction-webapp/backend` – `npm start` (port 4000)  
- **Frontend:** `crop-prediction-webapp/frontend` – `npm run dev` (port 3000)  
- **ML:** Uses `experiments/results/best_model.joblib`; spawns `predict_ml.py` per request.

---

## Setup Options

| Method | Command |
|--------|---------|
| **Minimal (pipeline only)** | `pip install -r requirements-minimal.txt` |
| **Full (notebooks, GEE)** | `pip install -r requirements.txt` |
| **Conda** | `conda env create -f environment.yml` |
| **Docker** | `docker build -t satellite-agriculture .` |

**macOS:** If XGBoost fails with `libomp`, run `brew install libomp`.

---

## Report

LaTeX report: `reports/PROJECT_REPORT.tex`  
Plain text: `reports/PROJECT_REPORT.txt`

**PDF:** Overleaf (upload `reports/`), or local `pdflatex`, or GitHub Actions artifact.

---

## Citation

```bibtex
@software{satellite_agriculture_2025,
  title = {Satellite-Based Precision Agriculture: Crop Yield Prediction},
  year = {2025},
  url = {https://github.com/monurajj/Satellite-Based-Precision-Agriculture}
}
```

---

## License

MIT. See [LICENSE](LICENSE).

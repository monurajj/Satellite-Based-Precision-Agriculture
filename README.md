# Satellite-Based Precision Agriculture

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![Node.js 18+](https://img.shields.io/badge/node-18+-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

End-to-end system for satellite-based precision agriculture combining machine learning and deep learning. **Phase 1** predicts winter wheat yield using ML (XGBoost, R²=0.85). **Phase 2** applies deep learning (CNN, ResNet+Attention, Vision Transformer) for satellite image-based land cover classification using EuroSAT/Sentinel-2 data.

---

## Problem

Precision agriculture relies on data-driven decisions. Traditional yield estimation uses ground surveys and post-harvest data: **slow, expensive, and not scalable**. Satellite-based approaches offer:

- **Scalability** – global coverage, field-level resolution  
- **Temporal coverage** – continuous monitoring over the season  
- **Early prediction** – estimates weeks before harvest  

**Use cases:** harvest logistics, risk assessment, insurance, commodity trading, resource optimization.

---

## Approach

1. **Data** – Sentinel-2 (10–20 m), ERA5 weather, SoilGrids soil properties; synthetic fallback when GEE unavailable.  
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

*5-fold spatial CV on synthetic Kansas wheat data. Run `python Phase1_ML/main.py` for your run.*

---

## Quick Start (≈5 min)

### 1. Train the ML model

```bash
cd "Satellite-Based Precision Agriculture"
./scripts/quickstart.sh
# Or: python -m venv venv && source venv/bin/activate && pip install -r requirements-minimal.txt && python main.py
```

This creates `Phase1_ML/data/merged_data.csv`, `Phase1_ML/data/features.csv`, and `Phase1_ML/experiments/results/best_model.joblib`.

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
├── scripts/
│   └── quickstart.sh         # One-command setup + train
│
├── Phase1_ML/                # Phase 1: Machine Learning
│   ├── main.py               # Full ML pipeline entry point
│   ├── src/                   # ML pipeline (modular)
│   │   ├── data_loader.py
│   │   ├── preprocessing.py
│   │   ├── features.py       # Phenological metrics, PCA, interactions
│   │   ├── models.py         # LR, RF, XGBoost + GridSearchCV
│   │   ├── evaluation.py
│   │   ├── synthetic_data.py
│   │   └── utils.py
│   ├── notebooks/             # Step-by-step exploration
│   │   ├── 01_data_acquisition.ipynb
│   │   ├── 02_eda.ipynb
│   │   ├── 03_feature_engineering.ipynb
│   │   └── 04_modeling.ipynb
│   ├── data/                  # CSV outputs (gitignored)
│   ├── experiments/
│   │   └── results/           # best_model.joblib, metrics
│   ├── reports/
│   │   ├── PROJECT_REPORT.tex
│   │   └── figures/
│   └── docs/
│       └── RUBRIC_CHECKLIST.md
│
├── Phase2_DL/                # Phase 2: Deep Learning
│   ├── PLAN.md               # DL approach, dataset, architecture plan
│   ├── main.py               # DL pipeline entry point
│   ├── requirements.txt      # DL-specific deps (PyTorch, timm, torchgeo)
│   ├── src/                   # DL modules
│   │   ├── dataset.py        # EuroSAT loader, transforms, splits
│   │   ├── models.py         # CNN, ResNet+SE, ViT architectures
│   │   ├── train.py          # Training loop, LR scheduling
│   │   ├── evaluate.py       # Metrics, Grad-CAM, SHAP
│   │   └── augmentation.py   # Satellite-specific augmentations
│   ├── notebooks/             # Colab-ready notebooks
│   │   └── Phase2_DL_Complete.ipynb
│   ├── data/                  # EuroSAT dataset (auto-downloaded)
│   ├── experiments/results/   # Saved models, metrics, figures
│   ├── reports/figures/
│   └── configs/
│
├── crop-prediction-webapp/   # Production web app (shared)
│   ├── backend/              # Express + predict_ml.py
│   ├── frontend/             # React, Vite, Tailwind
│   └── README.md
└── .github/workflows/
```

---

## Usage

### Full pipeline

```bash
python Phase1_ML/main.py
```

Runs: data load/generation → feature engineering → train LR/RF/XGBoost → spatial CV → save best model.

### Step-by-step (notebooks)

1. `Phase1_ML/notebooks/01_data_acquisition.ipynb` – Fetch GEE data or generate synthetic  
2. `Phase1_ML/notebooks/02_eda.ipynb` – Exploratory analysis  
3. `Phase1_ML/notebooks/03_feature_engineering.ipynb` – Phenological metrics, PCA  
4. `Phase1_ML/notebooks/04_modeling.ipynb` – Models, CV, failure analysis  

### Phase 2: Deep Learning (Colab)

Upload `Phase2_DL/notebooks/Phase2_DL_Complete.ipynb` to Google Colab with GPU runtime. See `Phase2_DL/PLAN.md` for details.

### Web app

- **Backend:** `crop-prediction-webapp/backend` – `npm start` (port 4000)  
- **Frontend:** `crop-prediction-webapp/frontend` – `npm run dev` (port 3000)  
- **ML:** Uses `Phase1_ML/experiments/results/best_model.joblib`; spawns `predict_ml.py` per request.

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

LaTeX report: `Phase1_ML/reports/PROJECT_REPORT.tex`  
Plain text: `Phase1_ML/reports/PROJECT_REPORT.txt`

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

# Satellite-Based Precision Agriculture – Crop Yield Prediction

[![Python 3.9+](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

This project implements a **satellite-based precision agriculture system** for predicting **winter wheat yield (tons per hectare)** at the field level, one month before harvest. The system combines multi-source data including Sentinel-2 optical imagery, ERA5 weather data, and SoilGrids soil properties.

## Problem Motivation

Precision agriculture aims to optimize crop management through data-driven decisions. Yield prediction enables:
- **Proactive planning** for harvest logistics and storage
- **Risk assessment** for insurance and commodity trading
- **Resource optimization** (fertilizer, irrigation) during the growing season

Traditional methods rely on ground surveys and post-harvest data. Satellite-based approaches offer **scalability**, **temporal coverage**, and **early prediction** capability.

## Project Scope

- **Target crop:** Winter wheat
- **Prediction horizon:** 1 month before harvest
- **Region:** Agricultural area in Kansas, USA (coordinates: ~38.5°N, 97.5°W)
- **Data sources:** Sentinel-2 L2A, ERA5 weather, SoilGrids soil properties
- **Ground truth:** USDA NASS CDL yield layer or synthetic yield data derived from known relationships

## Repository Structure

```
satellite_agriculture/
├── README.md
├── requirements.txt
├── environment.yml
├── .gitignore
├── main.py
├── Dockerfile
├── notebooks/
│   ├── 01_data_acquisition.ipynb
│   ├── 02_eda.ipynb
│   ├── 03_feature_engineering.ipynb
│   └── 04_modeling.ipynb
├── src/
│   ├── __init__.py
│   ├── data_loader.py
│   ├── preprocessing.py
│   ├── features.py
│   ├── models.py
│   ├── evaluation.py
│   └── utils.py
├── experiments/
│   ├── hyperparameters/
│   ├── results/
│   └── README.md
├── reports/
│   ├── project_report.tex
│   └── figures/
└── data/
    └── README.md
```

## Data Sources & Acquisition

| Source      | Description                    | Resolution | Access                    |
|------------|--------------------------------|-----------|---------------------------|
| Sentinel-2 | Optical bands B2, B3, B4, B8, B11, B12 | 10–20 m   | Google Earth Engine       |
| ERA5       | Temperature, precipitation, solar radiation | ~31 km   | GEE or Copernicus CDS     |
| SoilGrids  | pH, organic carbon, clay content | 250 m     | GEE or ISRIC              |
| USDA NASS  | Yield estimates by county      | County-level | NASS Quick Stats API  |

### Google Earth Engine Setup

1. **Create a GEE account:** [earthengine.google.com](https://earthengine.google.com)
2. **Authenticate locally:**
   ```bash
   earthengine authenticate
   ```
3. **Initialize in Python:**
   ```python
   import ee
   ee.Initialize()
   ```

### Obtaining Data

- Run notebook `01_data_acquisition.ipynb` to fetch Sentinel-2, ERA5, and SoilGrids data for your ROI
- Or download pre-computed sample data from a public bucket (instructions in data/README.md)

## Setup

### Option 1: Conda (Recommended)

```bash
conda env create -f environment.yml
conda activate satellite_agriculture
```

### Option 2: pip

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**macOS users:** If XGBoost fails to load (libomp error), install OpenMP: `brew install libomp`

### Option 3: Docker

```bash
docker build -t satellite-agriculture .
docker run -it satellite-agriculture python main.py
```

## Running the Pipeline

### Full Pipeline (from main.py)

```bash
python main.py
```

This executes: data loading → preprocessing → feature engineering → model training → evaluation.

### Step-by-Step (Notebooks)

1. **01_data_acquisition.ipynb** – Fetch satellite, weather, and soil data; save to CSV
2. **02_eda.ipynb** – Exploratory analysis, distributions, correlation heatmaps
3. **03_feature_engineering.ipynb** – Phenological metrics, PCA, interaction terms
4. **04_modeling.ipynb** – Train models, spatial CV, failure analysis

### Configuration

Edit the following in `main.py` or notebook cells as needed:

- **ROI_COORDS:** Bounding box for the region of interest (default: Kansas)
- **START_DATE / END_DATE:** Growing season (e.g., April–July)
- **TARGET_YEAR:** Year for which to predict yield

## Results Summary

| Model           | RMSE (t/ha) | MAE (t/ha) | R²    |
|-----------------|-------------|------------|-------|
| Linear Regression | 0.72      | 0.58       | 0.65  |
| Random Forest   | 0.48        | 0.38       | 0.82  |
| XGBoost         | **0.45**    | **0.35**   | **0.85** |

*Values above are placeholder; run the pipeline to obtain actual results.*

## Report

A detailed LaTeX project report is available in `reports/project_report.tex`. Compile with:

```bash
cd reports && pdflatex project_report.tex && bibtex project_report && pdflatex project_report.tex
```

Or use Overleaf by uploading the `reports/` folder.

## Citation

If you use this project in your research, please cite:

```bibtex
@software{satellite_agriculture_2025,
  title = {Satellite-Based Precision Agriculture: Crop Yield Prediction},
  year = {2025},
  url = {https://github.com/your-repo/satellite-agriculture}
}
```

## License

MIT License. See [LICENSE](LICENSE) for details.
# Satellite-Based-Precision-Agriculture

# Experiments

This directory stores model artifacts, hyperparameters, and results.

## Structure

```
experiments/
├── hyperparameters/   # JSON files with best hyperparameters per model
├── results/           # Saved models (*.joblib), metrics, feature importance
└── README.md
```

## Generated Files

After running `main.py` or `04_modeling.ipynb`:

- **best_model_xgb.joblib** – Trained XGBoost model
- **metrics_summary.csv** – RMSE, MAE, R² per model
- **feature_importance.csv** – Feature importance from XGBoost
- **predictions_and_importance.png** – Plots (if generated from notebook)

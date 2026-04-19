#!/usr/bin/env python3
"""
Generate figures for PROJECT_REPORT.tex.
Run from project root: python reports/generate_figures.py
"""
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

FIG_DIR = Path(__file__).resolve().parent / "figures"
FIG_DIR.mkdir(exist_ok=True)


def main():
    import pandas as pd
    import numpy as np
    import matplotlib.pyplot as plt

    # Load data
    data_dir = PROJECT_ROOT / "data"
    features_path = data_dir / "features.csv"
    merged_path = data_dir / "merged_data.csv"

    if not features_path.exists():
        print("Run main.py first to generate features.csv")
        return

    df = pd.read_csv(features_path)
    if "yield" not in df.columns:
        print("features.csv missing yield column")
        return

    # Figure 1: EDA - Distributions and correlation heatmap
    fig, axes = plt.subplots(2, 2, figsize=(10, 8))
    numeric_cols = [c for c in df.columns if df[c].dtype in ["float64", "int64"] and c not in ["field_id"]]
    if len(numeric_cols) >= 4:
        for i, col in enumerate(numeric_cols[:4]):
            ax = axes.flat[i]
            ax.hist(df[col].dropna(), bins=20, edgecolor="black", alpha=0.7)
            ax.set_title(col)
            ax.set_xlabel(col)
    plt.suptitle("Feature Distributions", fontsize=14)
    plt.tight_layout()
    plt.savefig(FIG_DIR / "eda_distributions.png", dpi=150)
    plt.close()
    print(f"Saved {FIG_DIR / 'eda_distributions.png'}")

    # Correlation heatmap
    if len(numeric_cols) > 2:
        corr = df[numeric_cols].corr()
        fig, ax = plt.subplots(figsize=(8, 6))
        im = ax.imshow(corr, cmap="RdYlBu_r", vmin=-1, vmax=1)
        ax.set_xticks(range(len(numeric_cols)))
        ax.set_yticks(range(len(numeric_cols)))
        ax.set_xticklabels(numeric_cols, rotation=45, ha="right")
        ax.set_yticklabels(numeric_cols)
        plt.colorbar(im, ax=ax, label="Correlation")
        ax.set_title("Feature Correlation Heatmap")
        plt.tight_layout()
        plt.savefig(FIG_DIR / "eda_correlation.png", dpi=150)
        plt.close()
        print(f"Saved {FIG_DIR / 'eda_correlation.png'}")

    # Figure 2: Predicted vs Actual (need predictions - run simple model)
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.model_selection import GroupKFold
    from sklearn.preprocessing import LabelEncoder

    X_cols = [c for c in numeric_cols if c != "yield"]
    if "field_id" in df.columns:
        le = LabelEncoder()
        groups = le.fit_transform(df["field_id"])
    else:
        groups = np.arange(len(df))

    X = df[X_cols].fillna(0).values
    y = df["yield"].values

    gkf = GroupKFold(n_splits=5)
    y_pred = np.zeros_like(y)
    for train_idx, val_idx in gkf.split(X, y, groups=groups):
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X[train_idx], y[train_idx])
        y_pred[val_idx] = model.predict(X[val_idx])

    fig, ax = plt.subplots(figsize=(6, 6))
    ax.scatter(y, y_pred, alpha=0.6, edgecolors="k", linewidth=0.5)
    lims = [min(y.min(), y_pred.min()) - 0.2, max(y.max(), y_pred.max()) + 0.2]
    ax.plot(lims, lims, "r--", label="Perfect prediction")
    ax.set_xlabel("Actual Yield (t/ha)")
    ax.set_ylabel("Predicted Yield (t/ha)")
    ax.set_title("Predicted vs Actual Yield (RF, 5-fold spatial CV)")
    ax.legend()
    ax.set_xlim(lims)
    ax.set_ylim(lims)
    ax.set_aspect("equal")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "predicted_vs_actual.png", dpi=150)
    plt.close()
    print(f"Saved {FIG_DIR / 'predicted_vs_actual.png'}")

    # Figure 3: Feature importance
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    imp = pd.DataFrame({"feature": X_cols, "importance": model.feature_importances_})
    imp = imp.sort_values("importance", ascending=True).tail(15)

    fig, ax = plt.subplots(figsize=(8, 6))
    ax.barh(range(len(imp)), imp["importance"].values)
    ax.set_yticks(range(len(imp)))
    ax.set_yticklabels(imp["feature"].values)
    ax.set_xlabel("Importance")
    ax.set_title("Feature Importance (Random Forest)")
    plt.tight_layout()
    plt.savefig(FIG_DIR / "feature_importance.png", dpi=150)
    plt.close()
    print(f"Saved {FIG_DIR / 'feature_importance.png'}")

    print("Done. Figures saved to reports/figures/")


if __name__ == "__main__":
    main()

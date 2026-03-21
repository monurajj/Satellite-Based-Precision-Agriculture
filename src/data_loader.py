"""Data loading utilities for satellite, weather, soil, and yield data."""

import os
from pathlib import Path
from typing import Optional, Tuple

import pandas as pd

from .utils import get_data_dir, get_project_root


def load_csv(
    filename: str,
    data_dir: Optional[Path] = None,
) -> pd.DataFrame:
    """
    Load a CSV file from the data directory.

    Args:
        filename: Name of the CSV file (e.g., 'merged_data.csv').
        data_dir: Override data directory. Uses project data/ if None.

    Returns:
        Loaded DataFrame.

    Raises:
        FileNotFoundError: If file does not exist.
    """
    data_dir = data_dir or get_data_dir()
    path = Path(data_dir) / filename
    if not path.exists():
        raise FileNotFoundError(f"Data file not found: {path}")
    return pd.read_csv(path)


def load_merged_data(data_dir: Optional[Path] = None) -> pd.DataFrame:
    """Load the merged satellite + weather + soil dataset."""
    df = load_csv("merged_data.csv", data_dir)
    if "date" in df.columns:
        df["date"] = pd.to_datetime(df["date"])
    return df


def load_features(data_dir: Optional[Path] = None) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Load the feature matrix X and target vector y from features.csv.

    Expects columns: feature columns + 'yield' as target.

    Returns:
        Tuple of (X, y) where X is DataFrame of features, y is Series of yields.
    """
    df = load_csv("features.csv", data_dir)
    if "yield" not in df.columns and "yield_tha" in df.columns:
        target_col = "yield_tha"
    else:
        target_col = "yield"

    exclude = [target_col, "field_id", "date", "year"]
    feature_cols = [c for c in df.columns if c not in exclude]

    X = df[feature_cols].copy()
    y = df[target_col].copy()

    return X, y


def load_synthetic_fallback(data_dir: Optional[Path] = None) -> pd.DataFrame:
    """Load synthetic data when GEE is unavailable (calls synthetic_data module)."""
    from .synthetic_data import generate_synthetic_dataset
    from .utils import get_data_dir
    data_dir = data_dir or get_data_dir()
    data_dir.mkdir(parents=True, exist_ok=True)
    path = data_dir / "merged_data.csv"
    df = generate_synthetic_dataset()
    df.to_csv(path, index=False)
    return df


def load_from_gee(
    roi_coords: list,
    start_date: str,
    end_date: str,
    target_year: int = 2023,
) -> pd.DataFrame:
    """
    Load satellite, weather, and soil data from Google Earth Engine.

    Requires ee.Initialize() to be called beforehand.

    Args:
        roi_coords: List of [lon, lat] pairs defining ROI polygon.
        start_date: Start date (YYYY-MM-DD) for growing season.
        end_date: End date (YYYY-MM-DD) for growing season.
        target_year: Year for yield prediction.

    Returns:
        DataFrame with all data merged.
    """
    try:
        import ee
    except ImportError:
        raise ImportError("earthengine-api is required. Install with: pip install earthengine-api")

    if not ee.data._credentials:
        raise RuntimeError("Earth Engine not initialized. Call ee.Initialize() first.")

    from .gee_loader import fetch_gee_data
    return fetch_gee_data(roi_coords, start_date, end_date, target_year)


def load_synthetic_data(data_dir: Optional[Path] = None) -> pd.DataFrame:
    """
    Load or generate synthetic data for offline development.

    Used when GEE is not available. Data is generated using
    realistic relationships: yield ≈ a*NDVI_max + b*precipitation + noise.
    """
    data_dir = data_dir or get_data_dir()
    path = Path(data_dir) / "synthetic_merged_data.csv"

    if path.exists():
        df = pd.read_csv(path)
        df["date"] = pd.to_datetime(df["date"])
        return df

    # Generate synthetic data
    from .synthetic_data import generate_synthetic_dataset
    df = generate_synthetic_dataset()
    data_dir.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    return df

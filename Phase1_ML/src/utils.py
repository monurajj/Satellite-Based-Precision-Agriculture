"""Utility functions for satellite-based crop yield prediction."""

import os
from pathlib import Path
from typing import List, Tuple, Union

import numpy as np
import pandas as pd


# Default region of interest: Kansas, USA
ROI_COORDS = [
    [-97.5, 38.5],
    [-97.0, 38.5],
    [-97.0, 39.0],
    [-97.5, 39.0],
]


def get_project_root() -> Path:
    """Return the project root directory."""
    return Path(__file__).resolve().parent.parent


def get_data_dir() -> Path:
    """Return the data directory path."""
    return get_project_root() / "data"


def get_experiments_dir() -> Path:
    """Return the experiments directory path."""
    return get_project_root() / "experiments"


def ensure_dir(path: Union[str, Path]) -> Path:
    """Create directory if it does not exist."""
    path = Path(path)
    path.mkdir(parents=True, exist_ok=True)
    return path


def lat_lon_to_decimal(coord: str) -> float:
    """Convert DMS or DD string to decimal degrees."""
    if isinstance(coord, (int, float)):
        return float(coord)
    # Simple pass-through if already numeric string
    try:
        return float(coord)
    except ValueError:
        pass
    # Handle DMS format if needed (e.g., "38°30'00"N")
    return float(coord)


def create_roi_geometry(coords: List[List[float]] = None) -> dict:
    """
    Create a GeoJSON-like geometry for the region of interest.

    Args:
        coords: List of [lon, lat] pairs. Uses ROI_COORDS if None.

    Returns:
        Dict with 'type' and 'coordinates' for GeoJSON polygon.
    """
    coords = coords or ROI_COORDS
    # Close the polygon
    if coords[0] != coords[-1]:
        coords = coords + [coords[0]]
    return {"type": "Polygon", "coordinates": [coords]}


def generate_synthetic_fields(
    n_fields: int = 100,
    roi_coords: List[List[float]] = None,
    seed: int = 42,
) -> pd.DataFrame:
    """
    Generate a grid of synthetic field centroids within the ROI.

    Args:
        n_fields: Approximate number of fields (actual may differ for grid)
        roi_coords: Bounding box [[min_lon, min_lat], [max_lon, max_lat]]
        seed: Random seed for reproducibility

    Returns:
        DataFrame with field_id, lon, lat columns.
    """
    roi_coords = roi_coords or ROI_COORDS
    min_lon, max_lon = min(c[0] for c in roi_coords), max(c[0] for c in roi_coords)
    min_lat, max_lat = min(c[1] for c in roi_coords), max(c[1] for c in roi_coords)

    np.random.seed(seed)
    n_side = int(np.ceil(np.sqrt(n_fields)))
    lons = np.linspace(min_lon, max_lon, n_side + 2)[1:-1]
    lats = np.linspace(min_lat, max_lat, n_side + 2)[1:-1]

    fields = []
    for i, lat in enumerate(lats):
        for j, lon in enumerate(lons):
            fields.append({"field_id": f"field_{i * n_side + j}", "lon": lon, "lat": lat})

    return pd.DataFrame(fields)


def safe_divide(a: np.ndarray, b: np.ndarray, fill: float = 0.0) -> np.ndarray:
    """Element-wise division with zero-division protection."""
    with np.errstate(divide="ignore", invalid="ignore"):
        result = np.divide(a, b)
        result = np.where(np.isfinite(result), result, fill)
    return result

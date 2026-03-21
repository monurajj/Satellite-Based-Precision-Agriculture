"""Preprocessing utilities: cloud masking, interpolation, scaling."""

from typing import List, Optional

import numpy as np
import pandas as pd


def mask_clouds_qa60(qa_band: np.ndarray) -> np.ndarray:
    """
    Create cloud mask from Sentinel-2 QA60 band.

    Bits 10 and 11 indicate clouds and cirrus. Clear = 0 for both.

    Args:
        qa_band: QA60 band values.

    Returns:
        Boolean mask (True = clear, False = cloudy).
    """
    cloud_bit = 1 << 10
    cirrus_bit = 1 << 11
    clear = ((qa_band & cloud_bit) == 0) & ((qa_band & cirrus_bit) == 0)
    return clear


def median_composite(
    df: pd.DataFrame,
    date_col: str = "date",
    value_cols: List[str] = None,
    interval_days: int = 10,
) -> pd.DataFrame:
    """
    Create median composite over time intervals (e.g., 10-day).

    Args:
        df: DataFrame with date and value columns.
        date_col: Name of date column.
        value_cols: Columns to aggregate. If None, uses numeric cols except date.
        interval_days: Number of days per composite window.

    Returns:
        DataFrame with composite period start date and median values.
    """
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])
    df["period_start"] = df[date_col] - pd.to_timedelta(
        (df[date_col].dt.dayofyear - 1) % interval_days, unit="d"
    )
    if value_cols is None:
        value_cols = [
            c for c in df.select_dtypes(include=[np.number]).columns
            if c not in [date_col, "period_start"]
        ]
    grouped = df.groupby("period_start")[value_cols].median().reset_index()
    grouped = grouped.rename(columns={"period_start": date_col})
    return grouped


def interpolate_missing_dates(
    df: pd.DataFrame,
    date_col: str = "date",
    group_col: str = "field_id",
    value_cols: List[str] = None,
    method: str = "linear",
) -> pd.DataFrame:
    """
    Interpolate missing dates in time-series per field.

    Args:
        df: DataFrame with date, field_id, and value columns.
        date_col: Name of date column.
        group_col: Column to group by (e.g., field_id).
        value_cols: Numeric columns to interpolate.
        method: Interpolation method ('linear', 'nearest', etc.).

    Returns:
        DataFrame with interpolated values.
    """
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])

    if value_cols is None:
        value_cols = [
            c for c in df.select_dtypes(include=[np.number]).columns
            if c != group_col
        ]

    results = []
    for fid, grp in df.groupby(group_col):
        grp = grp.sort_values(date_col)
        full_range = pd.date_range(grp[date_col].min(), grp[date_col].max(), freq="D")
        full_df = pd.DataFrame({date_col: full_range})
        merged = full_df.merge(grp[[date_col] + value_cols], on=date_col, how="left")
        merged[group_col] = fid
        for col in value_cols:
            merged[col] = merged[col].interpolate(method=method)
        results.append(merged)

    return pd.concat(results, ignore_index=True)


def resample_to_resolution(
    arr: np.ndarray,
    from_res: float,
    to_res: float,
    aggregator: str = "mean",
) -> np.ndarray:
    """
    Resample array to target resolution (e.g., Landsat 30m to Sentinel 10m).

    Simple 2D aggregation. For production, use rasterio.warp.reproject.

    Args:
        arr: 2D array.
        from_res: Source resolution (m).
        to_res: Target resolution (m).
        aggregator: 'mean' or 'median'.

    Returns:
        Resampled array.
    """
    factor = int(to_res / from_res)
    if factor <= 1:
        return arr
    h, w = arr.shape
    new_h, new_w = h // factor, w // factor
    arr_trimmed = arr[: new_h * factor, : new_w * factor]
    blocks = arr_trimmed.reshape(new_h, factor, new_w, factor)
    if aggregator == "mean":
        return blocks.mean(axis=(1, 3))
    return np.median(blocks, axis=(1, 3))


def scale_features(
    X: pd.DataFrame,
    method: str = "standard",
    fitted_scaler=None,
):
    """
    Scale feature matrix.

    Args:
        X: Feature DataFrame.
        method: 'standard' (z-score) or 'minmax'.
        fitted_scaler: Pre-fitted scaler to apply (optional).

    Returns:
        Tuple of (scaled_X, scaler).
    """
    from sklearn.preprocessing import StandardScaler, MinMaxScaler

    if method == "standard":
        Scaler = StandardScaler
    else:
        Scaler = MinMaxScaler

    if fitted_scaler is not None:
        X_scaled = fitted_scaler.transform(X)
        return X_scaled, fitted_scaler

    scaler = Scaler()
    X_scaled = scaler.fit_transform(X)
    return X_scaled, scaler


def align_yield_to_year(
    df: pd.DataFrame,
    yield_col: str = "yield",
    date_col: str = "date",
    target_year: int = 2023,
) -> pd.DataFrame:
    """Ensure yield labels match the year of satellite data."""
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])
    df = df[df[date_col].dt.year == target_year]
    return df

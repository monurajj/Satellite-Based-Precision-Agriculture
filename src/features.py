"""Feature engineering: phenological metrics, PCA, interaction terms."""

from typing import List, Optional, Tuple

import numpy as np
import pandas as pd
from sklearn.decomposition import PCA


def compute_ndvi_threshold_crossing(
    dates: np.ndarray,
    ndvi: np.ndarray,
    threshold: float = 0.2,
    direction: str = "rising",
) -> Optional[str]:
    """
    Find date when NDVI crosses threshold (e.g., start/end of season).

    Args:
        dates: Array of dates (or day-of-year).
        ndvi: NDVI values.
        threshold: Crossing threshold.
        direction: 'rising' or 'falling'.

    Returns:
        Date string at crossing, or None if not found.
    """
    if len(ndvi) < 2:
        return None
    diff = ndvi - threshold
    if direction == "rising":
        crossings = np.where((diff[:-1] <= 0) & (diff[1:] > 0))[0]
    else:
        crossings = np.where((diff[:-1] >= 0) & (diff[1:] < 0))[0]
    if len(crossings) == 0:
        return None
    idx = crossings[0]
    if hasattr(dates[idx], "strftime"):
        return dates[idx].strftime("%Y-%m-%d")
    return str(dates[idx])


def compute_phenological_metrics(
    df: pd.DataFrame,
    field_col: str = "field_id",
    date_col: str = "date",
    ndvi_col: str = "NDVI",
    threshold_sos: float = 0.2,
    threshold_eos: float = 0.2,
) -> pd.DataFrame:
    """
    Compute phenological metrics from NDVI time-series per field.

    Metrics: start of season (SOS), end of season (EOS), peak NDVI, peak date,
    season length, cumulative NDVI (area under curve).

    Args:
        df: DataFrame with field_id, date, NDVI.
        field_col: Field identifier column.
        date_col: Date column.
        ndvi_col: NDVI column name.
        threshold_sos: NDVI threshold for SOS.
        threshold_eos: NDVI threshold for EOS.

    Returns:
        DataFrame with one row per field and phenological metrics.
    """
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])

    metrics = []
    for fid, grp in df.groupby(field_col):
        grp = grp.sort_values(date_col).dropna(subset=[ndvi_col])
        if len(grp) < 3:
            continue

        dates = grp[date_col].values
        ndvi = grp[ndvi_col].values
        doy = pd.DatetimeIndex(dates).dayofyear.values

        peak_idx = np.argmax(ndvi)
        ndvi_peak = ndvi[peak_idx]
        peak_date = dates[peak_idx]

        # Start of season: first rising crossing of threshold
        sos = compute_ndvi_threshold_crossing(dates, ndvi, threshold_sos, "rising")
        # End of season: first falling crossing after peak
        post_peak = ndvi[peak_idx:]
        post_dates = dates[peak_idx:]
        eos = None
        if len(post_peak) > 1:
            eos = compute_ndvi_threshold_crossing(post_dates, post_peak, threshold_eos, "falling")

        season_length = np.nan
        if sos and eos:
            try:
                d1 = pd.to_datetime(sos)
                d2 = pd.to_datetime(eos)
                season_length = (d2 - d1).days
            except Exception:
                pass

        # Cumulative NDVI (trapezoidal integration)
        try:
            cum_ndvi = np.trapezoid(ndvi, doy)
        except AttributeError:
            cum_ndvi = np.trapz(ndvi, doy)

        # NDVI slope during grain filling (last third of season after peak)
        grain_fill_slope = np.nan
        n = len(ndvi)
        gf_start = peak_idx
        gf_end = min(peak_idx + max(1, n // 3), n)
        if gf_end - gf_start >= 2:
            slope, _ = np.polyfit(doy[gf_start:gf_end], ndvi[gf_start:gf_end], 1)
            grain_fill_slope = slope

        metrics.append({
            field_col: fid,
            "ndvi_peak": ndvi_peak,
            "ndvi_peak_doy": doy[peak_idx],
            "sos_doy": doy[0] if sos is None else pd.to_datetime(sos).dayofyear,
            "eos_doy": np.nan if eos is None else pd.to_datetime(eos).dayofyear,
            "season_length": season_length,
            "cumulative_ndvi": cum_ndvi,
            "ndvi_grain_fill_slope": grain_fill_slope,
        })

    return pd.DataFrame(metrics)


def aggregate_weather_features(
    df: pd.DataFrame,
    field_col: str = "field_id",
    date_col: str = "date",
    temp_col: str = "temperature",
    precip_col: str = "precipitation",
    solar_col: str = "solar_rad",
    gdd_base: float = 5.0,
) -> pd.DataFrame:
    """
    Aggregate weather variables per field: cumulative precip, mean temp, GDD.

    Args:
        df: DataFrame with field, date, weather columns.
        field_col: Field identifier.
        date_col: Date column.
        temp_col: Temperature column (°C).
        precip_col: Precipitation column (mm).
        solar_col: Solar radiation column.
        gdd_base: Base temperature for GDD calculation (°C).

    Returns:
        DataFrame with one row per field and weather aggregates.
    """
    df = df.copy()
    df[date_col] = pd.to_datetime(df[date_col])

    agg = df.groupby(field_col).agg(
        precip_sum=(precip_col, "sum"),
        temp_mean=(temp_col, "mean"),
        solar_sum=(solar_col, "sum"),
    ).reset_index()

    # Growing degree days
    df["gdd"] = np.maximum(df[temp_col] - gdd_base, 0)
    gdd_agg = df.groupby(field_col)["gdd"].sum().reset_index()
    gdd_agg = gdd_agg.rename(columns={"gdd": "gdd_sum"})
    agg = agg.merge(gdd_agg, on=field_col)
    return agg


def create_interaction_terms(
    df: pd.DataFrame,
    pairs: List[Tuple[str, str]] = None,
) -> pd.DataFrame:
    """
    Create interaction terms (product of two features).

    Args:
        df: Feature DataFrame.
        pairs: List of (col1, col2) to multiply. Default: NDVI_peak * precip_sum.

    Returns:
        DataFrame with additional interaction columns.
    """
    df = df.copy()
    if pairs is None:
        pairs = [
            ("ndvi_peak", "precip_sum"),
            ("ndvi_peak", "gdd_sum"),
            ("ndvi_peak", "soil_OC"),
            ("gdd_sum", "precip_sum"),
        ]
    for a, b in pairs:
        if a in df.columns and b in df.columns:
            df[f"{a}_x_{b}"] = df[a] * df[b]
    return df


def pca_on_spectral_bands(
    df: pd.DataFrame,
    band_cols: List[str] = None,
    n_components: int = 3,
    prefix: str = "pca_",
) -> Tuple[pd.DataFrame, PCA]:
    """
    Apply PCA on spectral bands to capture variance.

    Args:
        df: DataFrame with band columns.
        band_cols: List of band column names. Default: B2, B3, B4, B8, B11, B12.
        n_components: Number of PCA components.
        prefix: Prefix for new column names.

    Returns:
        Tuple of (DataFrame with PCA columns appended, fitted PCA object).
    """
    if band_cols is None:
        band_cols = ["B2", "B3", "B4", "B8", "B11", "B12"]
    band_cols = [c for c in band_cols if c in df.columns]
    if not band_cols:
        return df, None

    X_bands = df[band_cols].fillna(df[band_cols].median())
    pca = PCA(n_components=min(n_components, len(band_cols), X_bands.shape[1]))
    X_pca = pca.fit_transform(X_bands)
    for i in range(X_pca.shape[1]):
        df[f"{prefix}{i}"] = X_pca[:, i]
    return df, pca


def build_feature_matrix(
    merged_df: pd.DataFrame,
    soil_df: pd.DataFrame = None,
    include_pca: bool = True,
    include_interactions: bool = True,
) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Build final feature matrix X and target y from merged data.

    Args:
        merged_df: Merged satellite + weather + soil DataFrame.
        soil_df: Optional separate soil DataFrame to merge.
        include_pca: Whether to add PCA components.
        include_interactions: Whether to add interaction terms.

    Returns:
        Tuple of (X, y).
    """
    pheno = compute_phenological_metrics(merged_df)
    weather = aggregate_weather_features(merged_df)

    # Soil: static per field
    soil_cols = ["soil_pH", "soil_OC", "soil_clay"]
    if soil_df is not None:
        soil_agg = soil_df
    else:
        soil_agg = merged_df.groupby("field_id")[soil_cols].first().reset_index()

    # Merge
    X = pheno.merge(weather, on="field_id").merge(soil_agg, on="field_id")

    if include_pca:
        band_cols = [c for c in ["B2", "B3", "B4", "B8", "B11", "B12"] if c in merged_df.columns]
        if band_cols:
            band_agg = merged_df.groupby("field_id")[band_cols].mean().reset_index()
            X, _ = pca_on_spectral_bands(X.merge(band_agg, on="field_id"), band_cols)

    if include_interactions:
        X = create_interaction_terms(X)

    # Target: yield (one value per field)
    yield_agg = merged_df.groupby("field_id")["yield"].first().reset_index()
    X = X.merge(yield_agg, on="field_id")

    exclude = ["field_id", "yield", "sos_doy", "eos_doy"]
    feature_cols = [c for c in X.columns if c not in exclude and X[c].dtype in ["float64", "int64"]]
    X_clean = X[["field_id"] + feature_cols].copy()
    y = X["yield"]

    return X_clean, y

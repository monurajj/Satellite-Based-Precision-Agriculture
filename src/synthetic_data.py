"""Generate synthetic satellite, weather, soil, and yield data for offline development."""

from datetime import datetime, timedelta
from typing import Optional

import numpy as np
import pandas as pd

from .utils import ROI_COORDS, generate_synthetic_fields


def generate_synthetic_dataset(
    n_fields: int = 100,
    start_date: str = "2023-04-01",
    end_date: str = "2023-07-31",
    target_year: int = 2023,
    seed: int = 42,
) -> pd.DataFrame:
    """
    Generate realistic synthetic dataset for crop yield prediction.

    Yield model: yield = a * NDVI_max + b * precip_sum + c * GDD + d * soil_OC + noise
    Based on known agronomic relationships from literature.

    Args:
        n_fields: Number of synthetic fields.
        start_date: Start of growing season.
        end_date: End of growing season.
        target_year: Year for yield labels.
        seed: Random seed.

    Returns:
        DataFrame with field_id, date, bands, indices, weather, soil, yield.
    """
    np.random.seed(seed)

    fields_df = generate_synthetic_fields(n_fields=n_fields, roi_coords=ROI_COORDS)
    start = datetime.strptime(start_date, "%Y-%m-%d")
    end = datetime.strptime(end_date, "%Y-%m-%d")

    # 10-day composite dates
    dates = []
    d = start
    while d <= end:
        dates.append(d.strftime("%Y-%m-%d"))
        d += timedelta(days=10)

    # Soil (static per field)
    soil_pH = 5.5 + np.random.uniform(0.5, 1.5, n_fields)
    soil_OC = 1.0 + np.random.exponential(1.5, n_fields)
    soil_clay = 20 + np.random.uniform(-5, 15, n_fields)

    rows = []
    for i, row in fields_df.iterrows():
        fid = row["field_id"]
        idx = i % n_fields

        # Seasonal NDVI curve (winter wheat: green-up April, peak May-June, senescence July)
        n_dates = len(dates)
        t = np.linspace(0, 1, n_dates)
        # Bell-shaped curve with peak around 60% of season
        ndvi_curve = 0.2 + 0.5 * np.exp(-((t - 0.55) ** 2) / 0.08) + 0.1 * np.random.randn(n_dates)
        ndvi_curve = np.clip(ndvi_curve, 0.1, 0.95)

        # Weather: cumulative precip, mean temp, solar (field-level variation)
        precip_total = 200 + np.random.uniform(-50, 80, 1)[0]
        mean_temp = 18 + np.random.uniform(-2, 3, 1)[0]
        solar_total = 1500 + np.random.uniform(-200, 200, 1)[0]

        # Yield: realistic relationship (tons/ha, typical range 2-8 for winter wheat)
        ndvi_max = np.max(ndvi_curve)
        a, b, c, d = 4.0, 0.01, 0.002, 0.3
        yield_base = a * ndvi_max + b * precip_total + c * solar_total + d * soil_OC[idx]
        yield_val = yield_base + np.random.normal(0, 0.4)
        yield_val = np.clip(yield_val, 2.0, 8.0)

        for j, date in enumerate(dates):
            ndvi = ndvi_curve[j]
            # Derive bands from NDVI (simplified)
            nir = 0.1 + 0.6 * ndvi
            red = 0.15 - 0.3 * ndvi
            blue = 0.08 + np.random.uniform(-0.01, 0.01)
            green = 0.12 + 0.2 * ndvi

            evi = 2.5 * (nir - red) / (nir + 6 * red - 7.5 * blue + 1)
            savi = 1.5 * (nir - red) / (nir + red + 0.5)
            ndre = (nir - 0.7 * red) / (nir + 0.7 * red) if (nir + 0.7 * red) != 0 else ndvi

            rows.append({
                "field_id": fid,
                "date": date,
                "B2": blue,
                "B3": green,
                "B4": red,
                "B8": nir,
                "B11": 0.2 + 0.1 * ndvi + np.random.uniform(-0.02, 0.02),
                "B12": 0.15 + 0.08 * ndvi + np.random.uniform(-0.02, 0.02),
                "NDVI": ndvi,
                "EVI": evi,
                "NDRE": ndre,
                "SAVI": savi,
                "temperature": mean_temp + np.random.uniform(-2, 2),
                "precipitation": precip_total / n_dates + np.random.uniform(-2, 2),
                "solar_rad": solar_total / n_dates + np.random.uniform(-5, 5),
                "soil_pH": soil_pH[idx],
                "soil_OC": soil_OC[idx],
                "soil_clay": soil_clay[idx],
                "yield": yield_val,
            })

    df = pd.DataFrame(rows)
    return df

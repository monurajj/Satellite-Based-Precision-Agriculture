"""
Free public API clients for soil and weather data.
Used by Phase 3 hybrid yield predictor.

- SoilGrids (ISRIC): soil properties (pH, organic carbon, clay) by lat/lon
- NASA POWER: temperature and rainfall by lat/lon over a date range
"""

from datetime import datetime, timedelta
import requests


SOILGRIDS_URL = "https://rest.isric.org/soilgrids/v2.0/properties/query"
NASA_POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"

DEFAULT_SOIL = {"ph": 7.0, "soc": 1.0, "clay": 25.0, "source": "fallback"}
DEFAULT_WEATHER = {"avg_temp": 22.0, "total_rainfall": 600.0, "source": "fallback"}


def get_soil_data(lat, lon, timeout=8):
    """Fetch soil pH, organic carbon, clay from SoilGrids API at top 5cm depth."""
    params = {
        "lon": lon,
        "lat": lat,
        "property": ["phh2o", "soc", "clay"],
        "depth": "0-5cm",
        "value": "mean",
    }
    try:
        r = requests.get(SOILGRIDS_URL, params=params, timeout=timeout)
        r.raise_for_status()
        data = r.json()
        layers = {l["name"]: l for l in data.get("properties", {}).get("layers", [])}

        def extract(name, scale):
            try:
                v = layers[name]["depths"][0]["values"]["mean"]
                return v / scale if v is not None else None
            except (KeyError, IndexError, TypeError):
                return None

        ph = extract("phh2o", 10)
        soc = extract("soc", 10)
        clay = extract("clay", 10)

        if ph is None and soc is None and clay is None:
            return DEFAULT_SOIL

        return {
            "ph": round(ph, 2) if ph is not None else DEFAULT_SOIL["ph"],
            "soc": round(soc, 2) if soc is not None else DEFAULT_SOIL["soc"],
            "clay": round(clay, 1) if clay is not None else DEFAULT_SOIL["clay"],
            "source": "SoilGrids",
        }
    except (requests.RequestException, ValueError, KeyError):
        return DEFAULT_SOIL


def get_weather_data(lat, lon, months_back=6, timeout=12):
    """Fetch avg temp + total rainfall from NASA POWER over the last N months."""
    end_date = datetime.now() - timedelta(days=2)
    start_date = end_date - timedelta(days=30 * months_back)

    params = {
        "latitude": lat,
        "longitude": lon,
        "start": start_date.strftime("%Y%m%d"),
        "end": end_date.strftime("%Y%m%d"),
        "parameters": "T2M,PRECTOTCORR",
        "format": "JSON",
        "community": "AG",
    }

    try:
        r = requests.get(NASA_POWER_URL, params=params, timeout=timeout)
        r.raise_for_status()
        data = r.json()
        params_block = data.get("properties", {}).get("parameter", {})

        temps = list(params_block.get("T2M", {}).values())
        rains = list(params_block.get("PRECTOTCORR", {}).values())

        temps = [t for t in temps if t is not None and t > -100]
        rains = [r for r in rains if r is not None and r >= 0]

        if not temps or not rains:
            return DEFAULT_WEATHER

        avg_temp = sum(temps) / len(temps)
        total_rainfall = sum(rains)

        return {
            "avg_temp": round(avg_temp, 1),
            "total_rainfall": round(total_rainfall, 1),
            "days_observed": len(temps),
            "source": "NASA POWER",
        }
    except (requests.RequestException, ValueError, KeyError):
        return DEFAULT_WEATHER


if __name__ == "__main__":
    lat, lon = 30.9010, 75.8573
    print("Testing API clients with Ludhiana, Punjab...")
    print(f"Soil:    {get_soil_data(lat, lon)}")
    print(f"Weather: {get_weather_data(lat, lon)}")

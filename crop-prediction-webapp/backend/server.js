/**
 * Crop Prediction API - Express Server
 * Endpoints: POST /predict, GET /history, GET /weather/* (Open-Meteo proxy)
 * Uses real ML model via Python predict_ml.py
 * Weather: Open-Meteo (free, no API key)
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const { getHistory, addPrediction } = require('./prediction');

const app = express();
const PORT = process.env.PORT || 4000;

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';
const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_URL = 'https://archive-api.open-meteo.com/v1/archive';

// Path to Python (project venv) and ML script
const fs = require('fs');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const VENV_PYTHON = path.join(PROJECT_ROOT, 'venv', 'bin', 'python');
const PYTHON = fs.existsSync(VENV_PYTHON) ? VENV_PYTHON : 'python3';
const PREDICT_SCRIPT = path.join(__dirname, 'predict_ml.py');

/**
 * Call Python ML prediction script
 */
function callMLPredict(input) {
  return new Promise((resolve, reject) => {
    const py = spawn(PYTHON, [PREDICT_SCRIPT], {
      cwd: PROJECT_ROOT,
      env: { ...process.env, PYTHONUNBUFFERED: '1' },
    });
    let stdout = '';
    let stderr = '';
    py.stdout.on('data', (d) => { stdout += d; });
    py.stderr.on('data', (d) => { stderr += d; });
    py.on('close', (code) => {
      if (code !== 0) {
        let errMsg = 'ML prediction failed';
        try {
          const parsed = JSON.parse(stderr.trim());
          if (parsed.error) errMsg = parsed.error;
        } catch {
          if (stderr) errMsg = stderr.split('\n').pop() || stderr.slice(0, 200);
        }
        reject(new Error(errMsg));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch {
        reject(new Error('Invalid ML response'));
      }
    });
    py.on('error', (err) => {
      reject(new Error(`Python not found: ${err.message}. Run from project root with venv.`));
    });
    py.stdin.write(JSON.stringify(input));
    py.stdin.end();
  });
}

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Weather routes - support both /weather/* and /api/weather/* (for proxy flexibility)
 */
const weatherSearch = async (req, res) => {
  try {
    const q = req.query.q?.trim();
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Enter at least 2 characters to search.' });
    }
    const url = `${GEOCODING_URL}?name=${encodeURIComponent(q)}&count=8`;
    const resp = await fetch(url);
    const data = await resp.json();
    const results = (data.results || []).map((r) => ({
      id: r.id,
      name: r.name,
      country: r.country,
      admin1: r.admin1,
      latitude: r.latitude,
      longitude: r.longitude,
      label: r.admin1 ? `${r.name}, ${r.admin1}, ${r.country}` : `${r.name}, ${r.country}`,
    }));
    res.json({ results });
  } catch (err) {
    console.error('Geocoding error:', err);
    res.status(500).json({ error: 'Location search failed.' });
  }
};

app.get('/weather/search', weatherSearch);
app.get('/api/weather/search', weatherSearch);

/**
 * Reverse geocode (lat, lon) -> place name via Nominatim (OpenStreetMap)
 * Returns human-readable label like "Gurgaon, Haryana, India"
 */
async function reverseGeocode(lat, lon) {
  try {
    const url = `${NOMINATIM_URL}?lat=${lat}&lon=${lon}&format=json&addressdetails=1&zoom=10`;
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'CropPredictionApp/1.0' },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const a = data?.address;
    if (!a) return null;
    const locality = a.city || a.town || a.village || a.municipality || a.county;
    const region = a.state || a.state_district;
    if (locality && region) return `${locality}, ${region}, ${a.country}`;
    if (locality) return `${locality}, ${a.country}`;
    if (region) return `${region}, ${a.country}`;
    return a.country || null;
  } catch {
    return null;
  }
}

/**
 * GET /weather/forecast?lat=28.65&lon=77.23
 * Fetch weather for crop prediction: temp, rainfall (30-day), solar
 */
const weatherForecast = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Valid latitude and longitude required.' });
    }

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const startDate = thirtyDaysAgo.toISOString().slice(0, 10);
    const endDate = today.toISOString().slice(0, 10);

    const [forecastRes, archiveRes, locationName] = await Promise.all([
      fetch(
        `${FORECAST_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,shortwave_radiation&daily=temperature_2m_max,temperature_2m_min,shortwave_radiation_sum`
      ),
      fetch(
        `${ARCHIVE_URL}?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=precipitation_sum`
      ),
      reverseGeocode(lat, lon),
    ]);

    const forecast = await forecastRes.json();
    const archive = await archiveRes.json();

    if (forecast.error || archive.error) {
      return res.status(502).json({ error: 'Weather service temporarily unavailable.' });
    }

    const temp = forecast.current?.temperature_2m ?? 20;
    const solarNow = forecast.current?.shortwave_radiation ?? 0;
    const dailySolar = forecast.daily?.shortwave_radiation_sum;
    const solarMj = dailySolar && dailySolar.length > 0 ? dailySolar[0] : null;
    const solarWm2 = solarNow > 0 ? Math.round(solarNow) : solarMj != null ? Math.round(solarMj * 1e6 / 86400) : 150;

    const precipSums = archive.daily?.precipitation_sum || [];
    const rainfall30d = precipSums.reduce((a, b) => a + (b ?? 0), 0);

    res.json({
      temperature: Math.round(temp * 10) / 10,
      rainfall: Math.round(rainfall30d),
      solarRad: Math.max(0, Math.min(400, solarWm2)),
      locationName: locationName || null,
      source: 'Open-Meteo',
    });
  } catch (err) {
    console.error('Weather fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch weather data.' });
  }
};

app.get('/weather/forecast', weatherForecast);
app.get('/api/weather/forecast', weatherForecast);

/**
 * POST /predict
 * Body: { cropType, landArea, soilType, rainfall, temperature, solarRad }
 * Returns: { predictionId, predictedYield, unit, message }
 * Uses trained XGBoost/Random Forest model from main project
 */
app.post('/predict', async (req, res) => {
  try {
    const { cropType, landArea, soilType, rainfall, temperature, solarRad } = req.body;

    // Basic validation
    if (!cropType || !landArea || !soilType) {
      return res.status(400).json({
        error: 'Missing required fields: cropType, landArea, and soilType are required.',
      });
    }

    const landAreaNum = parseFloat(landArea);
    if (isNaN(landAreaNum) || landAreaNum <= 0) {
      return res.status(400).json({ error: 'Land area must be a positive number.' });
    }

    const input = {
      cropType,
      landArea: landAreaNum,
      soilType,
      rainfall: parseFloat(rainfall) || 500,
      temperature: parseFloat(temperature) || 20,
      solarRad: parseFloat(solarRad) || 150,
    };

    const result = await callMLPredict(input);

    const prediction = addPrediction({
      ...req.body,
      predictedYield: result.predictedYield,
      totalYield: result.totalYield,
      unit: result.unit,
    });

    res.json({
      predictionId: prediction.id,
      predictedYield: result.predictedYield,
      totalYield: result.totalYield,
      unit: result.unit,
      message: result.message,
    });
  } catch (err) {
    console.error('Predict error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate prediction.' });
  }
});

/**
 * GET /history
 * Returns: { predictions: [...] }
 */
app.get('/history', (req, res) => {
  try {
    const predictions = getHistory();
    res.json({ predictions });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Failed to fetch prediction history.' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Crop Prediction API is running' });
});

app.listen(PORT, () => {
  console.log(`Crop Prediction API running on http://localhost:${PORT}`);
});

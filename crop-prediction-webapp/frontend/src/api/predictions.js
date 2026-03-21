/**
 * API client for crop prediction endpoints
 * Uses /api prefix which is proxied to backend (see vite.config.js)
 * Includes localStorage fallback for history when backend is unavailable
 */

const API_BASE = '/api';
const HISTORY_KEY = 'crop-prediction-history';

function getStoredHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToHistory(prediction) {
  try {
    const stored = getStoredHistory();
    const updated = [{ ...prediction, timestamp: prediction.timestamp || new Date().toISOString() }, ...stored];
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated.slice(0, 200)));
  } catch (e) {
    console.warn('Could not save to localStorage:', e);
  }
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

/**
 * POST /predict - Submit prediction input, get yield estimate
 * Also saves result to localStorage for offline history fallback
 */
export async function submitPrediction(input) {
  const result = await request('/predict', {
    method: 'POST',
    body: JSON.stringify(input),
  });
  saveToHistory({
    id: result.predictionId,
    timestamp: new Date().toISOString(),
    cropType: input.cropType,
    landArea: input.landArea,
    soilType: input.soilType,
    predictedYield: result.predictedYield,
    totalYield: result.totalYield,
    unit: result.unit,
  });
  return result;
}

/**
 * GET /history - Fetch previous predictions
 * Falls back to localStorage when backend is unavailable
 */
export async function fetchHistory() {
  try {
    const { predictions } = await request('/history');
    return predictions || [];
  } catch {
    return getStoredHistory();
  }
}

/**
 * GET /weather/search?q=... - Search locations (Open-Meteo Geocoding)
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return { results: [] };
  const { results } = await request(`/weather/search?q=${encodeURIComponent(query.trim())}`);
  return { results: results || [] };
}

/**
 * GET /weather/forecast?lat=...&lon=... - Get weather for location
 * Returns { temperature, rainfall, solarRad, locationName? }
 */
export async function fetchWeather(lat, lon) {
  return request(`/weather/forecast?lat=${lat}&lon=${lon}`);
}

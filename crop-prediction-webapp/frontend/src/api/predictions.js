/**
 * API client for crop prediction endpoints
 * Uses /api prefix which is proxied to backend (see vite.config.js)
 */

const API_BASE = '/api';

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
 */
export async function submitPrediction(input) {
  return request('/predict', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

/**
 * GET /history - Fetch previous predictions
 */
export async function fetchHistory() {
  const { predictions } = await request('/history');
  return predictions || [];
}

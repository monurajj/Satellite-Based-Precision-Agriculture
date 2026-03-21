/**
 * Crop Prediction API - Express Server
 * Endpoints: POST /predict, GET /history
 * Uses real ML model via Python predict_ml.py
 */

const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const { getHistory, addPrediction } = require('./prediction');

const app = express();
const PORT = process.env.PORT || 4000;

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

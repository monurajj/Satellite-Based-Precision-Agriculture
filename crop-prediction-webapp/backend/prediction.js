/**
 * Prediction storage - persisted to JSON file (data/predictions.json)
 * Survives server restarts. Falls back to in-memory if file unavailable.
 */
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FILE_PATH = path.join(DATA_DIR, 'predictions.json');

let predictions = [];
let idCounter = 1;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadFromFile() {
  try {
    ensureDataDir();
    if (fs.existsSync(FILE_PATH)) {
      const raw = fs.readFileSync(FILE_PATH, 'utf8');
      const data = JSON.parse(raw);
      predictions = Array.isArray(data.predictions) ? data.predictions : [];
      idCounter = Math.max(1, ...predictions.map((p) => parseInt(p.id, 10) || 0)) + 1;
    }
  } catch (err) {
    console.warn('Could not load prediction history from file:', err.message);
    predictions = [];
  }
}

function saveToFile() {
  try {
    ensureDataDir();
    fs.writeFileSync(
      FILE_PATH,
      JSON.stringify({ predictions, idCounter, updatedAt: new Date().toISOString() }, null, 2),
      'utf8'
    );
  } catch (err) {
    console.warn('Could not save prediction history to file:', err.message);
  }
}

// Load on startup
loadFromFile();

function addPrediction(data) {
  const prediction = {
    id: String(idCounter++),
    timestamp: new Date().toISOString(),
    ...data,
  };
  predictions.push(prediction);
  saveToFile();
  return prediction;
}

function getHistory() {
  return [...predictions].reverse();
}

module.exports = { getHistory, addPrediction };

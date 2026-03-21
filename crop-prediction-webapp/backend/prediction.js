/**
 * Prediction storage - in-memory history
 * Actual predictions are made by predict_ml.py (trained XGBoost/RF model)
 */

const predictions = [];
let idCounter = 1;

function addPrediction(data) {
  const prediction = {
    id: String(idCounter++),
    timestamp: new Date().toISOString(),
    ...data,
  };
  predictions.push(prediction);
  return prediction;
}

function getHistory() {
  return [...predictions].reverse();
}

module.exports = { getHistory, addPrediction };

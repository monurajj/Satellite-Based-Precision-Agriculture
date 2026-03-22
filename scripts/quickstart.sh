#!/bin/bash
# Quickstart: train model + verify web app can load it
# Run from project root: ./scripts/quickstart.sh

set -e
cd "$(dirname "$0")/.."

echo "=== Satellite-Based Precision Agriculture – Quickstart ==="
echo ""

# 1. Train model
echo "[1/2] Training ML model..."
if [ ! -f venv/bin/activate ]; then
    echo "Creating venv..."
    python3 -m venv venv
fi
source venv/bin/activate
pip install -q -r requirements-minimal.txt
python main.py
echo ""

# 2. Verify model exists
if [ -f experiments/results/best_model.joblib ]; then
    echo "[2/2] Model saved. To run web app:"
    echo "  Terminal 1: cd crop-prediction-webapp/backend && npm install && npm start"
    echo "  Terminal 2: cd crop-prediction-webapp/frontend && npm install && npm run dev"
    echo "  Open http://localhost:3000"
else
    echo "Warning: best_model.joblib not found. Check main.py output."
fi

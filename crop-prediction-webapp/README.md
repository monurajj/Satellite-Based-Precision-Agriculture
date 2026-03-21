# Crop Yield Prediction Web App

A simple, mobile-friendly web application for small farmers to predict crop production. Built with React, Tailwind CSS, and Node.js/Express.

## Features

- **Prediction Form** – Enter crop type, land area, soil type, and weather data to get yield estimates
- **Results Page** – Clear display of predicted yield (tons per hectare and total)
- **Dashboard** – View past predictions in a table with basic charts (bar chart, pie chart)
- **Loading states & error handling** – User-friendly feedback during API calls
- **Accessible UI** – Simple layout for non-technical users

## Project Structure

```
crop-prediction-webapp/
├── backend/           # Node.js + Express API
│   ├── server.js     # Express server, routes
│   ├── prediction.js # Formula-based prediction logic
│   └── package.json
├── frontend/         # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/   # Layout, Card, LoadingSpinner, ErrorMessage
│   │   ├── pages/        # Dashboard, PredictionForm, Results
│   │   ├── api/          # Predictions API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   └── package.json
└── README.md
```

## Prerequisites

- **Node.js** 18+ (and npm)
- A terminal/command line

## Step-by-Step: Run the Project

### 1. Install dependencies

**Backend:**
```bash
cd crop-prediction-webapp/backend
npm install
```

**Frontend:**
```bash
cd crop-prediction-webapp/frontend
npm install
```

### 2. Start the backend

From `crop-prediction-webapp/backend`:
```bash
npm start
```

The API runs at **http://localhost:4000**. You should see:
```
Crop Prediction API running on http://localhost:4000
```

### 3. Start the frontend (in a new terminal)

From `crop-prediction-webapp/frontend`:
```bash
npm run dev
```

The app runs at **http://localhost:3000**.

### 4. Use the app

1. Open **http://localhost:3000** in your browser
2. Go to **New Prediction** and fill in the form
3. Click **Get Prediction** to see results
4. Go to **Dashboard** to view history and charts

## API Endpoints

| Method | Endpoint   | Description                            |
|--------|------------|----------------------------------------|
| POST   | `/predict` | Submit prediction, returns yield est.  |
| GET    | `/history` | Returns list of previous predictions   |
| GET    | `/health`  | Health check                           |

### POST /predict (request body)

```json
{
  "cropType": "Wheat",
  "landArea": 5,
  "soilType": "Loam",
  "rainfall": 500,
  "temperature": 20,
  "solarRad": 150
}
```

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, React Router
- **Backend:** Node.js, Express
- **ML Model:** Python (`predict_ml.py`) – uses trained XGBoost/Random Forest from main project
- **Storage:** In-memory (replace with MongoDB for production)

## ML Model Integration

Predictions use the **actual trained model** (`experiments/results/best_model.joblib`) from the Satellite-Based Precision Agriculture project. The backend spawns a Python subprocess that:

1. Maps farmer inputs (soil type, rainfall, temperature, solar) to model features
2. Loads the trained model and runs inference
3. Returns yield in tons/hectare

**Prerequisites:** Run `python main.py` in the main project at least once to train and save the model.

## Documentation (PDF)

A detailed project documentation is available in `docs/Project-Documentation.html`. It covers:
- System architecture and workflow
- Frontend & backend how they work
- ML model integration
- API reference and setup instructions

**To create a PDF:** Open `docs/Project-Documentation.html` in a browser → `Ctrl+P` / `Cmd+P` → Save as PDF.

## Production Notes

- Replace in-memory storage in `backend/prediction.js` with MongoDB or another database
- Add authentication if needed

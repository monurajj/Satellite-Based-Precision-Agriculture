/**
 * Main App - Routes for Dashboard, Yield Prediction, Land Cover Classification, Results
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PredictionForm from './pages/PredictionForm';
import Results from './pages/Results';
import Classification from './pages/Classification';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/predict" element={<PredictionForm />} />
        <Route path="/results" element={<Results />} />
        <Route path="/classify" element={<Classification />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;

/**
 * Results Page - Display prediction outcome clearly
 */
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/Card';

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;
  const formData = state?.formData;

  if (!result) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-farm-green">Results</h1>
        <p className="text-farm-muted">
          No prediction result found. Please run a new prediction.
        </p>
        <button
          onClick={() => navigate('/predict')}
          className="px-4 py-2 bg-farm-green text-white rounded-lg hover:bg-green-800"
        >
          New Prediction
        </button>
      </div>
    );
  }

  const { predictedYield, totalYield, unit, message } = result;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-farm-green">Prediction Results</h1>

      <Card>
        <div className="text-center py-6">
          <p className="text-farm-muted text-sm uppercase tracking-wide mb-2">
            Estimated yield per hectare
          </p>
          <p className="text-4xl font-bold text-farm-green mb-1">
            {predictedYield} {unit}/ha
          </p>
          <p className="text-farm-muted text-lg">for {formData?.cropType} on {formData?.landArea} ha</p>
        </div>

        <div className="border-t border-green-100 pt-6 mt-4">
          <p className="text-xl font-semibold text-gray-800">
            Total expected yield: <span className="text-farm-green">{totalYield} {unit}</span>
          </p>
          <p className="text-sm text-farm-muted mt-1">{message}</p>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate('/predict')}
          className="flex-1 py-3 px-4 bg-farm-green text-white font-semibold rounded-lg hover:bg-green-800 transition"
        >
          New Prediction
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-3 px-4 bg-white border-2 border-farm-green text-farm-green font-semibold rounded-lg hover:bg-farm-light transition"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

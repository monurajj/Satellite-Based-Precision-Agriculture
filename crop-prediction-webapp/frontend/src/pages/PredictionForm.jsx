/**
 * Prediction Form - Farmer-friendly inputs for crop yield prediction
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { submitPrediction } from '../api/predictions';

const CROP_OPTIONS = [
  'Wheat', 'Rice', 'Corn', 'Barley', 'Soybean', 'Cotton', 'Sugarcane', 'Potato', 'Other',
];
const SOIL_OPTIONS = [
  'Loam', 'Clay', 'Sandy', 'Silt', 'Sandy Loam', 'Clay Loam', 'Other',
];

export default function PredictionForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    cropType: 'Wheat',
    landArea: '',
    soilType: 'Loam',
    rainfall: '500',
    temperature: '20',
    solarRad: '150',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.landArea || parseFloat(formData.landArea) <= 0) {
      setError('Please enter a valid land area (hectares).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await submitPrediction({
        cropType: formData.cropType,
        landArea: parseFloat(formData.landArea),
        soilType: formData.soilType,
        rainfall: parseFloat(formData.rainfall) || 500,
        temperature: parseFloat(formData.temperature) || 20,
        solarRad: parseFloat(formData.solarRad) || 150,
      });

      navigate('/results', { state: { result, formData } });
    } catch (err) {
      setError(err.message || 'Failed to get prediction. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-farm-green">New Prediction</h1>
      <p className="text-farm-muted">
        Enter your field details to get an estimated crop yield. All fields marked with * are required.
      </p>

      <Card title="Field & Crop Information">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <ErrorMessage message={error} onRetry={() => setError(null)} />
          )}

          <div>
            <label htmlFor="cropType" className="block text-sm font-medium text-gray-700 mb-1">
              Crop type *
            </label>
            <select
              id="cropType"
              name="cropType"
              value={formData.cropType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-green focus:border-farm-green"
              required
            >
              {CROP_OPTIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="landArea" className="block text-sm font-medium text-gray-700 mb-1">
              Land area (hectares) *
            </label>
            <input
              id="landArea"
              name="landArea"
              type="number"
              min="0.1"
              step="0.1"
              placeholder="e.g. 5"
              value={formData.landArea}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-green focus:border-farm-green"
              required
            />
          </div>

          <div>
            <label htmlFor="soilType" className="block text-sm font-medium text-gray-700 mb-1">
              Soil type *
            </label>
            <select
              id="soilType"
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-green focus:border-farm-green"
            >
              {SOIL_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="rainfall" className="block text-sm font-medium text-gray-700 mb-1">
                Rainfall (mm)
              </label>
              <input
                id="rainfall"
                name="rainfall"
                type="number"
                min="0"
                step="10"
                placeholder="500"
                value={formData.rainfall}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-green focus:border-farm-green"
              />
            </div>
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
                Temperature (°C)
              </label>
              <input
                id="temperature"
                name="temperature"
                type="number"
                min="0"
                max="45"
                step="1"
                placeholder="20"
                value={formData.temperature}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-green focus:border-farm-green"
              />
            </div>
            <div>
              <label htmlFor="solarRad" className="block text-sm font-medium text-gray-700 mb-1">
                Solar (W/m²)
              </label>
              <input
                id="solarRad"
                name="solarRad"
                type="number"
                min="0"
                step="10"
                placeholder="150"
                value={formData.solarRad}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-farm-green focus:border-farm-green"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-farm-green text-white font-semibold rounded-lg hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                Predicting...
              </>
            ) : (
              'Get Prediction'
            )}
          </button>
        </form>
      </Card>
    </div>
  );
}

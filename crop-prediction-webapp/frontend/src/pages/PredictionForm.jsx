/**
 * Prediction Form - Enhanced yield prediction input
 * Clear sections, visual polish, trust signals
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import LocationWeather from '../components/LocationWeather';
import { submitPrediction } from '../api/predictions';

const CROP_OPTIONS = [
  'Wheat', 'Rice', 'Corn', 'Barley', 'Soybean', 'Cotton', 'Sugarcane', 'Potato', 'Other',
];
const SOIL_OPTIONS = [
  'Loam', 'Clay', 'Sandy', 'Silt', 'Sandy Loam', 'Clay Loam', 'Other',
];

const QUICK_TIPS = [
  { icon: '🛰️', text: 'Satellite data included' },
  { icon: '🌤️', text: 'Auto-fill weather by location' },
  { icon: '💾', text: 'Saved to your history' },
];

const inputClass =
  'w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-farm-green focus:border-farm-green transition-all duration-200 bg-white';

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

  const handleWeatherFetched = (weather) => {
    if (weather) {
      setFormData((prev) => ({
        ...prev,
        temperature: String(weather.temperature ?? prev.temperature),
        rainfall: String(weather.rainfall ?? prev.rainfall),
        solarRad: String(weather.solarRad ?? prev.solarRad),
      }));
    }
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
    <div className="space-y-8 animate-fade-up">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl shadow-xl">
        <div className="absolute inset-0">
          <img
            src="/imagefiles/image%20copy%204.png"
            alt="Farm field"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-farm-green/95 via-farm-green/85 to-farm-green/70" />
        </div>
        <div className="relative px-6 py-10 sm:py-12 lg:py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <p className="text-farm-harvest font-bold uppercase tracking-widest text-sm mb-2">Yield Intelligence</p>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
                Get Your Crop Prediction
              </h1>
              <p className="text-white/90 text-lg max-w-xl mb-4">
                Enter your field details below. Our AI combines satellite, soil, and weather data to estimate your harvest.
              </p>
              <div className="flex flex-wrap gap-3">
                {QUICK_TIPS.map((t, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-sm font-medium">
                    {t.icon} {t.text}
                  </span>
                ))}
              </div>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl transition-all shrink-0"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </section>

      {/* Form */}
      <Card title="Field & Crop Information" icon="🌾">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <ErrorMessage message={error} onRetry={() => setError(null)} />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="cropType" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <span>🌾</span> Crop type
              </label>
              <select
                id="cropType"
                name="cropType"
                value={formData.cropType}
                onChange={handleChange}
                className={`${inputClass} cursor-pointer`}
                required
              >
                {CROP_OPTIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="landArea" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <span>📐</span> Land area (hectares)
              </label>
              <input
                id="landArea"
                name="landArea"
                type="number"
                min="0.1"
                step="0.1"
                placeholder="e.g. 5, 10.5"
                value={formData.landArea}
                onChange={handleChange}
                className={inputClass}
                required
              />
              <p className="text-xs text-farm-muted mt-1">Total cultivable area in hectares</p>
            </div>
          </div>

          <div>
            <label htmlFor="soilType" className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
              <span>🫘</span> Soil type
            </label>
            <select
              id="soilType"
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              className={`${inputClass} cursor-pointer`}
            >
              {SOIL_OPTIONS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="pt-6 border-t-2 border-green-100">
            <div className="rounded-xl bg-farm-light/50 p-4 sm:p-5 border border-green-100">
              <p className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
                <span>🌤️</span> Weather & conditions
              </p>
              <p className="text-sm text-farm-muted mb-4">
                Search your location to auto-fill, or enter values manually.
              </p>
              <LocationWeather onWeatherFetched={handleWeatherFetched} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <div>
                  <label htmlFor="rainfall" className="block text-sm font-medium text-gray-600 mb-1">
                    Rainfall (mm)
                  </label>
                  <input
                    id="rainfall"
                    name="rainfall"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="500"
                    value={formData.rainfall}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="temperature" className="block text-sm font-medium text-gray-600 mb-1">
                    Temperature (°C)
                  </label>
                  <input
                    id="temperature"
                    name="temperature"
                    type="number"
                    min="0"
                    max="45"
                    step="0.1"
                    placeholder="20"
                    value={formData.temperature}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="solarRad" className="block text-sm font-medium text-gray-600 mb-1">
                    Solar (W/m²)
                  </label>
                  <input
                    id="solarRad"
                    name="solarRad"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="150"
                    value={formData.solarRad}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 bg-farm-green text-white font-bold rounded-xl hover:bg-green-800 hover:scale-[1.02] active:scale-100 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all flex items-center justify-center gap-2 shadow-lg text-lg"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" label="Calculating..." />
                  <span>Calculating your yield...</span>
                </>
              ) : (
                <>
                  <span>📊</span> Get My Yield Prediction
                </>
              )}
            </button>
            <p className="text-center text-sm text-farm-muted mt-3">
              Prediction saved to your history automatically
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
}

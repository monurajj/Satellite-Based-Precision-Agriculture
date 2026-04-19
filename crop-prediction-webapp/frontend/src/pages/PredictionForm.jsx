/**
 * Prediction Form - Agriculture-themed yield prediction
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitPrediction } from '../api/predictions';
import LocationWeather from '../components/LocationWeather';
import FloatingLeaves from '../components/FloatingLeaves';

const cropTypes = ['Wheat', 'Rice', 'Corn', 'Barley', 'Soybean', 'Cotton', 'Sugarcane', 'Potato', 'Other'];
const soilTypes = ['Loam', 'Clay', 'Sandy', 'Silt', 'Sandy Loam', 'Clay Loam', 'Other'];

export default function PredictionForm() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    cropType: '', landArea: '', soilType: '',
    rainfall: '', temperature: '', solarRad: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleWeather = (weather) => {
    setForm((prev) => ({
      ...prev,
      rainfall: weather.rainfall ?? prev.rainfall,
      temperature: weather.temperature ?? prev.temperature,
      solarRad: weather.solarRad ?? prev.solarRad,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.cropType || !form.landArea || !form.soilType) {
      setError('Please fill in all required fields.');
      return;
    }
    setLoading(true); setError(null);
    try {
      const result = await submitPrediction(form);
      navigate('/results', { state: { result, input: form } });
    } catch (err) {
      setError(err.message || 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm outline-none";
  const labelClass = "block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider";

  return (
    <div>
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 py-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-60 h-60 bg-green-400/20 rounded-full blur-3xl" />
        </div>
        <FloatingLeaves />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm text-green-100 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse-soft" />
            Phase 1 · Machine Learning
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
            🌾 Yield Prediction
          </h1>
          <p className="text-green-100/80 max-w-xl text-lg">
            Enter crop, soil, and weather details for an ML-powered yield estimate.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 50" fill="none" className="w-full"><path d="M0 25C360 50 720 0 1080 25C1260 37.5 1350 50 1440 50V50H0V25Z" fill="rgb(250 250 249)" /></svg>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <form onSubmit={handleSubmit} className="card-farm p-6 sm:p-8 animate-slide-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div>
              <label className={labelClass}>Crop Type *</label>
              <select value={form.cropType} onChange={set('cropType')} className={inputClass} required>
                <option value="">Select crop</option>
                {cropTypes.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Land Area (hectares) *</label>
              <input type="number" value={form.landArea} onChange={set('landArea')} placeholder="e.g. 10" min="0.1" step="0.1" className={inputClass} required />
            </div>
          </div>

          <div className="mb-6">
            <label className={labelClass}>Soil Type *</label>
            <select value={form.soilType} onChange={set('soilType')} className={inputClass} required>
              <option value="">Select soil type</option>
              {soilTypes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="border-t border-green-100 my-8" />

          <div className="mb-6">
            <label className={labelClass}>Location (auto-fill weather)</label>
            <LocationWeather onWeatherFetched={handleWeather} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
            <div>
              <label className={labelClass}>Rainfall (mm)</label>
              <input type="number" value={form.rainfall} onChange={set('rainfall')} placeholder="500" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Temperature (°C)</label>
              <input type="number" value={form.temperature} onChange={set('temperature')} placeholder="25" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Solar Rad (W/m²)</label>
              <input type="number" value={form.solarRad} onChange={set('solarRad')} placeholder="200" className={inputClass} />
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-300 ${
              loading
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30 hover:-translate-y-0.5 active:translate-y-0'
            }`}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Running XGBoost...
              </span>
            ) : '🌾 Get Yield Prediction'}
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * Phase 3 — Hybrid Multi-Crop Yield Prediction
 * Form-based input + live SoilGrids/NASA POWER + optional satellite image (DL fusion).
 */
import { useEffect, useState, useMemo } from 'react';
import { fetchHybridMetadata, predictHybridYield } from '../api/predictions';
import FloatingLeaves from '../components/FloatingLeaves';

export default function HybridYieldPrediction() {
  const [metadata, setMetadata] = useState(null);
  const [metaError, setMetaError] = useState(null);

  const [form, setForm] = useState({
    state: '',
    district: '',
    crop: '',
    season: '',
    acres: '',
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Load dropdown metadata on mount
  useEffect(() => {
    fetchHybridMetadata()
      .then((m) => setMetadata(m))
      .catch((e) => setMetaError(e.message || 'Could not load options.'));
  }, []);

  // Districts depend on selected state
  const districtOptions = useMemo(() => {
    if (!metadata || !form.state) return [];
    return metadata.districts_by_state?.[form.state] || [];
  }, [metadata, form.state]);

  // Crops depend on selected season
  const cropOptions = useMemo(() => {
    if (!metadata || !form.season) return [];
    return metadata.crops_by_season?.[form.season] || [];
  }, [metadata, form.season]);

  const set = (field) => (e) => {
    const value = e.target.value;
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Reset dependent fields
      if (field === 'state') next.district = '';
      if (field === 'season') next.crop = '';
      return next;
    });
  };

  const handleImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Image too large (max 5 MB).');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = String(dataUrl).split(',')[1] || null;
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
    setError(null);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.state || !form.district || !form.season || !form.crop || !form.acres) {
      setError('Please fill all required fields.');
      return;
    }
    const acresNum = parseFloat(form.acres);
    if (Number.isNaN(acresNum) || acresNum <= 0) {
      setError('Acres must be a positive number.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        state: form.state,
        district: form.district,
        crop: form.crop,
        season: form.season,
        acres: acresNum,
        ...(imageBase64 ? { imageBase64 } : {}),
      };
      const data = await predictHybridYield(payload);
      setResult(data);
      // Scroll results into view
      setTimeout(() => {
        document.getElementById('hybrid-results')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      setError(err.message || 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm outline-none disabled:bg-gray-50 disabled:cursor-not-allowed';
  const labelClass = 'block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider';

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-green-600 to-green-500 py-16">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-60 h-60 bg-emerald-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-green-400/20 rounded-full blur-3xl" />
        </div>
        <FloatingLeaves />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur rounded-full text-sm text-green-100 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse-soft" />
            Phase 3 · Hybrid ML + DL
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 tracking-tight">
            🌾 Hybrid Yield Predictor
          </h1>
          <p className="text-green-100/80 max-w-2xl text-lg">
            Multi-crop yield estimates for India powered by XGBoost + ResNet-50+SE, with live soil and weather APIs.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 50" fill="none" className="w-full">
            <path d="M0 25C360 50 720 0 1080 25C1260 37.5 1350 50 1440 50V50H0V25Z" fill="rgb(250 250 249)" />
          </svg>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Form */}
        <form onSubmit={handleSubmit} className="card-farm p-6 sm:p-8 animate-slide-up">
          <h2 className="text-lg font-bold text-green-900 mb-6 flex items-center gap-2">
            <span className="text-2xl">🚜</span>
            Tell us about your farm
          </h2>

          {metaError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              ⚠️ {metaError} Make sure the backend is running and the Phase 3 model has been trained.
            </div>
          )}

          {/* State + District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className={labelClass}>State *</label>
              <select
                value={form.state}
                onChange={set('state')}
                className={inputClass}
                disabled={!metadata}
                required
              >
                <option value="">Select state</option>
                {metadata?.states?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>District *</label>
              <select
                value={form.district}
                onChange={set('district')}
                className={inputClass}
                disabled={!form.state}
                required
              >
                <option value="">{form.state ? 'Select district' : 'Select state first'}</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Season + Crop */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className={labelClass}>Season *</label>
              <select
                value={form.season}
                onChange={set('season')}
                className={inputClass}
                disabled={!metadata}
                required
              >
                <option value="">Select season</option>
                {metadata?.seasons?.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Crop *</label>
              <select
                value={form.crop}
                onChange={set('crop')}
                className={inputClass}
                disabled={!form.season}
                required
              >
                <option value="">{form.season ? 'Select crop' : 'Select season first'}</option>
                {cropOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Acres */}
          <div className="mb-5">
            <label className={labelClass}>Farm Size (acres) *</label>
            <input
              type="number"
              value={form.acres}
              onChange={set('acres')}
              placeholder="e.g. 5"
              min="0.1"
              step="0.1"
              className={inputClass}
              required
            />
            <p className="mt-1.5 text-xs text-gray-400">
              1 acre = 0.4047 hectares · We'll convert automatically.
            </p>
          </div>

          {/* Optional satellite image */}
          <div className="mb-6">
            <label className={labelClass}>
              Satellite image of your field
              <span className="ml-2 normal-case font-medium text-gray-400">(optional — activates DL fusion)</span>
            </label>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-green-200 rounded-xl p-6 text-center bg-green-50/30 hover:bg-green-50/60 transition-colors">
                <input
                  type="file"
                  id="hybrid-image"
                  accept="image/*"
                  onChange={handleImage}
                  className="hidden"
                />
                <label htmlFor="hybrid-image" className="cursor-pointer block">
                  <div className="text-3xl mb-2">📡</div>
                  <p className="text-sm font-semibold text-green-800">
                    Click to upload a satellite screenshot
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG / JPG / WebP · max 5 MB · Google Earth or Sentinel-2 works best
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-full max-h-64 object-contain rounded-xl border-2 border-green-100 bg-white"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-2 right-2 px-3 py-1.5 bg-white/90 hover:bg-white text-red-600 text-xs font-bold rounded-lg shadow-md transition-colors"
                >
                  ✕ Remove
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !metadata}
            className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl shadow-lg shadow-green-600/25 hover:shadow-green-600/40 transition-all duration-300"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="animate-spin w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                Analyzing soil, weather{imageBase64 ? ', image' : ''}…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                🌱 Predict Yield
              </span>
            )}
          </button>
        </form>

        {/* Results */}
        {result && (
          <div id="hybrid-results" className="mt-10 space-y-5 animate-slide-up">
            <ResultCard result={result} />
            <SoilWeatherPanel soil={result.soil} weather={result.weather} location={result.location} />
            {result.cnnVerification && <CnnVerificationCard cnn={result.cnnVerification} declared={result.crop} />}
            <InsightsCard insights={result.insights} />
            <ModelBadge modelUsed={result.modelUsed} />
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const yieldVsAvg = result.yieldVsAvgPercent;
  const isAbove = yieldVsAvg != null && yieldVsAvg >= 0;

  return (
    <div className="card-farm p-6 sm:p-8 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
        <div>
          <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">
            Predicted Yield
          </p>
          <h3 className="text-2xl font-black text-green-900">
            {result.crop} · {result.location?.district}, {result.location?.state}
          </h3>
        </div>
        {yieldVsAvg != null && (
          <span
            className={`px-3 py-1.5 rounded-full text-xs font-bold ${
              isAbove ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isAbove ? '↑' : '↓'} {Math.abs(yieldVsAvg).toFixed(1)}% vs district avg
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Yield / hectare
          </p>
          <p className="text-3xl font-black text-green-700">{result.yieldPerHectare}</p>
          <p className="text-xs text-gray-500 mt-0.5">tons / ha</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Total Production
          </p>
          <p className="text-3xl font-black text-emerald-600">{result.totalProduction}</p>
          <p className="text-xs text-gray-500 mt-0.5">tons total</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-green-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
            Area
          </p>
          <p className="text-3xl font-black text-gray-700">{result.areaHectares}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            ha ({result.areaAcres} acres)
          </p>
        </div>
      </div>

      {result.districtAvgYield != null && (
        <p className="mt-4 text-xs text-gray-500">
          District-crop average: <span className="font-bold text-gray-700">{result.districtAvgYield} t/ha</span>
        </p>
      )}
    </div>
  );
}

function SoilWeatherPanel({ soil, weather, location }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Soil */}
      <div className="card-farm p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2">
            <span className="text-xl">🌍</span>
            Soil
          </h4>
          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
            {soil?.source}
          </span>
        </div>
        <dl className="space-y-2 text-sm">
          <Row label="pH" value={soil?.ph} />
          <Row label="Organic Carbon" value={soil?.soc != null ? `${soil.soc}%` : null} />
          <Row label="Clay" value={soil?.clay != null ? `${soil.clay}%` : null} />
        </dl>
      </div>

      {/* Weather */}
      <div className="card-farm p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-sky-800 flex items-center gap-2">
            <span className="text-xl">☁️</span>
            Weather (last 6 months)
          </h4>
          <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">
            {weather?.source}
          </span>
        </div>
        <dl className="space-y-2 text-sm">
          <Row label="Avg. Temperature" value={weather?.avg_temp != null ? `${weather.avg_temp} °C` : null} />
          <Row label="Total Rainfall" value={weather?.total_rainfall != null ? `${weather.total_rainfall} mm` : null} />
          {location && (
            <Row
              label="Location"
              value={`${location.lat?.toFixed(3)}°, ${location.lon?.toFixed(3)}°`}
            />
          )}
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-100 last:border-b-0 py-1.5">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm font-semibold text-gray-800">{value ?? '—'}</dd>
    </div>
  );
}

function CnnVerificationCard({ cnn, declared }) {
  if (cnn.error) {
    return (
      <div className="card-farm p-5 border-amber-200 bg-amber-50">
        <h4 className="text-sm font-bold text-amber-800 mb-1 flex items-center gap-2">
          <span className="text-xl">🤖</span>
          DL Crop Verification
        </h4>
        <p className="text-xs text-amber-700">⚠️ {cnn.error}</p>
      </div>
    );
  }

  const cropland = ['Cropland', 'Pasture', 'Vegetation'];
  const looksLikeCrop = cropland.includes(cnn.unifiedClass);

  return (
    <div className={`card-farm p-5 ${looksLikeCrop ? 'border-green-200 bg-green-50/50' : 'border-amber-200 bg-amber-50/50'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-gray-700 mb-1 flex items-center gap-2">
            <span className="text-xl">🤖</span>
            DL Image Verification
          </h4>
          <p className="text-xs text-gray-600">
            Phase 2 ResNet-50+SE classified the uploaded image as
            <span className="font-bold text-gray-900 mx-1">{cnn.unifiedClass}</span>
            ({cnn.confidence}% confidence)
          </p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
            looksLikeCrop ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
          }`}
        >
          {looksLikeCrop ? '✓ Looks like cropland' : '⚠ Not cropland'}
        </span>
      </div>
      {!looksLikeCrop && (
        <p className="mt-2 text-xs text-amber-700">
          The image doesn't appear to show {declared} cropland. Yield estimate may be inaccurate.
        </p>
      )}
    </div>
  );
}

function InsightsCard({ insights }) {
  if (!insights || insights.length === 0) return null;
  return (
    <div className="card-farm p-5">
      <h4 className="text-sm font-bold text-green-900 mb-3 flex items-center gap-2">
        <span className="text-xl">💡</span>
        Agronomic Insights
      </h4>
      <ul className="space-y-2.5">
        {insights.map((ins, i) => (
          <li
            key={i}
            className={`flex items-start gap-2.5 text-sm ${
              ins.type === 'good' ? 'text-green-800' : 'text-amber-800'
            }`}
          >
            <span className="shrink-0 mt-0.5">{ins.type === 'good' ? '✅' : '⚠️'}</span>
            <span>{ins.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ModelBadge({ modelUsed }) {
  const isHybrid = modelUsed?.includes('Hybrid');
  return (
    <div className="text-center">
      <span
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold ${
          isHybrid
            ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {isHybrid ? '🚀' : '📊'} {modelUsed}
      </span>
    </div>
  );
}

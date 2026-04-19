/**
 * Results Page - Agriculture-themed yield results
 */
import { useLocation, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import FloatingLeaves from '../components/FloatingLeaves';

function AnimatedNumber({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = parseFloat(value) || 0;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(+(eased * target).toFixed(2));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value, duration]);
  return <span>{display}</span>;
}

export default function Results() {
  const { state } = useLocation();

  if (!state?.result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <div className="text-5xl mb-4 opacity-30">🌾</div>
        <p className="text-gray-400 text-lg mb-4">No prediction results found.</p>
        <Link to="/predict" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
          Make a prediction →
        </Link>
      </div>
    );
  }

  const { result, input } = state;

  return (
    <div>
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-700 via-green-600 to-emerald-500 py-14">
        <FloatingLeaves />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 backdrop-blur rounded-full text-sm text-green-100 mb-4">
            <svg className="w-4 h-4 text-green-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Prediction Complete
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Your Harvest Prediction 🌾
          </h1>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 50" fill="none" className="w-full"><path d="M0 25C360 50 720 0 1080 25C1260 37.5 1350 50 1440 50V50H0V25Z" fill="rgb(250 250 249)" /></svg>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {/* Main Result */}
        <div className="card-farm overflow-hidden mb-6 animate-slide-up shadow-xl shadow-green-900/5">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-10 text-center border-b border-green-100">
            <p className="text-green-600/60 text-xs font-bold uppercase tracking-wider mb-3">Predicted Yield</p>
            <p className="text-6xl sm:text-7xl font-black text-green-800 mb-2 animate-number-pop">
              <AnimatedNumber value={result.predictedYield} />
            </p>
            <p className="text-green-600 text-lg font-semibold">{result.unit || 't/ha'}</p>
          </div>

          <div className="px-6 py-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-green-50/50 rounded-xl p-4 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Total Yield</p>
                <p className="text-xl font-black text-gray-800">
                  <AnimatedNumber value={result.totalYield} /> <span className="text-gray-400 text-sm font-medium">t</span>
                </p>
              </div>
              <div className="bg-green-50/50 rounded-xl p-4 text-center">
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Land Area</p>
                <p className="text-xl font-black text-gray-800">
                  {input?.landArea} <span className="text-gray-400 text-sm font-medium">ha</span>
                </p>
              </div>
            </div>

            <div className="border-t border-green-100 pt-5">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">Input Summary</p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Crop', value: input?.cropType },
                  { label: 'Soil', value: input?.soilType },
                  { label: 'Rainfall', value: `${input?.rainfall || '—'} mm` },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-[10px] text-gray-400 font-medium">{item.label}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {result.message && (
              <p className="text-sm text-gray-500 mt-5 italic">{result.message}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3 animate-fade-up delay-300">
          <Link to="/predict"
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white font-bold text-sm text-center shadow-lg shadow-green-600/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300">
            🌾 New Prediction
          </Link>
          <Link to="/"
            className="flex-1 py-3.5 rounded-xl border-2 border-gray-200 text-gray-500 font-semibold text-sm text-center hover:border-green-300 hover:text-green-700 transition-all duration-300">
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

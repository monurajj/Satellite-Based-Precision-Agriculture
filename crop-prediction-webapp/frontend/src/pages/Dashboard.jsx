/**
 * Dashboard - Agriculture-themed landing page with polish
 */
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { fetchHistory } from '../api/predictions';
import FloatingLeaves from '../components/FloatingLeaves';

const features = [
  {
    icon: '🌾', title: 'Crop Yield Prediction',
    desc: 'Predict harvest output using XGBoost trained on weather, soil, and satellite-derived vegetation indices.',
    link: '/predict', badge: 'Phase 1 · ML', badgeColor: 'bg-green-100 text-green-700',
    stat: 'R² = 0.85',
  },
  {
    icon: '🛰️', title: 'Land Cover Classification',
    desc: 'Classify Sentinel-2 satellite imagery into 10 land cover types with attention-based deep learning.',
    link: '/classify', badge: 'Phase 2 · DL', badgeColor: 'bg-indigo-100 text-indigo-600',
    stat: '98.2% Accuracy',
  },
  {
    icon: '🔬', title: 'Grad-CAM Explainability',
    desc: 'See exactly which regions of satellite imagery the neural network focuses on for each prediction.',
    link: '/classify', badge: 'Interpretability', badgeColor: 'bg-amber-100 text-amber-700',
    stat: 'Visual Heatmaps',
  },
  {
    icon: '📊', title: '4 Model Architectures',
    desc: 'Compare CNN, ResNet-50 + SE Attention, Vision Transformer, and custom SSAM side by side.',
    link: '/classify', badge: 'Benchmarks', badgeColor: 'bg-sky-100 text-sky-700',
    stat: 'Ablation Studies',
  },
];

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory().then(setHistory).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-800 via-green-700 to-emerald-600 min-h-[70vh] flex items-center">
        {/* Decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-400/20 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute bottom-10 -left-20 w-64 h-64 bg-green-300/15 rounded-full blur-3xl animate-float" />
          <div className="absolute top-1/2 right-1/3 w-40 h-40 bg-yellow-300/10 rounded-full blur-2xl" />
        </div>
        <FloatingLeaves />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <div className="max-w-3xl">
            <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-sm text-green-100 mb-8 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse-soft" />
              Satellite-Based Precision Agriculture
            </div>

            <h1 className="animate-fade-up delay-100 text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              Smart Farming with
              <br />
              <span className="text-green-200">AI & Satellite Data</span>
            </h1>

            <p className="animate-fade-up delay-200 text-lg sm:text-xl text-green-100/80 mb-10 max-w-xl leading-relaxed">
              Predict crop yields with machine learning. Classify land cover from satellite imagery with deep learning. Powered by Sentinel-2.
            </p>

            <div className="animate-fade-up delay-300 flex flex-wrap gap-4">
              <Link
                to="/predict"
                className="group px-7 py-3.5 bg-white text-green-800 font-bold rounded-2xl shadow-xl shadow-green-900/20 hover:shadow-2xl hover:shadow-green-900/30 hover:-translate-y-1 active:translate-y-0 transition-all duration-300 flex items-center gap-2"
              >
                🌾 Predict Yield
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/classify"
                className="px-7 py-3.5 bg-white/15 backdrop-blur text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/25 transition-all duration-300 hover:-translate-y-1 flex items-center gap-2"
              >
                🛰️ Classify Satellite Image
              </Link>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z" fill="rgb(250 250 249)" />
          </svg>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-14">
          <span className="text-green-600 text-sm font-bold tracking-wider uppercase">Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-black text-gray-900 mt-2 mb-4">
            Two Phases of Intelligence
          </h2>
          <p className="text-gray-500 max-w-lg mx-auto leading-relaxed">
            Machine learning for yield prediction meets deep learning for satellite image analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <Link
              key={i}
              to={f.link}
              className="group card-farm p-6 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center text-2xl group-hover:scale-110 group-hover:bg-green-100 transition-all duration-500">
                  {f.icon}
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${f.badgeColor}`}>
                  {f.badge}
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-green-700 transition-colors duration-300">
                {f.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{f.desc}</p>
              <div className="flex items-center justify-between pt-3 border-t border-green-50">
                <span className="text-xs font-bold text-green-600">{f.stat}</span>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="bg-green-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-green-300 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-emerald-300 rounded-full blur-3xl" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '98.2%', label: 'DL Accuracy', sub: 'EuroSAT Dataset' },
              { value: 'R\u00B2 = 0.85', label: 'ML Score', sub: 'XGBoost Model' },
              { value: '27K', label: 'Satellite Images', sub: 'Sentinel-2' },
              { value: '4', label: 'DL Architectures', sub: 'CNN / ResNet / ViT / SSAM' },
            ].map((s, i) => (
              <div key={i} className="text-center animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="text-3xl sm:text-4xl font-black text-white mb-1">{s.value}</div>
                <div className="text-sm font-semibold text-green-200">{s.label}</div>
                <div className="text-xs text-green-300/50 mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HISTORY ===== */}
      {!loading && history.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Predictions</h2>
            <Link to="/predict" className="text-sm text-green-600 hover:text-green-700 font-semibold transition-colors">
              New Prediction →
            </Link>
          </div>
          <div className="card-farm overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-green-50/50 text-left text-gray-500 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3.5 font-semibold">Crop</th>
                    <th className="px-5 py-3.5 font-semibold">Area</th>
                    <th className="px-5 py-3.5 font-semibold">Soil</th>
                    <th className="px-5 py-3.5 font-semibold">Yield</th>
                    <th className="px-5 py-3.5 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-green-50">
                  {history.slice(0, 5).map((p, i) => (
                    <tr key={i} className="hover:bg-green-50/30 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-gray-800">{p.cropType}</td>
                      <td className="px-5 py-3.5 text-gray-500">{p.landArea} ha</td>
                      <td className="px-5 py-3.5 text-gray-500">{p.soilType}</td>
                      <td className="px-5 py-3.5 font-bold text-green-700">{p.predictedYield} t/ha</td>
                      <td className="px-5 py-3.5 text-gray-500">{p.totalYield} t</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* ===== CTA ===== */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-10 sm:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white rounded-full blur-2xl" />
          </div>
          <div className="relative">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">Ready to get started?</h2>
            <p className="text-green-100/80 mb-8 max-w-md mx-auto">
              Try our AI-powered tools for free. No sign-up required.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/predict" className="px-8 py-3.5 bg-white text-green-800 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                🌾 Predict Yield
              </Link>
              <Link to="/classify" className="px-8 py-3.5 bg-white/20 text-white font-semibold rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300">
                🛰️ Classify Image
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

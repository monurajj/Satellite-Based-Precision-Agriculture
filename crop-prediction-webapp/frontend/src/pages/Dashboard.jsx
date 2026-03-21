/**
 * Dashboard - Business-oriented landing: Hero, What We Provide, CTAs, History
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import { fetchHistory } from '../api/predictions';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const PIE_COLORS = ['#2d5016', '#4a7c23', '#6b9c3a', '#8bbc52', '#a8d96e'];

const WHAT_WE_PROVIDE = [
  {
    icon: '📊',
    title: 'Yield Prediction',
    desc: 'AI-powered crop yield estimates combining soil, weather, and satellite data. Plan harvests and optimize inputs with data-driven insights.',
  },
  {
    icon: '🛰️',
    title: 'Satellite Analytics',
    desc: 'NDVI and earth observation data integrated into our models. Get precision insights without costly sensors or fieldwork.',
  },
  {
    icon: '🌤️',
    title: 'Weather Integration',
    desc: 'Automatic weather data for your location—rainfall, temperature, solar radiation—or enter values manually for any region.',
  },
  {
    icon: '📈',
    title: 'History & Analytics',
    desc: 'All predictions saved automatically. Track yields by crop, visualize trends, and make better decisions season after season.',
  },
];

export default function Dashboard() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  // Scroll to hash (e.g. #what-we-provide) when navigating from another page
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  async function loadHistory() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchHistory();
      setPredictions(data);
    } catch (err) {
      setError(err.message || 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  }

  // Chart data: yield by crop type
  const cropYieldData = predictions.reduce((acc, p) => {
    const crop = p.cropType || 'Other';
    const existing = acc.find((x) => x.name === crop);
    if (existing) {
      existing.total += p.totalYield || 0;
      existing.count += 1;
    } else {
      acc.push({ name: crop, total: p.totalYield || 0, count: 1 });
    }
    return acc;
  }, []);

  const pieData = cropYieldData.map((d) => ({ name: d.name, value: d.total }));

  return (
    <div className="space-y-0">
      {/* ========== HERO SECTION ========== */}
      <section className="relative w-[100vw] max-w-none -ml-[calc(50vw-50%)] -mt-4 sm:-mt-6 overflow-hidden rounded-b-3xl shadow-2xl">
        <div className="absolute inset-0 z-0">
          <img
            src="/imagefiles/image.png"
            alt="Satellite view of farmland"
            className="w-full h-full object-cover min-h-[420px] sm:min-h-[480px]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/85" />
        </div>
        <div className="relative z-10 px-6 py-20 sm:py-24 lg:py-32 max-w-4xl mx-auto text-center">
          <p className="text-farm-harvest font-bold uppercase tracking-[0.2em] text-sm mb-4 animate-fade-up">
            AgTech · Precision Agriculture
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.1] mb-5 animate-fade-up" style={{ animationDelay: '50ms' }}>
            Data-Driven Yield Intelligence for Modern Farmers
          </h1>
          <p className="text-gray-200 text-lg sm:text-xl lg:text-2xl max-w-2xl mx-auto mb-10 animate-fade-up leading-relaxed" style={{ animationDelay: '100ms' }}>
            Reduce uncertainty. Maximize harvests. Our AI combines satellite imagery, weather, and soil data to deliver accurate yield predictions—so you can plan with confidence.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up" style={{ animationDelay: '150ms' }}>
            <Link
              to="/predict"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-farm-harvest text-farm-green font-bold rounded-xl hover:bg-white hover:scale-105 active:scale-100 transition-all shadow-xl hover:shadow-2xl text-lg"
            >
              Start Free Prediction →
            </Link>
            <a
              href="#what-we-provide"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white/15 backdrop-blur-sm text-white font-bold rounded-xl border-2 border-white/40 hover:bg-white/25 hover:scale-105 active:scale-100 transition-all text-lg"
            >
              Learn What We Offer
            </a>
          </div>
        </div>
      </section>

      {/* ========== WHAT WE PROVIDE ========== */}
      <section id="what-we-provide" className="py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-farm-green mb-3">
            What We Provide
          </h2>
          <p className="text-farm-muted text-lg max-w-2xl mx-auto">
            Enterprise-grade precision agriculture tools, designed for farmers who want to make smarter decisions.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {WHAT_WE_PROVIDE.map((item, i) => (
            <Card key={i} delay={i * 80} className="hover:border-farm-harvest/50">
              <div className="flex items-start gap-4">
                <span className="text-4xl flex-shrink-0">{item.icon}</span>
                <div>
                  <h3 className="text-xl font-bold text-farm-green mb-2">{item.title}</h3>
                  <p className="text-farm-muted leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="text-center mt-10">
          <Link
            to="/predict"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-farm-green text-white font-bold rounded-xl hover:bg-green-800 hover:scale-105 active:scale-100 transition-all shadow-lg"
          >
            Try It Now — Free
          </Link>
        </div>
      </section>

      {/* ========== CTA BANNER ========== */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-farm-green to-green-800 rounded-2xl px-6 text-center text-white mb-12">
        <h3 className="text-2xl sm:text-3xl font-bold mb-3">Ready to plan your harvest?</h3>
        <p className="text-white/90 mb-6 max-w-xl mx-auto">Get your first yield prediction in under a minute. No sign-up required.</p>
        <Link
          to="/predict"
          className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-white text-farm-green font-bold rounded-xl hover:bg-farm-light hover:scale-105 active:scale-100 transition-all shadow-xl"
        >
          Get Yield Prediction
        </Link>
      </section>

      {/* ========== DASHBOARD CONTENT ========== */}
      <div id="dashboard" className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up">
          <div>
            <h2 className="text-2xl font-bold text-farm-green flex items-center gap-2">
              <span className="text-3xl">📊</span> Your Dashboard
            </h2>
            <p className="text-farm-muted mt-1">Track your crop predictions and yields</p>
          </div>
          <Link
            to="/predict"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-farm-green text-white font-bold rounded-xl hover:bg-green-800 hover:scale-105 active:scale-100 transition-all shadow-lg hover:shadow-xl"
          >
            <span>🌱</span> New Prediction
          </Link>
        </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <LoadingSpinner size="lg" label="Loading your predictions..." />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadHistory} />
      ) : (
        <>
          {/* Charts */}
          {predictions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 [&>*]:min-w-0">
              <Card title="Yield by Crop (tons)" icon="📈" delay={0}>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cropYieldData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [`${value.toFixed(1)} tons`, 'Total yield']}
                        contentStyle={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Bar dataKey="total" fill="#2d5016" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Share by Crop" icon="🥧" delay={100}>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius="40%"
                        outerRadius="55%"
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value.toFixed(1)} tons`, 'Yield']}
                        contentStyle={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        wrapperStyle={{ fontSize: '13px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* Predictions table */}
          <Card title={`Prediction History (${predictions.length})`} icon="📋" delay={200}>
            {predictions.length === 0 ? (
              <EmptyState
                title="No predictions yet"
                message="Start by creating your first crop yield prediction. It only takes a minute!"
              />
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-green-200">
                      <th className="px-3 py-3 font-semibold text-gray-700">Date</th>
                      <th className="px-3 py-3 font-semibold text-gray-700">Crop</th>
                      <th className="px-3 py-3 font-semibold text-gray-700">Area (ha)</th>
                      <th className="px-3 py-3 font-semibold text-gray-700">Soil</th>
                      <th className="px-3 py-3 font-semibold text-gray-700">Yield (tons)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p, i) => (
                      <tr
                        key={p.id}
                        className="border-b border-green-100 hover:bg-farm-light/60 transition-colors duration-200"
                        style={{
                          animation: 'fade-up 0.4s ease-out forwards',
                          animationDelay: `${300 + i * 50}ms`,
                          opacity: 0,
                        }}
                      >
                        <td className="px-3 py-3 text-sm">
                          {p.timestamp
                            ? new Date(p.timestamp).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-3 py-3 font-medium">{p.cropType || '—'}</td>
                        <td className="px-3 py-3">{p.landArea ?? '—'}</td>
                        <td className="px-3 py-3">{p.soilType || '—'}</td>
                        <td className="px-3 py-3 font-bold text-farm-green">
                          {p.totalYield != null ? `${p.totalYield.toFixed(1)} tons` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
      </div>
    </div>
  );
}

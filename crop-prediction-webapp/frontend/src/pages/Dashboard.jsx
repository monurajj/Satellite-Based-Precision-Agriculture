/**
 * Dashboard - Previous predictions + basic analytics
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
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
} from 'recharts';

const PIE_COLORS = ['#2d5016', '#4a7c23', '#6b9c3a', '#8bbc52', '#a8d96e'];

export default function Dashboard() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-farm-green">Dashboard</h1>
        <Link
          to="/predict"
          className="inline-flex items-center justify-center px-5 py-2.5 bg-farm-green text-white font-semibold rounded-lg hover:bg-green-800 transition"
        >
          + New Prediction
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : error ? (
        <ErrorMessage message={error} onRetry={loadHistory} />
      ) : (
        <>
          {/* Charts */}
          {predictions.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card title="Yield by Crop (tons)">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cropYieldData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value) => [`${value.toFixed(1)} tons`, 'Total yield']}
                        contentStyle={{ borderRadius: '8px' }}
                      />
                      <Bar dataKey="total" fill="#2d5016" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card title="Share by Crop">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) =>
                          percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''
                        }
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value.toFixed(1)} tons`, 'Yield']}
                        contentStyle={{ borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>
          )}

          {/* Predictions table */}
          <Card title={`Prediction History (${predictions.length})`}>
            {predictions.length === 0 ? (
              <div className="text-center py-10 text-farm-muted">
                <p className="mb-4">No predictions yet.</p>
                <Link
                  to="/predict"
                  className="text-farm-green font-medium hover:underline"
                >
                  Create your first prediction →
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-2">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-green-200">
                      <th className="px-3 py-2 font-semibold text-gray-700">Date</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Crop</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Area (ha)</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Soil</th>
                      <th className="px-3 py-2 font-semibold text-gray-700">Yield (tons)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p) => (
                      <tr key={p.id} className="border-b border-green-100 hover:bg-farm-light/50">
                        <td className="px-3 py-2 text-sm">
                          {p.timestamp
                            ? new Date(p.timestamp).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-3 py-2">{p.cropType || '—'}</td>
                        <td className="px-3 py-2">{p.landArea ?? '—'}</td>
                        <td className="px-3 py-2">{p.soilType || '—'}</td>
                        <td className="px-3 py-2 font-semibold text-farm-green">
                          {p.totalYield != null ? p.totalYield.toFixed(1) : '—'}
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
  );
}

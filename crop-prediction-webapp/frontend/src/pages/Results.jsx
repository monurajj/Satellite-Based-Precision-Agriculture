/**
 * Results Page - Celebrate prediction outcome with harvest-themed design
 */
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import AnimatedCounter from '../components/AnimatedCounter';

export default function Results() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const result = state?.result;
  const formData = state?.formData;

  if (!result) {
    return (
      <div className="space-y-6 animate-fade-up">
        <h1 className="text-2xl font-bold text-farm-green">Results</h1>
        <Card>
          <div className="text-center py-10">
            <p className="text-4xl mb-4">🌾</p>
            <p className="text-farm-muted mb-6">No prediction result found. Please run a new prediction.</p>
            <button
              onClick={() => navigate('/predict')}
              className="px-6 py-3 bg-farm-green text-white font-semibold rounded-xl hover:bg-green-800 hover:scale-105 transition-all"
            >
              New Prediction
            </button>
          </div>
        </Card>
      </div>
    );
  }

  const { predictedYield, totalYield, unit, message } = result;

  return (
    <div className="space-y-8 animate-fade-up">
      <h1 className="text-3xl font-bold text-farm-green flex items-center gap-3">
        <span className="text-4xl">🎉</span> Your Harvest Prediction
      </h1>

      <Card className="overflow-hidden">
        {/* Success highlight strip */}
        <div className="h-2 bg-gradient-to-r from-farm-green via-farm-harvest to-farm-green -mx-6 -mt-6 mb-6" />

        <div className="text-center py-8">
          <p className="text-farm-muted text-sm uppercase tracking-widest font-semibold mb-3">
            Estimated yield per hectare
          </p>
          <div
            className="text-5xl sm:text-6xl font-extrabold text-farm-green mb-2 animate-number-pop"
            style={{ animation: 'number-pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
          >
            <AnimatedCounter value={predictedYield} suffix={` ${unit}/ha`} />
          </div>
          <p className="text-farm-muted text-lg">
            for <strong className="text-farm-green">{formData?.cropType}</strong> on{' '}
            <strong>{formData?.landArea} ha</strong>
          </p>
        </div>

        <div className="border-t-2 border-green-100 pt-6 mt-4 bg-farm-light/30 -mx-6 -mb-6 px-6 py-5 rounded-b-2xl">
          <div className="flex items-start gap-3">
            <span className="text-3xl">📦</span>
            <div>
              <p className="text-xl font-bold text-gray-800">
                Total expected yield:{' '}
                <span className="text-farm-green text-2xl">
                  <AnimatedCounter value={totalYield} suffix={` ${unit}`} />
                </span>
              </p>
              <p className="text-sm text-farm-muted mt-1">{message}</p>
              <p className="text-xs text-farm-muted mt-2 flex items-center gap-1">
                <span>💾</span> Saved to your history
              </p>
            </div>
          </div>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => navigate('/predict')}
          className="flex-1 py-4 px-6 bg-farm-green text-white font-bold rounded-xl hover:bg-green-800 hover:scale-105 active:scale-100 transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <span>🌱</span> New Prediction
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex-1 py-4 px-6 bg-white border-2 border-farm-green text-farm-green font-bold rounded-xl hover:bg-farm-light hover:scale-105 active:scale-100 transition-all flex items-center justify-center gap-2"
        >
          <span>📊</span> Back to Dashboard
        </button>
      </div>
    </div>
  );
}

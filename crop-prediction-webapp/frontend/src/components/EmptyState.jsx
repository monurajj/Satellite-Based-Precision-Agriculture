/**
 * Friendly empty state with animated growing crop illustration
 */
import { Link } from 'react-router-dom';

export default function EmptyState({ title, message, ctaLabel = 'Create your first prediction', ctaHref = '/predict' }) {
  return (
    <div className="text-center py-12 px-4">
      {/* Animated sprout/crop SVG */}
      <div className="inline-block mb-6 animate-float">
        <svg width="120" height="100" viewBox="0 0 100 100" fill="none" className="drop-shadow-sm">
          <defs>
            <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#6b9c3a" />
              <stop offset="100%" stopColor="#8bbc52" />
            </linearGradient>
          </defs>
          <path
            d="M50 85 Q50 50 50 25"
            stroke="#2d5016"
            strokeWidth="4"
            strokeLinecap="round"
            className="origin-bottom animate-grow"
          />
          <path
            d="M50 45 Q35 35 30 20"
            stroke="url(#leafGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            style={{ animation: 'sway 2.5s ease-in-out infinite', transformOrigin: '50px 45px' }}
          />
          <path
            d="M50 55 Q65 45 70 30"
            stroke="url(#leafGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            style={{ animation: 'sway 2.7s ease-in-out infinite 0.2s', transformOrigin: '50px 55px' }}
          />
          <ellipse cx="50" cy="20" rx="8" ry="6" fill="#8bbc52" className="animate-grow" />
        </svg>
      </div>
      <p className="text-lg font-semibold text-farm-green mb-2">{title}</p>
      <p className="text-farm-muted mb-6 max-w-xs mx-auto">{message}</p>
      <Link
        to={ctaHref}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-farm-green text-white font-semibold rounded-full hover:bg-green-800 hover:scale-105 active:scale-100 transition-all shadow-md hover:shadow-lg"
      >
        <span>🌱</span> {ctaLabel} →
      </Link>
    </div>
  );
}

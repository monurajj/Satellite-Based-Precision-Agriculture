/**
 * Layout - Sticky navbar + main content
 * Business-ready navigation with clear CTAs
 */
import { Link, useLocation } from 'react-router-dom';
import CropDecoration from './CropDecoration';

const navItems = [
  { path: '/', label: 'Home' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-farm-green text-white shadow-lg overflow-hidden">
        {/* Subtle grain texture */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_50%,_white_0%,_transparent_50%)]" aria-hidden />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-lg sm:text-xl font-bold text-white hover:text-farm-harvest transition-colors shrink-0"
            >
              <span className="text-2xl sm:text-3xl" style={{ animation: 'sway 3s ease-in-out infinite' }}>
                🌾
              </span>
              <span className="sm:hidden">Yield Predictor</span>
              <span className="hidden sm:inline">Crop Yield Predictor</span>
            </Link>

            <nav className="flex items-center gap-1 sm:gap-2" aria-label="Main navigation">
              {navItems.map(({ path, label }) => {
                const isActive = path === '/' && isHome;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-white/90 hover:bg-white/15 hover:text-white'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              <Link
                to="/predict"
                className="ml-2 sm:ml-4 px-4 sm:px-5 py-2.5 bg-farm-harvest text-farm-green font-bold rounded-lg text-sm sm:text-base hover:bg-white hover:scale-[1.02] active:scale-100 transition-all shadow-md"
              >
                Get Prediction
              </Link>
            </nav>
          </div>
        </div>
        <CropDecoration />
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-green-200 bg-gradient-to-b from-white to-farm-light/50 py-8 text-center">
        <div className="mb-4">
          <Link
            to="/predict"
            className="inline-flex items-center gap-2 px-6 py-3 bg-farm-green text-white font-bold rounded-xl hover:bg-green-800 hover:scale-105 transition-all shadow-lg"
          >
            Start Free Prediction
          </Link>
        </div>
        <p className="flex items-center justify-center gap-2 flex-wrap text-sm text-farm-muted">
          <span>🌿 Satellite & AI-powered yield intelligence</span>
          <span className="hidden sm:inline">·</span>
          <span>Free for farmers</span>
        </p>
        <p className="mt-2 text-xs text-farm-muted/80">Predictions saved automatically. No sign-up required.</p>
      </footer>
    </div>
  );
}

/**
 * Layout - Navbar + main content wrapper
 * Simple nav for farmers to move between sections
 */
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Dashboard' },
  { path: '/predict', label: 'New Prediction' },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-farm-green text-white shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/" className="text-xl font-semibold">
              🌾 Crop Yield Predictor
            </Link>
            <nav className="flex gap-4" aria-label="Main navigation">
              {navItems.map(({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className={`px-3 py-1.5 rounded transition ${
                    location.pathname === path
                      ? 'bg-white/20 font-medium'
                      : 'hover:bg-white/10'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-green-200 bg-white/50 py-3 text-center text-sm text-farm-muted">
        Built for small farmers • Crop Yield Prediction
      </footer>
    </div>
  );
}

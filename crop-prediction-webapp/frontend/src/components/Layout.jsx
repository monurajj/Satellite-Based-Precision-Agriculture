/**
 * Layout - Clean agriculture-themed navbar + footer
 */
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Home' },
  { path: '/predict', label: 'Yield Prediction', badge: 'ML' },
  { path: '/classify', label: 'Land Cover', badge: 'DL' },
];

export default function Layout({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-green-100/50 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-600 to-emerald-500 flex items-center justify-center shadow-md shadow-green-600/20 group-hover:shadow-green-600/30 transition-all duration-300 group-hover:scale-105">
                <span className="text-white text-lg">🌾</span>
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-extrabold text-green-900 tracking-tight">AgriSat</span>
                <span className="text-[10px] text-green-600/60 block -mt-0.5 font-semibold tracking-wider uppercase">Precision Agriculture</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map(({ path, label, badge }) => {
                const isActive = location.pathname === path;
                return (
                  <Link
                    key={path}
                    to={path}
                    className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                      isActive
                        ? 'bg-green-50 text-green-800 shadow-sm'
                        : 'text-gray-500 hover:text-green-800 hover:bg-green-50/50'
                    }`}
                  >
                    {label}
                    {badge && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        isActive
                          ? badge === 'DL' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {badge}
                      </span>
                    )}
                    {isActive && <span className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green-500 rounded-full" />}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile */}
            <button
              className="md:hidden p-2 rounded-xl text-gray-500 hover:text-green-800 hover:bg-green-50"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>

          {mobileOpen && (
            <div className="md:hidden pb-4 pt-2 space-y-1 animate-fade-in">
              {navItems.map(({ path, label, badge }) => (
                <Link key={path} to={path} onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-sm font-semibold ${
                    location.pathname === path ? 'bg-green-50 text-green-800' : 'text-gray-500'
                  }`}>
                  {label} {badge && <span className="text-xs opacity-50 ml-1">({badge})</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-green-900 text-green-200/60 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <span className="text-sm font-bold text-white">AgriSat</span>
          </div>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/predict" className="hover:text-white transition-colors">Yield Prediction</Link>
            <Link to="/classify" className="hover:text-white transition-colors">Land Cover</Link>
          </div>
          <p className="text-xs">Satellite & AI-powered precision agriculture</p>
        </div>
      </footer>
    </div>
  );
}

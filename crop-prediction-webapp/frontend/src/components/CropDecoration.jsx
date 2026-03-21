/**
 * Animated crop/wheat stalks for farmer-friendly visual appeal
 */
export default function CropDecoration() {
  return (
    <div className="absolute inset-x-0 bottom-0 overflow-hidden pointer-events-none h-16">
      <svg
        viewBox="0 0 400 60"
        className="w-full h-full opacity-90"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="wheatStalk" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a8d96e" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#6b9c3a" stopOpacity="1" />
            <stop offset="100%" stopColor="#2d5016" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        {/* Animated wheat stalks - staggered sway */}
        <g style={{ transformOrigin: '30px 55px', animation: 'sway 3s ease-in-out infinite' }}>
          <path d="M30 55 Q28 40 30 20" stroke="url(#wheatStalk)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M30 20 q-3 -2 -2 -5" stroke="#e8f5e0" strokeWidth="2" fill="none" />
          <path d="M30 25 q2 -1 1 -4" stroke="#e8f5e0" strokeWidth="1.5" fill="none" />
        </g>
        <g style={{ transformOrigin: '100px 58px', animation: 'sway 3.2s ease-in-out infinite 0.1s' }}>
          <path d="M100 58 Q102 35 98 18" stroke="url(#wheatStalk)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M98 18 q2 -3 -1 -4" stroke="#e8f5e0" strokeWidth="1.5" fill="none" />
        </g>
        <g style={{ transformOrigin: '200px 52px', animation: 'sway 2.8s ease-in-out infinite 0.2s' }}>
          <path d="M200 52 Q198 30 202 15" stroke="url(#wheatStalk)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M202 15 q-2 -2 2 -5" stroke="#e8f5e0" strokeWidth="2" fill="none" />
        </g>
        <g style={{ transformOrigin: '300px 55px', animation: 'sway 3.1s ease-in-out infinite 0.15s' }}>
          <path d="M300 55 Q302 38 298 22" stroke="url(#wheatStalk)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M298 22 q1 -3 -2 -4" stroke="#e8f5e0" strokeWidth="1.5" fill="none" />
        </g>
        <g style={{ transformOrigin: '370px 50px', animation: 'sway 2.9s ease-in-out infinite 0.25s' }}>
          <path d="M370 50 Q368 28 372 12" stroke="url(#wheatStalk)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M372 12 q-3 -2 0 -5" stroke="#e8f5e0" strokeWidth="2" fill="none" />
        </g>
      </svg>
    </div>
  );
}

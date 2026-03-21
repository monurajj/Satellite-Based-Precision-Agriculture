/**
 * Crop-themed loading spinner - growing plant animation for farmers
 */
export default function LoadingSpinner({ size = 'md', label = 'Loading...' }) {
  const sizeMap = {
    sm: { w: 32, h: 40 },
    md: { w: 48, h: 56 },
    lg: { w: 64, h: 72 },
  };
  const { w, h } = sizeMap[size];

  return (
    <div className="flex flex-col items-center gap-2" role="status" aria-label="Loading">
      <svg
        width={w}
        height={h}
        viewBox="0 0 48 56"
        fill="none"
        className="animate-float"
      >
        <defs>
          <linearGradient id="stalkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#6b9c3a" />
            <stop offset="100%" stopColor="#2d5016" />
          </linearGradient>
        </defs>
        {/* Stalk with pulse */}
        <path
          d="M24 52 L24 20"
          stroke="url(#stalkGrad)"
          strokeWidth="4"
          strokeLinecap="round"
          className="origin-bottom"
          style={{ animation: 'grow 1.2s ease-in-out infinite alternate' }}
        />
        {/* Leaves swaying */}
        <path
          d="M24 35 Q14 28 10 15"
          stroke="#8bbc52"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          style={{ animation: 'sway 1.5s ease-in-out infinite', transformOrigin: '24px 35px' }}
        />
        <path
          d="M24 40 Q34 33 38 20"
          stroke="#8bbc52"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
          style={{ animation: 'sway 1.5s ease-in-out infinite 0.2s', transformOrigin: '24px 40px' }}
        />
        {/* Seed head */}
        <circle
          cx="24"
          cy="16"
          r="6"
          fill="#a8d96e"
          style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
        />
      </svg>
      {label && (
        <span className="text-xs text-farm-muted font-medium">{label}</span>
      )}
    </div>
  );
}

/**
 * Reusable Card component for sections - farmer-friendly with subtle animations
 */
export default function Card({ title, icon, children, className = '', delay = 0 }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-md border border-green-100/80 p-6 hover:shadow-lg hover:border-farm-harvest/30 transition-all duration-300 ${className}`}
      style={{
        ...(delay ? {
          animation: 'fade-up 0.5s ease-out forwards',
          animationDelay: `${delay}ms`,
          opacity: 0,
        } : {}),
      }}
    >
      {title && (
        <h2 className="flex items-center gap-2 text-lg font-bold text-farm-green mb-4">
          {icon && <span className="text-xl">{icon}</span>}
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

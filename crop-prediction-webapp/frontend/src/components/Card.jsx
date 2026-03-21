/**
 * Reusable Card component for sections
 */
export default function Card({ title, children, className = '' }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-green-100 p-5 ${className}`}
    >
      {title && (
        <h2 className="text-lg font-semibold text-farm-green mb-4">{title}</h2>
      )}
      {children}
    </div>
  );
}

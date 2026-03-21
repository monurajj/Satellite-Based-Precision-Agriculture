/**
 * Loading spinner for async states
 */
export default function LoadingSpinner({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-2',
    lg: 'w-14 h-14 border-3',
  };

  return (
    <div
      className={`${sizeClasses[size]} border-farm-green border-t-transparent rounded-full animate-spin`}
      role="status"
      aria-label="Loading"
    />
  );
}

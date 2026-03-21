/**
 * Error message display - farmer-friendly, accessible
 */
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-amber-900 animate-fade-up"
    >
      <p className="flex items-center gap-2 font-bold">
        <span className="text-xl">⚠️</span> Oops, something went wrong
      </p>
      <p className="text-sm mt-2 text-amber-800">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-amber-600 text-white font-semibold rounded-xl hover:bg-amber-700 transition"
        >
          Try again
        </button>
      )}
    </div>
  );
}

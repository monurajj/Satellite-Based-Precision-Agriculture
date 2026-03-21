/**
 * Error message display - accessible and visible
 */
export default function ErrorMessage({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800"
    >
      <p className="font-medium">Something went wrong</p>
      <p className="text-sm mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
        >
          Try again
        </button>
      )}
    </div>
  );
}

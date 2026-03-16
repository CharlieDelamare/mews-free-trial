'use client';
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-mews-linen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Something went wrong</h1>
        <p className="text-gray-600 mb-6">An unexpected error occurred.</p>
        <button onClick={reset} className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors">
          Try again
        </button>
      </div>
    </main>
  );
}

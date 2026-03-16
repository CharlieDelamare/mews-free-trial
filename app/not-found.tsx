import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="min-h-screen bg-mews-linen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Page not found</h1>
        <p className="text-gray-600 mb-6">The page you are looking for does not exist.</p>
        <Link href="/create" className="px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors">
          Go to Create Sandbox
        </Link>
      </div>
    </main>
  );
}

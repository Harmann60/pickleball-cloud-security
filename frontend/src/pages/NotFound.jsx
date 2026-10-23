import { Link } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-3xl bg-courtly-100 text-courtly-700">
        <SearchX className="size-7" aria-hidden="true" />
      </div>
      <div>
        <h1 className="font-display text-3xl font-semibold text-ink-900">Page not found</h1>
        <p className="mt-2 text-sm text-ink-500">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-full bg-courtly-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-courtly-800 focus-ring"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to dashboard
      </Link>
    </div>
  );
}

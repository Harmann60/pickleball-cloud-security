import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Loader2, LogOut, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { getAdminBookings, createTournamentReport } from '../lib/api';
import { courtName, formatDate, formatTime, minutesToLabel } from '../lib/format';
import { useToast } from '../context/ToastContext';

export default function AdminDashboard() {
  const { token, hasToken, clearToken } = useAdminAuth();
  const { pushToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState({ title: '', content: '' });
  const [reportErrors, setReportErrors] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadBookings = useCallback(
    async (signal) => {
      if (!token) return;
      try {
        setLoading(true);
        setError(null);
        const response = await getAdminBookings(token, signal);
        setBookings(response.bookings || []);
        // Courts are not returned by /api/admin/bookings; we do not guess.
        setCourts([]);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadBookings(controller.signal);
    return () => controller.abort();
  }, [loadBookings]);

  async function handleRefresh() {
    const controller = new AbortController();
    await loadBookings(controller.signal);
  }

  async function handleReportSubmit(event) {
    event.preventDefault();
    setReportErrors([]);
    if (!token) return;

    if (report.title.trim().length < 3) {
      setReportErrors(['Title must be at least 3 characters.']);
      return;
    }
    if (report.content.trim().length < 10) {
      setReportErrors(['Content must be at least 10 characters.']);
      return;
    }

    setUploading(true);
    try {
      const response = await createTournamentReport(token, {
        title: report.title.trim(),
        content: report.content,
      });
      pushToast({
        title: 'Report stored',
        message: response.message,
      });
      setReport({ title: '', content: '' });
    } catch (err) {
      if (err.details && err.details.length > 0) {
        setReportErrors(err.details);
      }
      pushToast({
        type: 'error',
        title: 'Upload failed',
        message: err.details?.join(' ') || err.message,
      });
    } finally {
      setUploading(false);
    }
  }

  if (!hasToken) {
    return (
      <div className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <ShieldAlert className="size-6" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-semibold text-ink-900">
          Admin token required
        </h1>
        <p className="text-sm text-ink-500">
          Enter the bearer token on the admin login page. The token is never stored in
          `localStorage` and is only kept in memory for this session.
        </p>
        <Link
          to="/admin/login"
          className="inline-flex items-center gap-2 rounded-full bg-courtly-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-courtly-800 focus-ring"
        >
          Go to admin login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-3xl border border-courtly-900/10 bg-white/95 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-courtly-900/5 px-6 py-5 sm:px-8">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-900 sm:text-2xl">
              Admin dashboard
            </h1>
            <p className="text-sm text-ink-500">
              Server-side authorization enforced on every request
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 rounded-full border border-courtly-900/10 px-4 py-2 text-sm text-ink-600 transition hover:bg-courtly-50 focus-ring"
              disabled={loading}
            >
              <RefreshCw className={loading ? 'size-4 animate-spin' : 'size-4'} aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              onClick={clearToken}
              className="inline-flex items-center gap-2 rounded-full border border-courtly-900/10 px-4 py-2 text-sm text-ink-600 transition hover:bg-courtly-50 focus-ring"
            >
              <LogOut className="size-4" aria-hidden="true" />
              Clear token
            </button>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-6 sm:px-8">
            <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
              <p className="font-semibold">
                {error.kind === 'auth' ? 'Authorization failed' : 'Unable to load bookings'}
              </p>
              <p className="mt-1 text-red-700/80">{error.message}</p>
              {error.kind === 'auth' ? (
                <p className="mt-2 text-xs text-red-700/60">
                  The token may be incorrect or expired on the backend. Return to the
                  login page to update it.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-courtly-50/60 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-6 py-3">Booking ID</th>
                <th className="px-6 py-3">Player</th>
                <th className="px-6 py-3">Court</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Time</th>
                <th className="px-6 py-3">Duration</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-courtly-900/5">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <div className="h-3 w-16 animate-pulse rounded-full bg-courtly-50" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 w-32 animate-pulse rounded-full bg-courtly-50" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 w-28 animate-pulse rounded-full bg-courtly-50" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 w-20 animate-pulse rounded-full bg-courtly-50" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 w-12 animate-pulse rounded-full bg-courtly-50" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 w-16 animate-pulse rounded-full bg-courtly-50" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-3 w-40 animate-pulse rounded-full bg-courtly-50" />
                      </td>
                    </tr>
                  ))
                : bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-courtly-50/40">
                      <td className="px-6 py-4 font-medium text-ink-900">
                        {booking.id}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-ink-900">{booking.playerName}</p>
                          <p className="text-xs text-ink-500">{booking.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-ink-700">
                        {courtName(courts, booking.courtId)}
                      </td>
                      <td className="px-6 py-4 text-ink-700">
                        {formatDate(booking.date)}
                      </td>
                      <td className="px-6 py-4 text-ink-700">
                        {formatTime(booking.startTime)}
                      </td>
                      <td className="px-6 py-4 text-ink-700">
                        {minutesToLabel(booking.durationMins)}
                      </td>
                      <td className="px-6 py-4 text-xs text-ink-500">
                        {booking.createdAt ? formatDate(booking.createdAt.slice(0, 10)) : '—'}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!loading && !error && bookings.length === 0 ? (
            <p className="px-6 py-6 text-sm text-ink-500">No bookings found.</p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-courtly-900/10 bg-white/95 shadow-sm">
          <div className="border-b border-courtly-900/5 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-2xl bg-courtly-100 text-courtly-700">
                <FileText className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  Store tournament report
                </h2>
                <p className="text-sm text-ink-500">
                  Uploads to Amazon S3 via the EC2 instance role (JSON body, no multipart)
                </p>
              </div>
            </div>
          </div>
          <form className="flex flex-col gap-4 px-6 py-5" onSubmit={handleReportSubmit}>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink-700">Report title</span>
              <input
                type="text"
                value={report.title}
                onChange={(event) => setReport((current) => ({ ...current, title: event.target.value }))}
                className="rounded-2xl border border-courtly-900/10 px-4 py-2.5 text-sm text-ink-900 shadow-sm transition focus:border-courtly-500 focus:outline-none focus:ring-2 focus:ring-courtly-400/40"
                maxLength={80}
                placeholder="Fall Open — Final Results"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink-700">Report content</span>
              <textarea
                rows={6}
                value={report.content}
                onChange={(event) => setReport((current) => ({ ...current, content: event.target.value }))}
                className="rounded-2xl border border-courtly-900/10 px-4 py-2.5 text-sm text-ink-900 shadow-sm transition focus:border-courtly-500 focus:outline-none focus:ring-2 focus:ring-courtly-400/40"
                maxLength={20000}
                placeholder="Champion: Team A (fictional data)..."
              />
              <span className="text-xs text-ink-500">
                Content between 10 and 20000 characters. Private key or AWS credential
                material is rejected server-side.
              </span>
            </label>
            {reportErrors.length > 0 ? (
              <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
                <p className="font-semibold">Upload failed</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-red-700/90">
                  {reportErrors.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center gap-2 self-start rounded-full bg-courtly-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-courtly-800 disabled:cursor-not-allowed disabled:opacity-60 focus-ring"
            >
              {uploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Uploading to S3
                </>
              ) : (
                <>
                  <FileText className="size-4" aria-hidden="true" />
                  Upload report
                </>
              )}
            </button>
          </form>
        </div>
        <div className="flex flex-col gap-4">
          <article className="rounded-3xl border border-courtly-900/10 bg-white/90 p-6 shadow-sm">
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Security reminder
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-ink-500">
              <li>• This is a prototype bearer-token control, not a full authentication system</li>
              <li>• The token is kept in memory only — never persisted</li>
              <li>• Reports are stored as private objects in S3 with SSE-S3 encryption</li>
              <li>• The bucket uses Block Public Access and the EC2 role is least-privileged</li>
              <li>• All requests must include `Authorization: Bearer &lt;token&gt;`</li>
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}

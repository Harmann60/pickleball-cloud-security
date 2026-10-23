import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  ShieldCheck,
  LayoutDashboard,
  ArrowRight,
  CircleDot,
} from 'lucide-react';
import { getDashboard } from '../lib/api';
import { courtName, formatDate, formatTime, minutesToLabel } from '../lib/format';
import { cx } from '../lib/format';

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-3xl border border-courtly-900/10 bg-white/80 p-6 shadow-sm">
      <div className="h-4 w-24 rounded-full bg-courtly-100" />
      <div className="mt-4 h-8 w-16 rounded-full bg-courtly-100" />
      <div className="mt-2 h-3 w-32 rounded-full bg-courtly-50" />
    </div>
  );
}

function StatusPill({ status }) {
  const isOpen = status === 'open';
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        isOpen
          ? 'bg-courtly-100 text-courtly-700'
          : 'bg-amber-50 text-amber-700'
      )}
    >
      <CircleDot className="size-2" aria-hidden="true" />
      {status === 'open' ? 'Open' : status === 'maintenance' ? 'Maintenance' : status}
    </span>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const response = await getDashboard(controller.signal);
        setData(response);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, []);

  const courts = data?.courts ?? [];
  const tournaments = data?.tournaments ?? [];
  const bookings = data?.bookings ?? [];
  const openCourts = courts.filter((court) => court.status === 'open').length;

  return (
    <div className="flex flex-col gap-8">
      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="relative overflow-hidden rounded-3xl border border-courtly-900/10 bg-gradient-to-br from-courtly-900 via-courtly-800 to-courtly-700 p-6 shadow-[0_60px_120px_-80px_rgba(8,43,31,1)] sm:p-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-courtly-400/20 blur-3xl" />
          <div className="relative flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.4em] text-courtly-200">
                Courtly
              </span>
              <span className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-white/80">
                AWS Cloud Security Demonstration
              </span>
            </div>
            <div className="max-w-xl space-y-4">
              <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Secure pickleball court management
              </h1>
              <p className="text-base text-courtly-100/90 sm:text-lg">
                A polished control panel that exercises IAM least privilege, encrypted
                private storage, server-side validation, and protected administrative
                workflows.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/book"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-courtly-900 transition hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-40px_rgba(255,255,255,1)] focus-ring"
              >
                <CalendarCheck2 className="size-4" aria-hidden="true" />
                Book a court
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/admin/login"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10 focus-ring"
              >
                <ShieldCheck className="size-4" aria-hidden="true" />
                Admin area
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {loading ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : (
            <>
              <article className="rounded-3xl border border-courtly-900/10 bg-white/90 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-500">Open courts</p>
                  <LayoutDashboard className="size-4 text-courtly-600" aria-hidden="true" />
                </div>
                <p className="mt-3 font-display text-4xl font-bold text-ink-900">
                  {openCourts}
                  <span className="ml-2 text-base font-medium text-ink-500">
                    / {courts.length}
                  </span>
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  Courts ready for booking in the current schedule
                </p>
              </article>
              <article className="rounded-3xl border border-courtly-900/10 bg-white/90 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-500">Bookings on record</p>
                  <CalendarCheck2 className="size-4 text-courtly-600" aria-hidden="true" />
                </div>
                <p className="mt-3 font-display text-4xl font-bold text-ink-900">
                  {bookings.length}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  Existing reservations loaded from the API
                </p>
              </article>
              <article className="rounded-3xl border border-courtly-900/10 bg-white/90 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-ink-500">Tournaments</p>
                  <ShieldCheck className="size-4 text-courtly-600" aria-hidden="true" />
                </div>
                <p className="mt-3 font-display text-4xl font-bold text-ink-900">
                  {tournaments.length}
                </p>
                <p className="mt-1 text-sm text-ink-500">
                  Fictional events for demonstration purposes
                </p>
              </article>
            </>
          )}
        </div>
      </section>

      {error ? (
        <section className="rounded-3xl border border-red-200 bg-red-50/80 p-6 text-sm text-red-800">
          <p className="font-semibold">Cannot load the dashboard</p>
          <p className="mt-1 text-red-700/80">{error.message}</p>
          <p className="mt-2 text-xs text-red-700/60">
            If you are running locally, start the backend on port 3000 or use the Vite
            proxy. For a public deployment, set `VITE_API_BASE_URL` to a secure HTTPS
            API endpoint.
          </p>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="rounded-3xl border border-courtly-900/10 bg-white/90 shadow-sm">
          <div className="flex items-center justify-between border-b border-courtly-900/5 px-6 py-5">
            <div>
              <h2 className="font-display text-lg font-semibold text-ink-900">
                Court availability
              </h2>
              <p className="text-sm text-ink-500">
                Status reported by the API. Maintenance courts cannot be booked.
              </p>
            </div>
            <Link
              to="/book"
              className="hidden items-center gap-2 text-sm font-medium text-courtly-700 transition hover:text-courtly-800 sm:flex focus-ring"
            >
              New booking
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-16 animate-pulse rounded-2xl bg-courtly-50"
                  />
                ))
              : courts.map((court) => (
                  <article
                    key={court.id}
                    className="flex items-center justify-between rounded-2xl border border-courtly-900/10 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-ink-900">{court.name}</p>
                      <p className="text-sm text-ink-500">{court.surface}</p>
                    </div>
                    <StatusPill status={court.status} />
                  </article>
                ))}
            {!loading && courts.length === 0 ? (
              <p className="col-span-full text-sm text-ink-500">
                No court information available from the API.
              </p>
            ) : null}
          </div>
        </div>

        <div className="rounded-3xl border border-courtly-900/10 bg-white/90 shadow-sm">
          <div className="flex items-center justify-between border-b border-courtly-900/5 px-6 py-5">
            <div>
                <h2 className="font-display text-lg font-semibold text-ink-900">
                  Booking schedule
                </h2>
                <p className="text-sm text-ink-500">
                  Ordered by date and time by the backend
                </p>
            </div>
          </div>
          <div className="flex flex-col divide-y divide-courtly-900/5">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center gap-4 px-6 py-4">
                    <div className="h-10 w-10 animate-pulse rounded-full bg-courtly-50" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-40 animate-pulse rounded-full bg-courtly-50" />
                      <div className="h-2 w-56 animate-pulse rounded-full bg-courtly-50/80" />
                    </div>
                  </div>
                ))
              : bookings.slice(0, 5).map((booking) => (
                  <article key={booking.id} className="flex items-center gap-4 px-6 py-4">
                    <div className="flex size-10 items-center justify-center rounded-full bg-courtly-100 text-courtly-700">
                      <CalendarCheck2 className="size-4" aria-hidden="true" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-ink-900">{booking.playerName}</p>
                      <p className="text-sm text-ink-500">
                        {courtName(courts, booking.courtId)} · {formatDate(booking.date)}{' '}
                        at {formatTime(booking.startTime)} · {minutesToLabel(booking.durationMins)}
                      </p>
                    </div>
                    <span className="hidden rounded-full border border-courtly-900/10 px-2.5 py-1 text-xs text-ink-500 sm:inline-flex">
                      ID {booking.id}
                    </span>
                  </article>
                ))}
            {!loading && bookings.length === 0 ? (
              <p className="px-6 py-6 text-sm text-ink-500">
                No bookings yet. Be the first to{' '}
                <Link to="/book" className="font-medium text-courtly-700 hover:text-courtly-800">
                  book a court
                </Link>
                .
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-courtly-900/10 bg-white/90 shadow-sm">
        <div className="flex items-center justify-between border-b border-courtly-900/5 px-6 py-5">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-900">
              Tournaments
            </h2>
            <p className="text-sm text-ink-500">
              Fictional sample records used for the demonstration
            </p>
          </div>
        </div>
        <div className="grid gap-3 px-6 py-5 sm:grid-cols-2">
          {loading
            ? Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-20 animate-pulse rounded-2xl bg-courtly-50" />
              ))
            : tournaments.map((tournament) => (
                <article
                  key={tournament.id}
                  className="flex flex-col gap-2 rounded-2xl border border-courtly-900/10 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-ink-900">{tournament.name}</p>
                    <span className="rounded-full bg-courtly-100 px-2.5 py-1 text-xs text-courtly-700">
                      {tournament.status.replace('-', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-ink-500">
                    {formatDate(tournament.date)} · {tournament.format} · {tournament.teams} teams
                  </p>
                </article>
              ))}
        </div>
      </section>
    </div>
  );
}

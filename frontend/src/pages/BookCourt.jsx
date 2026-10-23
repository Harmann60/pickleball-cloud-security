import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck2, Clock, Loader2 } from 'lucide-react';
import { createBooking, getDashboard } from '../lib/api';
import { todayISO, minutesToLabel } from '../lib/format';
import { useToast } from '../context/ToastContext';

const DURATIONS = [30, 60, 90];
const TIME_SLOTS = [
  '07:00',
  '07:30',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '18:30',
  '19:00',
  '20:00',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,59}$/;

function validate(values) {
  const errors = {};
  const playerName = values.playerName.trim();
  const email = values.email.trim().toLowerCase();

  if (!NAME_RE.test(playerName)) {
    errors.playerName =
      'Enter 2-60 letters and spaces only (hyphens/apostrophes allowed).';
  }
  if (!EMAIL_RE.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (!values.courtId) {
    errors.courtId = 'Select a court.';
  }
  if (!values.date) {
    errors.date = 'Select a date.';
  } else if (values.date < todayISO()) {
    errors.date = 'Date cannot be in the past.';
  }
  if (!values.startTime) {
    errors.startTime = 'Select a time slot.';
  }
  if (!DURATIONS.includes(Number(values.durationMins))) {
    errors.durationMins = 'Select a valid duration.';
  }

  return { errors, isValid: Object.keys(errors).length === 0, playerName, email };
}

export default function BookCourt() {
  const { pushToast } = useToast();
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingCourts, setLoadingCourts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    playerName: '',
    email: '',
    courtId: '',
    date: todayISO(),
    startTime: '18:00',
    durationMins: 60,
  });
  const [errors, setErrors] = useState({});
  const [serverErrors, setServerErrors] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        setLoadingCourts(true);
        const response = await getDashboard(controller.signal);
        const openCourts = (response.courts || []).filter(
          (court) => court.status === 'open'
        );
        setCourts(openCourts);
        setBookings(response.bookings || []);
      } catch (err) {
        pushToast({
          type: 'error',
          title: 'Unable to load courts',
          message: err.message,
        });
      } finally {
        setLoadingCourts(false);
      }
    }
    load();
    return () => controller.abort();
  }, [pushToast]);

  useEffect(() => {
    if (courts.length === 0) return;
    if (courts.some((court) => court.id === form.courtId)) return;
    setForm((current) => ({ ...current, courtId: courts[0].id }));
  }, [courts, form.courtId]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerErrors([]);
  }

  const bookedSlots = useMemo(() => {
    if (!form.courtId || !form.date) return new Set();
    const set = new Set();
    for (const booking of bookings) {
      if (booking.courtId !== form.courtId || booking.date !== form.date) continue;
      set.add(booking.startTime);
    }
    return set;
  }, [bookings, form.courtId, form.date]);

  async function handleSubmit(event) {
    event.preventDefault();
    setServerErrors([]);
    const { errors: clientErrors, isValid, playerName, email } = validate(form);

    if (!isValid) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await createBooking({
        playerName,
        email,
        courtId: form.courtId,
        date: form.date,
        startTime: form.startTime,
        durationMins: Number(form.durationMins),
      });

      pushToast({
        title: 'Booking confirmed',
        message: response.message,
      });

      setForm((current) => ({
        ...current,
        playerName: '',
        email: '',
      }));
      setErrors({});

      const refreshed = await getDashboard();
      setBookings(refreshed.bookings || []);
    } catch (err) {
      if (err.details && err.details.length > 0) {
        setServerErrors(err.details);
      }
      pushToast({
        type: 'error',
        title: 'Booking failed',
        message: err.details?.join(' ') || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCourt = courts.find((court) => court.id === form.courtId);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <section className="rounded-3xl border border-courtly-900/10 bg-white/95 shadow-sm">
        <div className="border-b border-courtly-900/5 px-6 py-6 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-courtly-100 px-3 py-1 text-xs text-courtly-700">
              <CalendarCheck2 className="size-3.5" aria-hidden="true" />
              Reservation form
            </span>
          </div>
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
            Book a court
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-500 sm:text-base">
            All bookings are validated on the server. Slots shown as suggested may still
            be rejected if they are already taken or if the court becomes unavailable.
          </p>
        </div>

        <form className="grid gap-5 px-6 py-6 sm:px-8" onSubmit={handleSubmit} noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink-700">Full name</span>
              <input
                type="text"
                value={form.playerName}
                onChange={(event) => update('playerName', event.target.value)}
                className="rounded-2xl border border-courtly-900/10 px-4 py-2.5 text-sm text-ink-900 shadow-sm transition focus:border-courtly-500 focus:outline-none focus:ring-2 focus:ring-courtly-400/40"
                placeholder="Jane Doe"
                autoComplete="name"
              />
              {errors.playerName ? (
                <span className="text-xs text-red-600">{errors.playerName}</span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink-700">Email address</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                className="rounded-2xl border border-courtly-900/10 px-4 py-2.5 text-sm text-ink-900 shadow-sm transition focus:border-courtly-500 focus:outline-none focus:ring-2 focus:ring-courtly-400/40"
                placeholder="jane@example.com"
                autoComplete="email"
              />
              {errors.email ? (
                <span className="text-xs text-red-600">{errors.email}</span>
              ) : null}
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink-700">Court</span>
              <select
                value={form.courtId}
                onChange={(event) => update('courtId', event.target.value)}
                className="rounded-2xl border border-courtly-900/10 px-4 py-2.5 text-sm text-ink-900 shadow-sm transition focus:border-courtly-500 focus:outline-none focus:ring-2 focus:ring-courtly-400/40"
                disabled={loadingCourts || courts.length === 0}
              >
                {courts.length === 0 ? (
                  <option value="">No open courts available</option>
                ) : (
                  courts.map((court) => (
                    <option key={court.id} value={court.id}>
                      {court.name} — {court.surface}
                    </option>
                  ))
                )}
              </select>
              {errors.courtId ? (
                <span className="text-xs text-red-600">{errors.courtId}</span>
              ) : null}
              {selectedCourt ? (
                <span className="text-xs text-ink-500">
                  {selectedCourt.status === 'open' ? 'Available' : 'Not bookable'} ·{' '}
                  {selectedCourt.surface}
                </span>
              ) : null}
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink-700">Date</span>
              <input
                type="date"
                value={form.date}
                min={todayISO()}
                onChange={(event) => update('date', event.target.value)}
                className="rounded-2xl border border-courtly-900/10 px-4 py-2.5 text-sm text-ink-900 shadow-sm transition focus:border-courtly-500 focus:outline-none focus:ring-2 focus:ring-courtly-400/40"
              />
              {errors.date ? <span className="text-xs text-red-600">{errors.date}</span> : null}
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink-700">Start time</span>
              <select
                value={form.startTime}
                onChange={(event) => update('startTime', event.target.value)}
                className="rounded-2xl border border-courtly-900/10 px-4 py-2.5 text-sm text-ink-900 shadow-sm transition focus:border-courtly-500 focus:outline-none focus:ring-2 focus:ring-courtly-400/40"
              >
                {TIME_SLOTS.map((slot) => {
                  const alreadyBooked = bookedSlots.has(slot);
                  return (
                    <option key={slot} value={slot}>
                      {slot}
                      {alreadyBooked ? ' · already booked in this schedule' : ''}
                    </option>
                  );
                })}
              </select>
              {errors.startTime ? (
                <span className="text-xs text-red-600">{errors.startTime}</span>
              ) : null}
              <span className="flex items-center gap-2 text-xs text-ink-500">
                <Clock className="size-3.5" aria-hidden="true" />
                Server checks for overlapping reservations
              </span>
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-ink-700">Duration</span>
              <select
                value={form.durationMins}
                onChange={(event) => update('durationMins', event.target.value)}
                className="rounded-2xl border border-courtly-900/10 px-4 py-2.5 text-sm text-ink-900 shadow-sm transition focus:border-courtly-500 focus:outline-none focus:ring-2 focus:ring-courtly-400/40"
              >
                {DURATIONS.map((duration) => (
                  <option key={duration} value={duration}>
                    {minutesToLabel(duration)}
                  </option>
                ))}
              </select>
              {errors.durationMins ? (
                <span className="text-xs text-red-600">{errors.durationMins}</span>
              ) : null}
            </label>
          </div>

          {serverErrors.length > 0 ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-800">
              <p className="font-semibold">Validation errors</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-red-700/90">
                {serverErrors.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={submitting || courts.length === 0 || loadingCourts}
              className="inline-flex items-center gap-2 rounded-full bg-courtly-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-courtly-800 disabled:cursor-not-allowed disabled:opacity-60 focus-ring"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Submitting booking
                </>
              ) : (
                <>
                  <CalendarCheck2 className="size-4" aria-hidden="true" />
                  Confirm booking
                </>
              )}
            </button>
            <p className="text-xs text-ink-500">
              Protected against duplicate submissions while the request is in flight.
            </p>
          </div>
        </form>
      </section>

      <aside className="flex flex-col gap-4">
        <article className="rounded-3xl border border-courtly-900/10 bg-white/90 p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Booking rules
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-500">
            <li>• Names use letters, spaces, hyphens or apostrophes</li>
            <li>• Date must be today or later</li>
            <li>• Time in 24-hour HH:MM format</li>
            <li>• Duration limited to 30, 60 or 90 minutes</li>
            <li>• Double-bookings are rejected server-side with HTTP 409</li>
            <li>• Maintenance courts cannot be reserved</li>
          </ul>
        </article>
        <article className="rounded-3xl border border-courtly-900/10 bg-white/90 p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink-900">
            Security notes
          </h2>
          <p className="mt-2 text-sm text-ink-500">
            Client-side checks improve UX, but validation is enforced on the Express
            server. The admin API never trusts the browser — authorization is checked
            server-side with a bearer token.
          </p>
          <Link
            to="/admin/login"
            className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-courtly-700 hover:text-courtly-800 focus-ring"
          >
            Go to admin login
            <Clock className="size-4" aria-hidden="true" />
          </Link>
        </article>
      </aside>
    </div>
  );
}

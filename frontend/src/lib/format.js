export function formatDate(dateString) {
  if (!dateString) return '—';
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatTime(timeString) {
  if (!timeString) return '—';
  const [hours, minutes] = timeString.split(':').map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return timeString;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function todayISO() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}

export function minutesToLabel(minutes) {
  if (minutes === 30) return '30 min';
  if (minutes === 60) return '1 hour';
  if (minutes === 90) return '1.5 hours';
  return `${minutes} min`;
}

export function courtName(courts, courtId) {
  return courts.find((court) => court.id === courtId)?.name ?? courtId;
}

export function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

'use strict';

// Fictional sample data only. No real personal data is stored anywhere.
// Held in memory for the demo; restarting the server resets bookings.

const courts = [
  { id: 'C1', name: 'Court 1 — Center Court', surface: 'Outdoor acrylic', status: 'open' },
  { id: 'C2', name: 'Court 2 — The Dink', surface: 'Outdoor acrylic', status: 'open' },
  { id: 'C3', name: 'Court 3 — Kitchen', surface: 'Indoor wooden', status: 'maintenance' },
  { id: 'C4', name: 'Court 4 — Baseline', surface: 'Indoor wooden', status: 'open' },
];

const tournaments = [
  {
    id: 'T1',
    name: 'Spring Smackdown 2026',
    date: '2026-11-14',
    format: 'Double Elimination',
    teams: 16,
    status: 'registration-open',
  },
  {
    id: 'T2',
    name: 'Inter-College Mixer Cup',
    date: '2026-12-05',
    format: 'Round Robin',
    teams: 8,
    status: 'planned',
  },
];

const bookings = [
  {
    id: 'B1',
    courtId: 'C1',
    playerName: 'Aarav Sharma',
    email: 'aarav.sharma@example.com',
    date: '2026-10-20',
    startTime: '18:00',
    durationMins: 60,
    createdAt: '2026-10-10T09:15:00.000Z',
  },
  {
    id: 'B2',
    courtId: 'C4',
    playerName: 'Diya Patel',
    email: 'diya.patel@example.com',
    date: '2026-10-21',
    startTime: '07:30',
    durationMins: 90,
    createdAt: '2026-10-11T14:40:00.000Z',
  },
];

let nextBookingId = 3;

function getCourts() {
  return courts.map((c) => ({ ...c }));
}

function getTournaments() {
  return tournaments.map((t) => ({ ...t }));
}

function getBookings() {
  return bookings
    .slice()
    .sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
}

function addBooking(input) {
  const booking = {
    id: `B${nextBookingId++}`,
    courtId: input.courtId,
    playerName: input.playerName,
    email: input.email,
    date: input.date,
    startTime: input.startTime,
    durationMins: input.durationMins,
    createdAt: new Date().toISOString(),
  };
  bookings.push(booking);
  return booking;
}

function isCourtBooked(courtId, date, startTime, durationMins) {
  const start = new Date(`${date}T${startTime}:00`);
  const end = new Date(start.getTime() + durationMins * 60000);
  return bookings.some((b) => {
    if (b.courtId !== courtId || b.date !== date) return false;
    const bStart = new Date(`${b.date}T${b.startTime}:00`);
    const bEnd = new Date(bStart.getTime() + b.durationMins * 60000);
    return start < bEnd && bStart < end;
  });
}

module.exports = {
  getCourts,
  getTournaments,
  getBookings,
  addBooking,
  isCourtBooked,
};

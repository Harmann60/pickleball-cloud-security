'use strict';

// Vanilla JS frontend. All output from the API is rendered with textContent
// (never innerHTML) so untrusted strings cannot inject markup.

const $ = (sel) => document.querySelector(sel);

function showMessage(text, type) {
  const el = $('#message');
  el.textContent = text;
  el.className = `message ${type}`;
}

function clearMessage() {
  $('#message').className = 'message hidden';
  $('#message').textContent = '';
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = { ok: false, message: `Unexpected response (HTTP ${res.status}).` };
  }
  return { status: res.status, data };
}

// ---------- Tabs ----------
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    btn.classList.add('active');
    $(`#${btn.dataset.tab}`).classList.add('active');
    clearMessage();
  });
});

// ---------- Dashboard ----------
function renderCourts(courts) {
  const wrap = $('#courts');
  wrap.textContent = '';
  courts.forEach((c) => {
    const card = document.createElement('div');
    card.className = 'card';
    const status = document.createElement('div');
    status.className = 'status';
    status.textContent = c.status;
    const name = document.createElement('div');
    name.textContent = c.name;
    const surface = document.createElement('div');
    surface.className = 'muted';
    surface.textContent = c.surface;
    card.append(status, name, surface);
    wrap.appendChild(card);
  });

  const select = $('#court-select');
  select.textContent = '';
  courts.filter((c) => c.status === 'open').forEach((c) => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });
}

function renderBookings(bookings) {
  const wrap = $('#bookings');
  wrap.textContent = '';
  if (bookings.length === 0) {
    wrap.textContent = 'No bookings yet.';
    return;
  }
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['Date', 'Time', 'Court', 'Player', 'Duration'].forEach((h) => {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  const tbody = document.createElement('tbody');
  bookings.forEach((b) => {
    const tr = document.createElement('tr');
    [b.date, b.startTime, b.courtId, b.playerName, `${b.durationMins} min`].forEach((v) => {
      const td = document.createElement('td');
      td.textContent = v;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.append(thead, tbody);
  wrap.appendChild(table);
}

function renderTournaments(tournaments) {
  const wrap = $('#tournaments');
  wrap.textContent = '';
  tournaments.forEach((t) => {
    const card = document.createElement('div');
    card.className = 'card';
    const status = document.createElement('div');
    status.className = 'status';
    status.textContent = t.status;
    const name = document.createElement('div');
    name.textContent = t.name;
    const meta = document.createElement('div');
    meta.className = 'muted';
    meta.textContent = `${t.date} · ${t.format} · ${t.teams} teams`;
    card.append(status, name, meta);
    wrap.appendChild(card);
  });
}

async function loadDashboard() {
  const { status, data } = await api('/api/dashboard');
  if (status !== 200 || !data.ok) {
    showMessage(data.message || 'Failed to load dashboard.', 'error');
    return;
  }
  renderCourts(data.courts);
  renderBookings(data.bookings);
  renderTournaments(data.tournaments);
}

// ---------- Booking form ----------
$('#booking-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();
  const form = e.target;
  const payload = {
    playerName: form.playerName.value,
    email: form.email.value,
    courtId: form.courtId.value,
    date: form.date.value,
    startTime: form.startTime.value,
    durationMins: Number(form.durationMins.value),
  };

  const { status, data } = await api('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (data.ok) {
    showMessage(data.message, 'success');
    form.reset();
    await loadDashboard();
  } else {
    const detail = data.errors ? ` ${data.errors.join(' ')}` : '';
    showMessage(`${data.message || 'Booking failed.'}${detail}`, 'error');
    if (status === 401 || status === 403) showMessage(data.message, 'error');
  }
});

// ---------- Admin ----------
function adminToken() {
  return $('#admin-token').value.trim();
}

$('#load-admin-bookings').addEventListener('click', async () => {
  clearMessage();
  const { status, data } = await api('/api/admin/bookings', {
    headers: { Authorization: `Bearer ${adminToken()}` },
  });
  const out = $('#admin-output');
  if (data.ok) {
    out.textContent = JSON.stringify(data.bookings, null, 2);
    showMessage('Admin authorization succeeded — bookings retrieved.', 'success');
  } else {
    out.textContent = '';
    showMessage(data.message || `Admin request failed (HTTP ${status}).`, 'error');
  }
});

$('#store-report').addEventListener('click', async () => {
  clearMessage();
  const title = $('#report-title').value;
  const content = $('#report-content').value;
  const { status, data } = await api('/api/admin/tournament-report', {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken()}` },
    body: JSON.stringify({ title, content }),
  });
  if (data.ok) {
    $('#admin-output').textContent = `Stored at: ${data.location}`;
    showMessage(data.message, 'success');
  } else {
    const detail = data.errors ? ` ${data.errors.join(' ')}` : '';
    showMessage(`${data.message || 'Upload failed.'}${detail}`, 'error');
  }
});

loadDashboard();

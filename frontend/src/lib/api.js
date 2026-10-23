/**
 * Single API client for the Courtly frontend.
 *
 * Base URL resolution:
 *  - VITE_API_BASE_URL set  -> direct requests to that origin (production).
 *  - Not set, dev server    -> relative /api requests, proxied by Vite to Express.
 *  - Not set, production    -> requests fail fast with a configuration message.
 *
 * The admin bearer token is passed explicitly per request and is never read
 * from environment variables or persisted to storage.
 */

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? '';
const BASE = RAW_BASE.trim().replace(/\/+$/, '');
const TIMEOUT_MS = 15000;

export const isApiConfigured = Boolean(BASE) || import.meta.env.DEV;
export const apiOriginLabel = BASE || (import.meta.env.DEV ? 'Vite dev proxy' : 'not configured');

export class ApiError extends Error {
  constructor(message, { status = 0, details = null, kind = 'http' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
    this.kind = kind;
  }
}

async function request(path, { method = 'GET', body, token, signal } = {}) {
  if (!BASE && !import.meta.env.DEV) {
    throw new ApiError(
      'The API base URL is not configured. Set VITE_API_BASE_URL in the deployment settings.',
      { kind: 'config' }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const abortFromCaller = () => controller.abort();
  if (signal) signal.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;

    const response = await fetch(`${BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      credentials: 'omit',
      mode: 'cors',
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        throw new ApiError(
          `The API returned an unreadable response (HTTP ${response.status}).`,
          { status: response.status, kind: 'parse' }
        );
      }
    }

    if (!response.ok || (data && data.ok === false)) {
      throw new ApiError(data?.message || `Request failed (HTTP ${response.status}).`, {
        status: response.status,
        details: Array.isArray(data?.errors) ? data.errors : null,
        kind: response.status === 403 ? 'auth' : 'http',
      });
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error.name === 'AbortError') {
      throw new ApiError('The request timed out. Check the API endpoint and try again.', {
        kind: 'timeout',
      });
    }
    throw new ApiError(
      'Cannot reach the API. Check your network connection, the API URL, or the server CORS configuration.',
      { kind: 'network' }
    );
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', abortFromCaller);
  }
}

export function getDashboard(signal) {
  return request('/api/dashboard', { signal });
}

export function createBooking(payload, signal) {
  return request('/api/bookings', { method: 'POST', body: payload, signal });
}

export function getAdminBookings(token, signal) {
  return request('/api/admin/bookings', { token, signal });
}

export function createTournamentReport(token, payload, signal) {
  return request('/api/admin/tournament-report', {
    method: 'POST',
    body: payload,
    token,
    signal,
  });
}

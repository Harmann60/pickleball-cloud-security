import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, KeyRound, Info, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useToast } from '../context/ToastContext';
import { getAdminBookings } from '../lib/api';

export default function AdminLogin() {
  const { setToken, hasToken } = useAdminAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const token = value.trim();

    if (!token) {
      setError('Enter the admin bearer token provided by the backend operator.');
      return;
    }

    if (token.startsWith('Bearer ')) {
      setError('Enter only the token value, not the "Bearer" prefix.');
      return;
    }

    setVerifying(true);
    try {
      // Verify the token against a protected endpoint before keeping it.
      await getAdminBookings(token);
      setToken(token);
      pushToast({
        title: 'Session ready',
        message: 'Token verified and stored in memory for this browser session.',
      });
      navigate('/admin');
    } catch (err) {
      if (err.status === 403) {
        setError('The server rejected this token. Check it and try again.');
      } else {
        setError(err.message);
      }
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6">
      <section className="rounded-3xl border border-courtly-900/10 bg-white/95 shadow-sm">
        <div className="border-b border-courtly-900/5 px-6 py-6 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-courtly-100 text-courtly-700">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </div>
            <div>
              <h1 className="font-display text-xl font-semibold text-ink-900">
                Admin access
              </h1>
              <p className="text-sm text-ink-500">Prototype bearer-token authorization</p>
            </div>
          </div>
        </div>
        <form className="flex flex-col gap-4 px-6 py-6 sm:px-8" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-ink-700">Admin bearer token</span>
            <input
              type="password"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="rounded-2xl border border-courtly-900/10 px-4 py-2.5 text-sm text-ink-900 shadow-sm transition focus:border-courtly-500 focus:outline-none focus:ring-2 focus:ring-courtly-400/40"
              placeholder="Paste token from the backend environment"
              autoComplete="off"
              spellCheck="false"
            />
            {error ? <span className="text-xs text-red-600">{error}</span> : null}
          </label>
          <button
            type="submit"
            disabled={verifying}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-courtly-700 px-6 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-courtly-800 disabled:cursor-not-allowed disabled:opacity-60 focus-ring"
          >
            {verifying ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Verifying token
              </>
            ) : (
              <>
                <KeyRound className="size-4" aria-hidden="true" />
                {hasToken ? 'Update token and continue' : 'Verify token and continue'}
              </>
            )}
          </button>
          {hasToken ? (
            <Link
              to="/admin"
              className="text-center text-sm font-medium text-courtly-700 hover:text-courtly-800"
            >
              Already have a token in this session — go to dashboard
            </Link>
          ) : null}
        </form>
      </section>

      <section className="rounded-3xl border border-amber-200 bg-amber-50/80 p-6">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
          <div className="space-y-2 text-sm text-amber-900">
            <p className="font-semibold">Important security notes</p>
            <ul className="space-y-1 text-amber-800/90">
              <li>• Never hardcode or expose the admin token in a `VITE_` environment variable.</li>
              <li>• The token stays in React state (memory) for this session only — not persisted to `localStorage` or cookies.</li>
              <li>• The token is verified against a protected endpoint before use.</li>
              <li>• Authorization is enforced server-side; this UI does not grant access by itself.</li>
              <li>• This is a prototype mechanism, not a full user authentication or RBAC system.</li>
              <li>• If the EC2 instance has port 3000 blocked from the public internet, a directly hosted frontend cannot reach the API until a secure HTTPS proxy is configured.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

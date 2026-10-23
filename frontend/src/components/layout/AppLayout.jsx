import { NavLink } from 'react-router-dom';
import { CalendarCheck2, LayoutDashboard, ShieldCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { cx } from '../../lib/format';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/book', label: 'Book a Court', icon: CalendarCheck2 },
  { to: '/admin/login', label: 'Admin', icon: ShieldCheck },
];

export default function Layout({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-30 border-b border-courtly-900/10 bg-sand-50/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <NavLink to="/" className="flex items-center gap-2 focus-ring">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-courtly-700 to-courtly-500 shadow-[0_20px_40px_-30px_rgba(27,122,85,1)]">
              <span className="text-sm font-extrabold uppercase tracking-[0.3em] text-white">
                C
              </span>
            </div>
            <div>
              <p className="font-display text-base font-bold leading-tight text-ink-900">
                Courtly
              </p>
              <p className="text-xs text-ink-500">
                Secure Pickleball Management
              </p>
            </div>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {links.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cx(
                      'flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition focus-ring',
                      isActive
                        ? 'bg-courtly-700 text-white shadow-[0_18px_40px_-28px_rgba(27,122,85,1)]'
                        : 'text-ink-600 hover:bg-courtly-100/80 hover:text-ink-900'
                    )
                  }
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          <button
            type="button"
            onClick={() => setOpen((current) => !current)}
            className="inline-flex items-center justify-center rounded-full border border-courtly-900/10 p-2 text-ink-600 transition hover:bg-courtly-100/70 md:hidden focus-ring"
            aria-expanded={open}
            aria-label="Toggle navigation"
          >
            {open ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}
          </button>
        </div>

        {open ? (
          <nav
            className="border-t border-courtly-900/10 bg-sand-50/95 px-4 py-2 md:hidden"
            aria-label="Mobile navigation"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cx(
                        'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition focus-ring',
                        isActive
                          ? 'bg-courtly-700 text-white'
                          : 'text-ink-600 hover:bg-courtly-100/80 hover:text-ink-900'
                      )
                    }
                  >
                    <Icon className="size-4" aria-hidden="true" />
                    {link.label}
                  </NavLink>
                );
              })}
            </div>
          </nav>
        ) : null}
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
        {children}
      </main>

      <footer className="border-t border-courtly-900/10 bg-sand-50/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© {new Date().getFullYear()} Courtly · AWS Cloud Security Demonstration</p>
          <p className="text-xs text-ink-500/80">
            Private S3 · EC2 instance role · Server-side validation · No secrets in frontend
          </p>
        </div>
      </footer>
    </div>
  );
}

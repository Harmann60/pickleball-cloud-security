# Courtly — Frontend

React + Vite single-page frontend for the **Secure Pickleball Court Management System**. It talks to the existing Express API (`/api/*`) on the EC2 backend and never handles AWS credentials or S3 directly.

> **Demonstration project.** Fictional data only. Admin access is a prototype shared bearer token, not a production authentication system.

## Stack

- React 19 + Vite 6
- React Router 7
- Tailwind CSS 4 (`@tailwindcss/vite`)
- Lucide icons
- Native `fetch` via a single API client (`src/lib/api.js`)

## Pages

| Route | Purpose |
|---|---|
| `/` | Dashboard — courts, bookings-on-record, tournaments from `GET /api/dashboard` |
| `/book` | Booking form → `POST /api/bookings` with client + server-side validation |
| `/admin/login` | Verifies and stores the admin bearer token **in memory only** |
| `/admin` | Bookings table, refresh, report upload → `GET /api/admin/bookings`, `POST /api/admin/tournament-report` |
| `*` | 404 page |

## Local development

Start the backend first (from the repository root):

```bash
# terminal 1 — repository root
cp .env.example .env          # set ADMIN_TOKEN to a long random string
npm install
npm start                     # http://localhost:3000
```

Start the frontend:

```bash
# terminal 2 — frontend directory
cd frontend
npm install
cp .env.example .env          # VITE_API_BASE_URL can stay empty
npm run dev                   # http://localhost:5173
```

With `VITE_API_BASE_URL` empty, Vite proxies `/api` to `http://localhost:3000`
(`VITE_DEV_PROXY_TARGET`). No backend CORS configuration is needed in this mode.

### Direct cross-origin mode (optional)

To call the API directly instead of through the proxy:

1. Set `VITE_API_BASE_URL=http://localhost:3000` in `frontend/.env`.
2. Set `ALLOWED_ORIGIN=http://localhost:5173` in the backend `.env` and restart it.

The backend CORS middleware is **opt-in**: it is inactive unless `ALLOWED_ORIGIN`
is set to exactly one trusted origin. It never uses `*`.

## Scripts

```bash
npm run dev      # dev server with HMR
npm run build    # production build -> dist/
npm run preview  # serve the production build locally
npm run lint     # ESLint (React hooks + refresh rules)
```

## Environment variables

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_API_BASE_URL` | Browser bundle | API origin. Empty in dev (proxy). Production: HTTPS URL. |
| `VITE_DEV_PROXY_TARGET` | Vite config only | Local proxy target, default `http://localhost:3000`. Never bundled. |

Only `VITE_*` variables reach the browser bundle. **Never** put the admin token,
AWS keys, or any secret in a `VITE_` variable — the built JavaScript is public.

## Deploying to Vercel

1. Import the repository in Vercel and set **Root Directory** to `frontend`.
2. Framework preset: **Vite**. Build command `npm run build`, output `dist`.
3. Add environment variable:
   - `VITE_API_BASE_URL=https://your-secure-api-domain.example`
4. Deploy. `vercel.json` rewrites all paths to `index.html` for client-side routing.

> The site is not considered deployed until the Vercel build succeeds **and** the
> API URL is reachable from the browser.

## Production HTTPS API connectivity — required

The EC2 security group does **not** expose port 3000 publicly, and the backend is
plain HTTP. A Vercel-hosted page therefore cannot call the current backend
directly. Connect them safely before demoing online, for example:

1. **Reverse proxy + TLS on EC2 (recommended for this project)** — install Caddy
   (or nginx + Certbot) on the instance, point a DNS name at it, terminate TLS on
   443, and reverse-proxy to `127.0.0.1:3000`. Open only 443 (and 80 for ACME) in
   the security group, keep 3000 private, and set:
   - backend `ALLOWED_ORIGIN=https://<your-vercel-app>.vercel.app`
   - Vercel `VITE_API_BASE_URL=https://<your-api-domain>`
2. **Application Load Balancer + ACM** — managed TLS, but ALB is not free-tier and
   adds cost.
3. **Tunnel** (Cloudflare Tunnel / ngrok) — quick for a demo only; not a
   long-term production design and adds a third-party dependency.

Do not make the S3 bucket public, do not open port 3000 to `0.0.0.0/0`, and do
not move AWS credentials into the frontend.

## Security notes

- The admin token is never stored in `localStorage`, cookies, or source code.
- Tokens are sent only to `/api/admin/*` requests via the `Authorization` header.
- All output is rendered as text (no `dangerouslySetInnerHTML`).
- Client validation mirrors, but never replaces, server-side rules.
- `npm run build` output was checked for token/secret strings during development.

## Project structure

```
frontend/
├── src/
│   ├── components/layout/AppLayout.jsx
│   ├── context/{AdminAuthContext,ToastContext}.jsx
│   ├── lib/{api,format}.js
│   ├── pages/{Dashboard,BookCourt,AdminLogin,AdminDashboard,NotFound}.jsx
│   ├── App.jsx
│   ├── routes.jsx
│   ├── main.jsx
│   └── index.css
├── .env.example
├── eslint.config.js
├── vercel.json
├── vite.config.js
└── package.json
```

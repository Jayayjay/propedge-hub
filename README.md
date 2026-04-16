# PropEdge Hub

A unified SaaS platform for prop firm traders. Phase 1 ships the **Prop Firm Challenge Tracker** — real-time drawdown monitoring, rule compliance, and MT5 sync across all major prop firms. Future phases will add a Trading Journal, MT5 Trade Copier, Backtesting Report Generator, and more.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + Radix UI + Recharts |
| ORM | Drizzle ORM + drizzle-kit |
| Database | PostgreSQL via Neon (serverless) |
| Auth | Auth.js v5 — Email magic links + Google OAuth |
| Payments | Paystack — Naira billing + webhooks |
| State | TanStack Query + Zustand |
| Validation | Zod |
| Icons | lucide-react |
| Hosting | Vercel (frontend + API) + Neon (DB) |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Landing page
│   ├── login/page.tsx                # Magic link + Google login
│   ├── signup/page.tsx               # Registration
│   ├── dashboard/
│   │   ├── layout.tsx                # Sidebar + topbar shell
│   │   ├── page.tsx                  # Main tracker dashboard
│   │   ├── challenges/page.tsx       # Active / completed challenges list
│   │   ├── alerts/page.tsx           # Alerts center
│   │   ├── history/page.tsx          # Full trade history
│   │   └── settings/page.tsx         # Billing + MT5 accounts + profile
│   └── api/
│       ├── auth/[...nextauth]/       # Auth.js handler
│       ├── paystack/initialize/      # Create Paystack payment session
│       └── paystack/webhook/         # Verified webhook → update subscription
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   └── topbar.tsx
│   ├── prop-tracker/
│   │   ├── kpi-card.tsx              # Equity / drawdown / profit KPI cards
│   │   ├── equity-chart.tsx          # Live equity curve (Recharts)
│   │   ├── trades-table.tsx          # Recent trades
│   │   └── rules-panel.tsx           # Firm rules checklist + breach alert
│   └── ui/                           # Button, Card, Badge, Progress, Input, etc.
├── lib/
│   ├── db/
│   │   ├── schema.ts                 # Full Drizzle schema
│   │   └── index.ts                  # Neon + Drizzle client
│   ├── auth.ts                       # Auth.js config
│   ├── mock-data.ts                  # Demo data (replace with DB queries)
│   └── utils.ts                      # cn(), formatCurrency(), formatPercent()
drizzle/                              # Generated migrations
drizzle.config.ts
```

---

## Database Schema

Core tables:

- **users** — Auth.js user records
- **accounts / sessions / verification_tokens** — Auth.js adapter tables
- **subscriptions** — `free | pro | elite` plan + Paystack reference
- **mt5_accounts** — Linked MT5 accounts (read-only investor password)
- **prop_challenges** — Per-challenge config (firm, phase, drawdown limits, profit target)
- **live_account_data** — Time-series equity snapshots pushed from MT5 bridge
- **trades** — Individual trade records
- **alerts** — Generated breach/warning alerts with channel config

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo>
cd propfirmtracker
npm install
```

### 2. Configure environment variables

Fill in `.env.local`:

```bash
# Database (Neon)
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"

# Auth.js
NEXTAUTH_SECRET="your-secret"          # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_..."
PAYSTACK_SECRET_KEY="sk_test_..."

# Email (magic links — use Resend, SendGrid, etc.)
EMAIL_SERVER_HOST="smtp.resend.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="resend"
EMAIL_SERVER_PASSWORD="re_..."
EMAIL_FROM="noreply@yourdomain.com"
```

### 3. Push the database schema

```bash
npm run db:push
```

Creates all tables on your Neon database. No migration files needed for initial setup.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## NPM Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to the database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:studio` | Open Drizzle Studio (DB GUI) |

---

## Paystack Integration

**Initializing a payment** (`POST /api/paystack/initialize`):
```json
{ "email": "user@example.com", "plan": "pro", "amount": 4999 }
```
Returns `{ authorizationUrl, reference }`. Redirect the user to `authorizationUrl`.

**Webhook** (`POST /api/paystack/webhook`):
- Verifies `x-paystack-signature` using HMAC-SHA512.
- On `charge.success` — upserts the user's subscription to `active` with a 30-day period.
- On `subscription.disable` — sets subscription status to `cancelled`.

Register your webhook URL in the Paystack dashboard: `https://yourdomain.com/api/paystack/webhook`

---

## MT5 Integration (Phase 2)

The dashboard currently runs on mock data from `src/lib/mock-data.ts`. Live sync requires a Python bridge on a separate VPS:

```
MT5 Terminal → Python (pyzmq) → PostgreSQL (live_account_data + trades)
                                        ↑
                              Next.js polls via TanStack Query
```

The bridge polls MT5 every few seconds using the MT5 Python package and pushes equity snapshots and closed trades into the database.

To switch from mock data to live data:
1. Replace `mockEquityCurve` in `equity-chart.tsx` with a `useQuery` call to `/api/challenges/[id]/equity`.
2. Replace `mockTrades` in `trades-table.tsx` with a `/api/challenges/[id]/trades` endpoint.
3. Build and deploy the Python bridge to your VPS.

---

## Deployment

### Vercel

```bash
npx vercel deploy
```

Set all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

### Pre-launch checklist

- [ ] `DATABASE_URL` points to production Neon database
- [ ] `NEXTAUTH_SECRET` is a strong random value (`openssl rand -base64 32`)
- [ ] `NEXTAUTH_URL` is set to your production domain
- [ ] Paystack keys switched from test (`pk_test_`) to live (`pk_live_`)
- [ ] Paystack webhook URL registered in your Paystack dashboard
- [ ] Email provider configured with a verified sender domain

---

## Roadmap

| Phase | Feature | Status |
|---|---|---|
| 1 | Prop Firm Challenge Tracker | ✅ MVP built |
| 1 | Auth (magic link + Google) | ✅ Scaffolded |
| 1 | Paystack billing | ✅ Scaffolded |
| 2 | Live MT5 sync (Python bridge) | Planned |
| 2 | WhatsApp alerts | Planned |
| 2 | PDF report export | Planned |
| 3 | Trading Journal | Planned |
| 3 | MT5 Trade Copier | Planned |
| 4 | Backtesting Report Generator | Planned |
| 5 | Sports Club Management | Planned |

---

## License

MIT

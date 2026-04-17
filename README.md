# PropEdge Hub

A full-stack SaaS dashboard for prop firm traders. Track all your challenges in real time — monitor drawdown, profit targets, and rule compliance with live MT5 data, WhatsApp alerts, PDF reports, and a built-in trading journal.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 + Radix UI + Recharts |
| ORM | Drizzle ORM + drizzle-kit |
| Database | PostgreSQL via Neon (serverless) |
| Auth | Auth.js v5 — email/password credentials |
| Payments | Stripe — subscription billing + webhooks |
| Alerts | Nodemailer (SMTP) + Twilio WhatsApp |
| PDF Export | jsPDF + jspdf-autotable (client-side) |
| State | TanStack Query (server) + Zustand (client) |
| Validation | Zod |
| MT5 Bridge | Python 3.11+ push worker **or** MQL5 Expert Advisor |
| Hosting | Vercel (frontend + API) + Neon (DB) |

---

## Features

| Feature | Status |
|---|---|
| Landing page with prop firm logos | ✅ |
| Email + password auth with email verification | ✅ |
| Live MT5 dashboard (equity, drawdown, profit) | ✅ |
| Multi-challenge tracker | ✅ |
| MT5 bridge — Python worker + MQL5 EA | ✅ |
| Email + WhatsApp (Twilio) alerts | ✅ |
| PDF trade history export | ✅ |
| Trading Journal (CRUD, mood, tags, P&L) | ✅ |
| Stripe subscription billing (Free / Pro / Elite) | ✅ |
| Dark mode | ✅ |

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Landing page
│   ├── login / signup / verify-email/
│   ├── dashboard/
│   │   ├── layout.tsx                  # Sidebar + topbar shell
│   │   ├── page.tsx                    # Live MT5 dashboard
│   │   ├── challenges/page.tsx         # Active / completed challenges
│   │   ├── history/page.tsx            # Trade history + PDF export
│   │   ├── journal/page.tsx            # Trading journal
│   │   ├── alerts/page.tsx             # Alert centre
│   │   └── settings/page.tsx           # Profile, MT5 accounts, billing
│   └── api/
│       ├── auth/[...nextauth]/         # Auth.js handler
│       ├── auth/register/              # Registration + email verify
│       ├── challenges/[id]/
│       │   ├── live/                   # Latest equity snapshot
│       │   ├── equity/                 # Equity curve (sampled)
│       │   └── trades/                 # Paginated trade history
│       ├── journal/                    # GET + POST journal entries
│       ├── journal/[id]/               # GET, PATCH, DELETE entry
│       ├── mt5/push/                   # Receives bridge snapshots
│       ├── stripe/checkout/            # Create checkout session
│       ├── stripe/webhook/             # Stripe webhook handler
│       └── user/settings/             # Profile + WhatsApp number
├── components/
│   ├── layout/sidebar.tsx, topbar.tsx
│   ├── prop-tracker/
│   │   ├── live-dashboard.tsx          # Main dashboard component
│   │   ├── equity-chart.tsx
│   │   ├── kpi-card.tsx
│   │   ├── trades-table.tsx
│   │   ├── rules-panel.tsx
│   │   └── export-pdf-button.tsx       # Client-side PDF generation
│   └── ui/                             # Radix UI primitives
└── lib/
    ├── db/schema.ts                    # Full Drizzle schema
    ├── db/index.ts                     # Neon + Drizzle client
    ├── auth.ts                         # Auth.js config
    ├── email.ts                        # Nodemailer alert emails
    ├── whatsapp.ts                     # Twilio WhatsApp alerts
    ├── prop-firms.ts                   # Prop firm logos + metadata
    └── mock-data.ts                    # Demo data fallback

mt5_bridge/                             # Python push worker
├── main.py                             # Entry point (workers + FastAPI)
├── mt5_client.py                       # Real MT5 + Mock fallback
├── api_client.py                       # POST to /api/mt5/push
├── config.py                           # .env loader
├── server.py                           # FastAPI health + REST endpoints
├── PropEdgeHub_Bridge.mq5              # MQL5 EA (Wine / Windows)
└── requirements.txt
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Auth.js user records + WhatsApp number |
| `accounts / sessions / verification_tokens` | Auth.js adapter tables |
| `subscriptions` | `free \| pro \| elite` plan + Stripe references |
| `mt5_accounts` | Linked MT5 accounts (investor / read-only password) |
| `prop_challenges` | Challenge config — firm, phase, drawdown limits, profit target |
| `live_account_data` | Time-series equity snapshots from MT5 bridge |
| `trades` | Closed deal records |
| `alerts` | Breach / warning alerts with email + WhatsApp delivery |
| `journal_entries` | Trading journal — setup, notes, outcome, mood, P&L, tags |

---

## Getting Started

### 1. Install dependencies

```bash
git clone <your-repo>
cd propfirmtracker
npm install
```

### 2. Configure environment variables

Create `.env.local` in the project root:

```bash
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
DIRECT_DATABASE_URL="postgresql://user:password@host-direct/db?sslmode=require"

# Auth.js
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Gmail SMTP (or any SMTP provider)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="you@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="PropEdge Hub <you@gmail.com>"

# MT5 Bridge shared secret — must match BRIDGE_SECRET in mt5_bridge/.env
MT5_BRIDGE_SECRET="your-bridge-secret"

# Twilio WhatsApp
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"
TWILIO_WHATSAPP_TO="whatsapp:+234xxxxxxxxxx"
# Optional: Twilio Content Template SID
# TWILIO_CONTENT_SID="HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

### 3. Push the database schema

```bash
npm run db:push
```

Applies all tables to your Neon database. Run again after adding the `journal_entries` table if upgrading an existing install.

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
| `npm run db:push` | Push schema to database (dev) |
| `npm run db:generate` | Generate migration SQL files |
| `npm run db:migrate` | Run pending migrations |
| `npm run db:studio` | Open Drizzle Studio (DB GUI) |

---

## MT5 Bridge

The bridge pushes live account data (equity snapshots, open positions, closed deals) to `/api/mt5/push` every 5 seconds.

### Option A — MQL5 Expert Advisor (recommended for Wine / Windows)

Runs entirely inside MT5. No Python required.

1. Copy `mt5_bridge/PropEdgeHub_Bridge.mq5` into:
   - **Windows:** `<MT5 data folder>\MQL5\Experts\`
   - **Wine (Linux):** `~/.wine/drive_c/Program Files/MetaTrader 5/MQL5/Experts/`
2. In MT5: compile (F7) and attach to any chart.
3. In MT5: **Tools → Options → Expert Advisors → Allow WebRequest for listed URL** → add `http://localhost:3000`
4. Set EA inputs:
   - `InpNextJsUrl` = `http://localhost:3000` (or your deployed URL)
   - `InpBridgeSecret` = value of `MT5_BRIDGE_SECRET` in `.env.local`

### Option B — Python bridge (Windows VPS / server)

```bash
cd mt5_bridge
cp .env.example .env
# Fill in MT5_ACCOUNTS, NEXTJS_URL, BRIDGE_SECRET
pip install -r requirements.txt
python main.py
```

On Linux without Wine the bridge runs in **mock mode** — it generates realistic demo data so the full pipeline can be developed without a terminal.

See `mt5_bridge/README.md` for full configuration details.

### Linking an account

Before live data appears, link your MT5 account to a challenge:

1. **Settings → MT5 Accounts** — add your account number and server.
2. When creating a challenge, select the linked MT5 account.
3. The bridge matches on `account_number` to find the correct challenge.

### Data flow

```
MT5 Terminal
    │  account_info / positions / history_deals
    ▼
MQL5 EA  ─── or ───  Python bridge (mt5_client.py → api_client.py)
    │
    ▼  POST /api/mt5/push  (X-Bridge-Secret header)
Next.js API
    │  validates → resolves account → calculates drawdown
    │  inserts live_account_data + upserts trades + checks alerts
    ▼
PostgreSQL (Neon)
    ▲
    │  TanStack Query polls /api/challenges/[id]/live every 5 s
Dashboard
```

### Drawdown calculations

| Metric | Formula |
|---|---|
| Daily loss % | `(yesterday_close_equity − equity) / account_size × 100` |
| Max drawdown % | `(peak_equity_ever − equity) / starting_balance × 100` |
| Profit % | `(equity − starting_balance) / starting_balance × 100` |

Alerts fire at **70 %** of limit (warning), **90 %** (critical), and on breach.

---

## Stripe Integration

**Create a checkout session** (`POST /api/stripe/checkout`):
```json
{ "plan": "pro" }
```
Returns `{ url }` — redirect the user to `url`.

**Webhook** (`POST /api/stripe/webhook`):
- Verifies `stripe-signature` header.
- On `checkout.session.completed` — activates / upgrades subscription.
- On `customer.subscription.deleted` — marks subscription cancelled.

Register the webhook URL in the Stripe dashboard:
```
https://yourdomain.com/api/stripe/webhook
```

---

## Supported Prop Firms

FTUK · FunderPro · Nova Funded · E8 Markets · My Forex Funds · FXIFY · Funding Pips · The5ers

Logos loaded from Clearbit with Google Favicon fallback. Firm metadata lives in `src/lib/prop-firms.ts`.

---

## Deployment

```bash
npx vercel deploy
```

Set all `.env.local` variables in **Vercel → Settings → Environment Variables**.

### Pre-launch checklist

- [ ] `DATABASE_URL` points to production Neon database
- [ ] `NEXTAUTH_SECRET` is a strong random value
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] Stripe keys switched from `pk_test_` / `sk_test_` to live keys
- [ ] Stripe webhook URL registered + `STRIPE_WEBHOOK_SECRET` set
- [ ] `TWILIO_AUTH_TOKEN` filled in (replace `[AuthToken]` placeholder)
- [ ] `MT5_BRIDGE_SECRET` is a strong random value, matching bridge `.env`
- [ ] SMTP credentials point to a production sender with verified domain

---

## Roadmap

| Feature | Status |
|---|---|
| Landing page + prop firm logos | ✅ |
| Email/password auth + email verification | ✅ |
| Live MT5 dashboard (equity, drawdown, profit) | ✅ |
| Multi-challenge tracker | ✅ |
| MT5 bridge — Python worker | ✅ |
| MT5 bridge — MQL5 EA (Wine / Windows) | ✅ |
| Email + WhatsApp (Twilio) breach alerts | ✅ |
| PDF trade history report export | ✅ |
| Trading Journal | ✅ |
| Stripe subscription billing | ✅ |
| MT5 Trade Copier | Planned |
| Backtesting Report Generator | Planned |
| Mobile app | Planned |

---

## License

MIT

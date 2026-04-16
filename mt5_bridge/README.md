# PropEdge MT5 Bridge

Python service that polls MT5 terminal(s) every 5 seconds and pushes live data to the PropEdge Next.js API.

## Requirements

- **Windows** machine or VPS with MetaTrader 5 terminal installed
- Python 3.11+
- MT5 accounts set to **investor (read-only) password**

> On Linux/Mac the bridge runs in **mock mode** — it generates realistic simulated data so the full pipeline can be developed without an MT5 terminal.

## Setup

```bash
# 1. Install Python deps
pip install -r requirements.txt

# 2. Create your .env
cp .env.example .env
# Then fill in MT5_ACCOUNTS, NEXTJS_URL, BRIDGE_SECRET

# 3. Run
python main.py
```

## Configuration (`.env`)

| Variable | Description |
|---|---|
| `MT5_ACCOUNTS` | Comma-separated `LOGIN:PASSWORD:SERVER:LABEL` entries |
| `NEXTJS_URL` | Base URL of your deployed Next.js app |
| `BRIDGE_SECRET` | Shared secret — must match `MT5_BRIDGE_SECRET` in Next.js `.env.local` |
| `POLL_INTERVAL_SECONDS` | How often to poll MT5 (default: `5`) |
| `LOG_LEVEL` | `DEBUG` / `INFO` / `WARNING` (default: `INFO`) |

### Example `MT5_ACCOUNTS`

```
MT5_ACCOUNTS=1234567:InvestorPass1:FTUKLimited-Server01:FTUK Phase2,8901234:InvestorPass2:FunderPro-Live:FunderPro P1
```

**Always use the investor (read-only) password.** The bridge cannot place or modify trades.

## Linking accounts in the app

Before the bridge can write live data, the MT5 account must be linked to a challenge in the database:

1. Go to **Settings → MT5 Accounts** in the app and add your account.
2. When creating a challenge, select the linked MT5 account.
3. The bridge matches on `account_number` to find the correct challenge.

## How it works

```
MT5 Terminal
    ↓  mt5.account_info()  (equity, balance)
    ↓  mt5.positions_get() (open positions)
    ↓  mt5.history_deals_get() (closed deals since last sync)
api_client.py
    ↓  POST /api/mt5/push  (X-Bridge-Secret header)
Next.js API
    ↓  validates secret → resolves account → calculates drawdown
    ↓  inserts liveAccountData row
    ↓  upserts closed trades
    ↓  checks alert conditions → inserts alerts
PostgreSQL (Neon)
    ↑  TanStack Query polls /api/challenges/[id]/live every 5s
Dashboard
```

## Running as a Windows service (production)

Use [NSSM](https://nssm.cc) to wrap the bridge as a Windows service so it restarts automatically:

```bash
nssm install PropEdgeBridge "C:\Python311\python.exe" "C:\propedge\mt5_bridge\main.py"
nssm set PropEdgeBridge AppDirectory "C:\propedge\mt5_bridge"
nssm start PropEdgeBridge
```

## Drawdown calculations

The API (not the bridge) calculates drawdown to keep all logic server-side:

| Metric | Formula |
|---|---|
| **Daily loss %** | `(yesterday_close_equity − current_equity) / account_size × 100` |
| **Max drawdown %** | `(peak_equity_ever − current_equity) / starting_balance × 100` |
| **Profit %** | `(current_equity − starting_balance) / starting_balance × 100` |

Alerts are triggered at **70%** and **90%** of each limit, plus on breach.

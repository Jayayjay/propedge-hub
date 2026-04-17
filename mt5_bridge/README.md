# PropEdge MT5 Bridge

Pushes live MT5 account data (equity, positions, closed deals) to the PropEdge Hub API every 5 seconds.

Two deployment options:

| Option | When to use |
|---|---|
| **MQL5 EA** (`PropEdgeHub_Bridge.mq5`) | MT5 on Windows or Wine (Linux). No Python needed. |
| **Python worker** (`main.py`) | Windows VPS with Python. Also runs in mock mode on Linux/Mac for development. |

---

## Option A — MQL5 Expert Advisor (recommended for Wine / Windows)

Runs entirely inside the MT5 terminal. No Python, no extra process.

### Setup

1. **Copy the EA** into your MT5 Experts folder:
   - **Windows:** `<MT5 data folder>\MQL5\Experts\PropEdgeHub_Bridge.mq5`
   - **Wine (Linux):** `~/.wine/drive_c/Program Files/MetaTrader 5/MQL5/Experts/`

   Find your data folder in MT5: **File → Open Data Folder**

2. **Compile** — press **F7** or right-click → Compile in MetaEditor.

3. **Allow WebRequest** — in MT5 go to:
   **Tools → Options → Expert Advisors**
   → tick *Allow WebRequest for listed URL*
   → add your Next.js URL (e.g. `http://localhost:3000`)

4. **Attach to a chart** — drag the EA onto any chart (e.g. EURUSD M1).

5. **Set inputs:**

   | Input | Description | Default |
   |---|---|---|
   | `InpNextJsUrl` | Base URL of your Next.js app | `http://localhost:3000` |
   | `InpBridgeSecret` | Must match `MT5_BRIDGE_SECRET` in `.env.local` | `PropEdge_Bridge007` |
   | `InpPollSeconds` | Push interval in seconds | `5` |
   | `InpDealDays` | Days of deal history to include per push | `1` |

6. **Allow live trading** checkbox must be ticked for the EA to run (it doesn't trade — it just calls WebRequest).

### Checking it works

Open the **Experts** tab in the MT5 terminal panel. You should see:
```
PropEdge Hub Bridge v1.1 — pushing to http://localhost:3000/api/mt5/push every 5s
```
Any errors (wrong secret, URL not whitelisted) are logged there.

---

## Option B — Python Worker

### Requirements

- Python 3.11+
- **Windows** machine or VPS with MT5 terminal installed
- MT5 accounts configured with **investor (read-only) password**

> On Linux/Mac without Wine the worker runs in **mock mode**, generating realistic simulated data so the pipeline can be developed end-to-end without a live terminal.

### Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Create your .env
cp .env.example .env
# Edit .env — fill in MT5_ACCOUNTS, NEXTJS_URL, BRIDGE_SECRET

# 3. Run
python main.py
```

### Configuration (`.env`)

| Variable | Description | Default |
|---|---|---|
| `MT5_ACCOUNTS` | Comma-separated `LOGIN:PASSWORD:SERVER:LABEL` | — |
| `NEXTJS_URL` | Base URL of your Next.js app | `http://localhost:3000` |
| `BRIDGE_SECRET` | Shared secret — must match `MT5_BRIDGE_SECRET` in `.env.local` | — |
| `POLL_INTERVAL_SECONDS` | How often to poll MT5 | `5` |
| `LOG_LEVEL` | `DEBUG \| INFO \| WARNING \| ERROR` | `INFO` |
| `BRIDGE_HOST` | FastAPI bind host | `0.0.0.0` |
| `BRIDGE_PORT` | FastAPI bind port | `8000` |
| `FORCE_REAL_MT5` | Set to `1` when running under Wine Python to bypass platform check | — |

### `MT5_ACCOUNTS` format

```
MT5_ACCOUNTS=1234567:InvestorPass:FTUKLimited-Server01:FTUK Phase2,8901234:InvestorPass2:FunderPro-Live:FunderPro P1
```

Always use the **investor (read-only) password**. The bridge never places, modifies, or cancels trades.

### Wine Python (advanced)

If you want to run the Python worker on Linux against a Wine MT5 terminal:

```bash
# Install Windows Python inside Wine
wine winget install Python.Python.3.11   # or use the installer .exe

# Install the MT5 package and dependencies inside Wine Python
wine pip install MetaTrader5 python-dotenv requests fastapi uvicorn

# Run with FORCE_REAL_MT5 to skip the Windows platform check
FORCE_REAL_MT5=1 wine python.exe main.py
```

The MQL5 EA (Option A) is simpler and more reliable for Wine.

### Running as a Windows service (production)

Use [NSSM](https://nssm.cc) to keep the worker running across reboots:

```bash
nssm install PropEdgeBridge "C:\Python311\python.exe" "C:\propedge\mt5_bridge\main.py"
nssm set PropEdgeBridge AppDirectory "C:\propedge\mt5_bridge"
nssm start PropEdgeBridge
```

---

## Linking accounts in the app

Before live data appears, the MT5 account must be linked to a challenge:

1. **Settings → MT5 Accounts** in the app — add your account number and server.
2. When creating a challenge, select the linked MT5 account.
3. The bridge matches on `account_number` to find the correct challenge and challenge owner.

---

## How it works

```
MT5 Terminal
    │  account_info / positions_get / history_deals_get
    ▼
MQL5 EA  ─── or ───  Python worker (mt5_client.py)
    │
    ▼  POST /api/mt5/push  (X-Bridge-Secret header)
Next.js API (/api/mt5/push/route.ts)
    │  1. Validate secret
    │  2. Resolve account_number → mt5Account → propChallenge
    │  3. Calculate daily loss %, max drawdown %, profit %
    │  4. Insert live_account_data snapshot
    │  5. Upsert closed trades (dedup on ticket)
    │  6. Check alert thresholds → insert alerts
    │  7. Send email + WhatsApp if critical
    │  8. Update challenge status (passed / failed)
    ▼
PostgreSQL (Neon)
    ▲
    │  TanStack Query polls every 5 s
Dashboard
```

---

## Drawdown calculations

All metrics are computed server-side in the Next.js API:

| Metric | Formula |
|---|---|
| **Daily loss %** | `(yesterday_close_equity − current_equity) / account_size × 100` |
| **Max drawdown %** | `(all-time peak equity − current_equity) / starting_balance × 100` |
| **Profit %** | `(current_equity − starting_balance) / starting_balance × 100` |

Alert thresholds:

| Threshold | Severity |
|---|---|
| ≥ 70 % of limit | `warning` |
| ≥ 90 % of limit | `critical` |
| ≥ 100 % of limit (breach) | `critical` + email + WhatsApp |
| Profit target reached | `info` |

"""
MT5 client with automatic mock fallback.

─── Wine / Linux users ────────────────────────────────────────────────────────
The MetaTrader5 Python package requires a native Windows Python + terminal.
On Linux with MT5 running under Wine you have two options:

  Option A — MQL5 Expert Advisor (recommended, no Python needed):
    Copy PropEdgeHub_Bridge.mq5 into <MT5 data>/MQL5/Experts/, compile,
    attach to a chart, and set InpNextJsUrl / InpBridgeSecret inputs.
    The EA pushes data directly to /api/mt5/push — this bridge is not needed.

  Option B — Wine Python (advanced):
    Install Python for Windows inside Wine, install MetaTrader5 there,
    then run:  wine python.exe main.py
    Set FORCE_REAL_MT5=1 in .env to bypass the platform check.
───────────────────────────────────────────────────────────────────────────────
"""
import os
import platform
import random
import time
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone, timedelta
from typing import Optional

logger = logging.getLogger(__name__)


# ── Data models ────────────────────────────────────────────────────────────────

@dataclass
class AccountInfo:
    login: int
    server: str
    equity: float
    balance: float
    margin_free: float
    currency: str = "USD"


@dataclass
class Position:
    ticket: int
    symbol: str
    type: str          # "buy" | "sell"
    volume: float
    price_open: float
    price_current: float
    profit: float
    swap: float
    time_open: datetime
    comment: str = ""


@dataclass
class Deal:
    """A closed trade / deal from MT5 history."""
    ticket: int
    order: int
    symbol: str
    type: str          # "buy" | "sell"
    volume: float
    price_open: float
    price_close: float
    profit: float
    swap: float
    commission: float
    time_open: datetime
    time_close: datetime
    comment: str = ""


# ── Real MT5 client ────────────────────────────────────────────────────────────

class RealMT5:
    """Wraps the MetaTrader5 Python package."""

    def __init__(self):
        import MetaTrader5 as mt5
        self._mt5 = mt5
        self._initialized = False

    def connect(self, login: int, password: str, server: str) -> bool:
        if not self._mt5.initialize():
            logger.error("MT5 initialize() failed: %s", self._mt5.last_error())
            return False
        ok = self._mt5.login(login, password=password, server=server)
        if not ok:
            logger.error("MT5 login failed for %d@%s: %s", login, server, self._mt5.last_error())
            return False
        self._initialized = True
        logger.info("MT5 connected: account %d @ %s", login, server)
        return True

    def disconnect(self):
        if self._initialized:
            self._mt5.shutdown()
            self._initialized = False

    def account_info(self) -> Optional[AccountInfo]:
        info = self._mt5.account_info()
        if info is None:
            return None
        return AccountInfo(
            login=info.login,
            server=info.server,
            equity=info.equity,
            balance=info.balance,
            margin_free=info.margin_free,
            currency=info.currency,
        )

    def open_positions(self) -> list[Position]:
        positions = self._mt5.positions_get()
        if positions is None:
            return []
        result = []
        for p in positions:
            result.append(Position(
                ticket=p.ticket,
                symbol=p.symbol,
                type="buy" if p.type == 0 else "sell",
                volume=p.volume,
                price_open=p.price_open,
                price_current=p.price_current,
                profit=p.profit,
                swap=p.swap,
                time_open=datetime.fromtimestamp(p.time, tz=timezone.utc),
                comment=p.comment or "",
            ))
        return result

    def closed_deals_since(self, since: datetime) -> list[Deal]:
        """Fetch closed deals from MT5 history since a given UTC datetime."""
        from_ts = since
        to_ts = datetime.now(tz=timezone.utc)
        deals = self._mt5.history_deals_get(from_ts, to_ts)
        if deals is None:
            return []

        # Group deals into round-trip pairs by position_id
        result = []
        for d in deals:
            # Only OUT deals (type 1 = sell out, type 0 = buy out after close)
            # entry: 0=in, 1=out, 2=inout (reversal)
            if d.entry not in (1, 2):
                continue
            result.append(Deal(
                ticket=d.ticket,
                order=d.order,
                symbol=d.symbol,
                type="buy" if d.type == 0 else "sell",
                volume=d.volume,
                price_open=d.price,       # entry price stored in comment or we'd need the IN deal
                price_close=d.price,
                profit=d.profit,
                swap=d.swap,
                commission=d.commission,
                time_open=datetime.fromtimestamp(d.time, tz=timezone.utc),
                time_close=datetime.fromtimestamp(d.time, tz=timezone.utc),
                comment=d.comment or "",
            ))
        return result


# ── Mock MT5 client ────────────────────────────────────────────────────────────

class MockMT5:
    """
    Simulates MT5 data for development on Linux/Mac.
    Generates a realistic drifting equity curve with occasional trades.
    """

    _SYMBOLS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "USDCAD", "GBPJPY"]
    _PRICES  = {"XAUUSD": 2315.0, "EURUSD": 1.0882, "GBPUSD": 1.2654,
                "USDJPY": 151.82, "USDCAD": 1.3640, "GBPJPY": 192.10}

    def __init__(self, login: int, starting_balance: float = 100_000.0):
        self._login = login
        self._balance = starting_balance
        self._equity = starting_balance + random.uniform(-200, 600)
        self._drift_pct = 0.0003      # small upward drift per poll
        self._noise_pct = 0.0008      # random noise per poll
        self._open_positions: list[Position] = []
        self._deal_counter = 900_000 + login
        self._last_trade_tick = 0

    def connect(self, login: int, password: str, server: str) -> bool:
        logger.info("[MOCK] Connected to MT5: account %d @ %s", login, server)
        return True

    def disconnect(self):
        logger.info("[MOCK] MT5 disconnected")

    def account_info(self) -> AccountInfo:
        # Drift equity slightly each call
        drift = self._equity * self._drift_pct
        noise = self._equity * self._noise_pct * random.uniform(-1, 1)
        # Add unrealised P&L from open positions
        unrealised = sum(p.profit for p in self._open_positions)
        self._equity = max(self._equity + drift + noise, self._balance * 0.85)

        return AccountInfo(
            login=self._login,
            server="MockServer-01",
            equity=round(self._equity + unrealised, 2),
            balance=round(self._balance, 2),
            margin_free=round(self._balance * 0.85, 2),
        )

    def open_positions(self) -> list[Position]:
        # Randomly open a position every ~60 polls, close after ~20 polls
        tick = int(time.time())
        if len(self._open_positions) == 0 and (tick - self._last_trade_tick) > 60:
            sym = random.choice(self._SYMBOLS)
            price = self._PRICES[sym] * random.uniform(0.9995, 1.0005)
            self._open_positions.append(Position(
                ticket=self._deal_counter,
                symbol=sym,
                type=random.choice(["buy", "sell"]),
                volume=round(random.choice([0.05, 0.10, 0.15, 0.20]), 2),
                price_open=round(price, 5),
                price_current=round(price * random.uniform(0.999, 1.001), 5),
                profit=round(random.uniform(-80, 150), 2),
                swap=0.0,
                time_open=datetime.now(tz=timezone.utc),
            ))
            self._deal_counter += 1
        elif len(self._open_positions) > 0 and (tick - self._last_trade_tick) > 80:
            # Close the open position
            self._open_positions.clear()
            self._last_trade_tick = tick

        # Update unrealised P&L
        for p in self._open_positions:
            p.price_current = round(p.price_open * random.uniform(0.9995, 1.0015), 5)
            p.profit = round((p.price_current - p.price_open) / p.price_open * 100 * p.volume * 1000, 2)

        return list(self._open_positions)

    def closed_deals_since(self, since: datetime) -> list[Deal]:
        # Generate 0-2 closed trades every ~120 seconds to simulate history
        if random.random() > 0.04:  # ~4% chance per poll ≈ 1 trade per 25 polls
            return []
        sym = random.choice(self._SYMBOLS)
        price_open  = self._PRICES[sym] * random.uniform(0.998, 1.002)
        price_close = price_open * random.uniform(0.997, 1.004)
        lot = random.choice([0.05, 0.10, 0.15, 0.20])
        profit = round((price_close - price_open) / price_open * 100 * lot * 1000 * random.choice([1, -1]), 2)
        now = datetime.now(tz=timezone.utc)
        deal = Deal(
            ticket=self._deal_counter,
            order=self._deal_counter + 1,
            symbol=sym,
            type=random.choice(["buy", "sell"]),
            volume=lot,
            price_open=round(price_open, 5),
            price_close=round(price_close, 5),
            profit=profit,
            swap=round(random.uniform(-3, 0), 2),
            commission=round(-lot * 7, 2),
            time_open=now - timedelta(minutes=random.randint(5, 120)),
            time_close=now,
        )
        self._deal_counter += 2
        self._balance += profit
        return [deal]


# ── Factory ────────────────────────────────────────────────────────────────────

def make_client(login: int) -> "RealMT5 | MockMT5":
    """Return a real MT5 client on Windows (or when FORCE_REAL_MT5=1), mock otherwise."""
    force_real = os.getenv("FORCE_REAL_MT5", "").strip() in ("1", "true", "yes")
    is_windows = platform.system() == "Windows"

    if is_windows or force_real:
        try:
            return RealMT5()
        except ImportError:
            logger.warning("MetaTrader5 package not installed — falling back to mock")

    if force_real:
        logger.warning("FORCE_REAL_MT5=1 but MetaTrader5 unavailable; using mock")
    else:
        logger.info("[MOCK] Non-Windows — using MockMT5 for account %d", login)
    return MockMT5(login=login)

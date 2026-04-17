"""
FastAPI REST layer for the PropEdge MT5 Bridge.

Runs alongside the push workers. Exposes live MT5 data directly
so the Next.js dashboard can query account state, positions, ticks,
and OHLCV history without waiting for the next push cycle.

All endpoints degrade gracefully — if a client is a MockMT5,
trading/history operations return a clear error; read-only ops
return simulated data.
"""
from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from mt5_client import RealMT5, MockMT5

logger = logging.getLogger(__name__)

app = FastAPI(title="PropEdge MT5 Bridge", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Client registry ─────────────────────────────────────────────────────────────
# Populated by main.py once workers connect.  login (int) → client instance.

_registry: dict[int, RealMT5 | MockMT5] = {}


def register(login: int, client: RealMT5 | MockMT5) -> None:
    _registry[login] = client
    logger.info("[registry] registered account %d (%s)", login, type(client).__name__)


def _client(login: int | None = None) -> RealMT5 | MockMT5 | None:
    """Return the requested client, or the first registered one."""
    if login is not None:
        return _registry.get(login)
    return next(iter(_registry.values()), None)


def _is_real(c: RealMT5 | MockMT5) -> bool:
    return isinstance(c, RealMT5)


# ── Pydantic models ──────────────────────────────────────────────────────────────

class OrderRequest(BaseModel):
    symbol: str
    action: str          # "buy" | "sell"
    volume: float
    stop_loss:   Optional[float] = None
    take_profit: Optional[float] = None
    comment:     Optional[str]  = "PropEdge"
    login:       Optional[int]  = None   # which account to trade on


# ── Health ──────────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    """Always returns 200. Shows connected accounts and their MT5 state."""
    accounts = []
    for login, client in _registry.items():
        try:
            info = client.account_info()
            accounts.append({
                "login":      login,
                "mode":       "real" if _is_real(client) else "mock",
                "equity":     info.equity if info else None,
                "balance":    info.balance if info else None,
                "connected":  info is not None,
            })
        except Exception:
            accounts.append({"login": login, "connected": False})

    return {
        "status":    "healthy",
        "accounts":  accounts,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ── Account ──────────────────────────────────────────────────────────────────────

@app.get("/account")
async def get_account(login: Optional[int] = Query(None)):
    """Return account info for the specified login (or first registered)."""
    c = _client(login)
    if c is None:
        return {"error": True, "message": "No MT5 client registered", "code": 5000}

    try:
        info = c.account_info()
        if info is None:
            return {"error": True, "message": "account_info() returned None", "code": 5001}

        return {
            "error":      False,
            "login":      info.login,
            "server":     info.server,
            "balance":    info.balance,
            "equity":     info.equity,
            "margin_free": info.margin_free,
            "currency":   info.currency,
            "mode":       "real" if _is_real(c) else "mock",
        }
    except Exception as exc:
        logger.error("get_account error: %s", exc)
        return {"error": True, "message": str(exc), "code": 5002}


# ── Positions ────────────────────────────────────────────────────────────────────

@app.get("/positions")
async def get_positions(login: Optional[int] = Query(None)):
    """Return open positions for the specified (or first) account."""
    c = _client(login)
    if c is None:
        return {"error": True, "message": "No MT5 client registered", "code": 5000}

    try:
        positions = c.open_positions()
        return {
            "error": False,
            "count": len(positions),
            "mode":  "real" if _is_real(c) else "mock",
            "positions": [
                {
                    "ticket":        p.ticket,
                    "symbol":        p.symbol,
                    "type":          p.type,
                    "volume":        p.volume,
                    "price_open":    p.price_open,
                    "price_current": p.price_current,
                    "profit":        p.profit,
                    "swap":          p.swap,
                    "time_open":     p.time_open.isoformat(),
                    "comment":       p.comment,
                }
                for p in positions
            ],
        }
    except Exception as exc:
        logger.error("get_positions error: %s", exc)
        return {"error": True, "message": str(exc), "code": 5010}


# ── Symbol / tick — real MT5 only ────────────────────────────────────────────────

@app.get("/symbol/{symbol}")
async def get_symbol(symbol: str, login: Optional[int] = Query(None)):
    """Symbol info and current bid/ask. Real MT5 only."""
    c = _client(login)
    if c is None:
        return {"error": True, "message": "No MT5 client registered", "code": 5000}
    if not _is_real(c):
        return {"error": True, "message": "Symbol info requires real MT5 (mock mode active)", "code": 5020}

    try:
        import MetaTrader5 as mt5
        info = mt5.symbol_info(symbol)
        if info is None:
            return {"error": True, "message": f"Symbol {symbol} not found", "code": 5021}
        tick = mt5.symbol_info_tick(symbol)
        return {
            "error":               False,
            "symbol":              symbol,
            "bid":                 tick.bid  if tick else None,
            "ask":                 tick.ask  if tick else None,
            "spread":              info.spread,
            "digits":              info.digits,
            "point":               info.point,
            "trade_contract_size": info.trade_contract_size,
            "volume_min":          info.volume_min,
            "volume_max":          info.volume_max,
            "volume_step":         info.volume_step,
            "description":         info.description,
            "currency_base":       info.currency_base,
            "currency_profit":     info.currency_profit,
        }
    except Exception as exc:
        logger.error("get_symbol error: %s", exc)
        return {"error": True, "message": str(exc), "code": 5022}


@app.get("/tick/{symbol}")
async def get_tick(symbol: str, login: Optional[int] = Query(None)):
    """Last tick. Real MT5 only."""
    c = _client(login)
    if c is None:
        return {"error": True, "message": "No MT5 client registered", "code": 5000}
    if not _is_real(c):
        return {"error": True, "message": "Tick data requires real MT5 (mock mode active)", "code": 5030}

    try:
        import MetaTrader5 as mt5
        tick = mt5.symbol_info_tick(symbol)
        if tick is None:
            return {"error": True, "message": f"No tick for {symbol}", "code": 5031}
        return {
            "error":  False,
            "symbol": symbol,
            "time":   tick.time,
            "bid":    tick.bid,
            "ask":    tick.ask,
            "last":   tick.last,
            "volume": tick.volume,
        }
    except Exception as exc:
        logger.error("get_tick error: %s", exc)
        return {"error": True, "message": str(exc), "code": 5032}


# ── Symbols list — real MT5 only ─────────────────────────────────────────────────

@app.get("/symbols")
async def get_symbols(login: Optional[int] = Query(None)):
    """All available symbols. Real MT5 only."""
    c = _client(login)
    if c is None:
        return {"error": True, "message": "No MT5 client registered", "code": 5000}
    if not _is_real(c):
        return {"error": True, "message": "Symbol list requires real MT5 (mock mode active)", "code": 5040}

    try:
        import MetaTrader5 as mt5
        symbols = mt5.symbols_get()
        return {
            "error":   False,
            "count":   len(symbols) if symbols else 0,
            "symbols": [{"name": s.name, "description": s.description} for s in (symbols or [])],
        }
    except Exception as exc:
        logger.error("get_symbols error: %s", exc)
        return {"error": True, "message": str(exc), "code": 5041}


# ── OHLCV history — real MT5 only ────────────────────────────────────────────────

_TF_MAP = {
    "M1": 1, "M5": 5, "M15": 15, "M30": 30,
    "H1": 16385, "H4": 16388, "D1": 16408, "W1": 32769, "MN1": 49153,
}

@app.get("/history/{symbol}")
async def get_history(
    symbol:    str,
    timeframe: str = Query("H1"),
    count:     int = Query(100, ge=1, le=5000),
    login: Optional[int] = Query(None),
):
    """OHLCV bars. Real MT5 only."""
    c = _client(login)
    if c is None:
        return {"error": True, "message": "No MT5 client registered", "code": 5000}
    if not _is_real(c):
        return {"error": True, "message": "OHLCV history requires real MT5 (mock mode active)", "code": 5050}

    try:
        import MetaTrader5 as mt5
        tf = _TF_MAP.get(timeframe.upper())
        if tf is None:
            return {"error": True, "message": f"Unknown timeframe '{timeframe}'", "code": 5051}

        rates = mt5.copy_rates_from_pos(symbol, tf, 0, count)
        if rates is None or len(rates) == 0:
            return {"error": True, "message": f"No data for {symbol}/{timeframe}", "code": 5052}

        return {
            "error":     False,
            "symbol":    symbol,
            "timeframe": timeframe,
            "count":     len(rates),
            "bars": [
                {
                    "time":   int(bar[0]),
                    "open":   float(bar[1]),
                    "high":   float(bar[2]),
                    "low":    float(bar[3]),
                    "close":  float(bar[4]),
                    "volume": int(bar[5]),
                }
                for bar in rates
            ],
        }
    except Exception as exc:
        logger.error("get_history error: %s", exc)
        return {"error": True, "message": str(exc), "code": 5053}


# ── Order creation — real MT5 only ───────────────────────────────────────────────

@app.post("/orders/create")
async def create_order(req: OrderRequest):
    """Market order. Real MT5 only — returns error in mock mode."""
    c = _client(req.login)
    if c is None:
        return {"error": True, "message": "No MT5 client registered", "code": 5000}
    if not _is_real(c):
        return {"error": True, "message": "Order execution requires real MT5 (mock mode active)", "code": 5060}

    try:
        import MetaTrader5 as mt5

        sym_info = mt5.symbol_info(req.symbol)
        if sym_info is None:
            return {"error": True, "message": f"Symbol {req.symbol} not found", "code": 5061}

        if not sym_info.visible:
            mt5.symbol_select(req.symbol, True)

        tick = mt5.symbol_info_tick(req.symbol)
        if tick is None:
            return {"error": True, "message": f"No tick for {req.symbol}", "code": 5062}

        action = req.action.lower()
        if action == "buy":
            order_type, price = mt5.ORDER_TYPE_BUY, tick.ask
        elif action == "sell":
            order_type, price = mt5.ORDER_TYPE_SELL, tick.bid
        else:
            return {"error": True, "message": f"Invalid action '{req.action}' — use 'buy' or 'sell'", "code": 5063}

        trade_req: dict[str, Any] = {
            "action":       mt5.TRADE_ACTION_DEAL,
            "symbol":       req.symbol,
            "volume":       req.volume,
            "type":         order_type,
            "price":        price,
            "deviation":    20,
            "magic":        234000,
            "comment":      req.comment,
            "type_time":    mt5.ORDER_TIME_GTC,
            "type_filling": mt5.ORDER_FILLING_IOC,
        }
        if req.stop_loss:   trade_req["sl"] = req.stop_loss
        if req.take_profit: trade_req["tp"] = req.take_profit

        result = mt5.order_send(trade_req)
        if result is None:
            err = mt5.last_error()
            return {"error": True, "message": f"order_send failed: {err}", "code": 5064}

        if result.retcode != mt5.TRADE_RETCODE_DONE:
            return {
                "error":   True,
                "message": f"Order rejected: {result.comment}",
                "retcode": result.retcode,
                "code":    5000 + result.retcode,
            }

        logger.info("Order filled: ticket=%d %s %s %.2f @ %.5f",
                    result.order, req.symbol, req.action, result.volume, result.price)

        return {
            "error":   False,
            "ticket":  result.order,
            "deal":    result.deal,
            "volume":  result.volume,
            "price":   result.price,
            "comment": result.comment,
            "retcode": result.retcode,
        }
    except Exception as exc:
        logger.error("create_order error: %s", exc)
        return {"error": True, "message": str(exc), "code": 5065}

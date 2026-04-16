"""HTTP client that pushes MT5 snapshots to the Next.js /api/mt5/push endpoint."""
import logging
from datetime import datetime, timezone
from typing import Any

import requests

from config import NEXTJS_URL, BRIDGE_SECRET
from mt5_client import AccountInfo, Position, Deal

logger = logging.getLogger(__name__)

PUSH_URL = f"{NEXTJS_URL}/api/mt5/push"
TIMEOUT  = 10  # seconds


def _serialise_position(p: Position) -> dict:
    return {
        "ticket":        p.ticket,
        "symbol":        p.symbol,
        "type":          p.type,
        "volume":        p.volume,
        "price_open":    p.price_open,
        "price_current": p.price_current,
        "profit":        p.profit,
        "swap":          p.swap,
        "time_open":     p.time_open.isoformat(),
    }


def _serialise_deal(d: Deal) -> dict:
    return {
        "ticket":      d.ticket,
        "symbol":      d.symbol,
        "type":        d.type,
        "volume":      d.volume,
        "price_open":  d.price_open,
        "price_close": d.price_close,
        "profit":      d.profit,
        "swap":        d.swap,
        "commission":  d.commission,
        "time_open":   d.time_open.isoformat(),
        "time_close":  d.time_close.isoformat(),
        "comment":     d.comment,
    }


def push_snapshot(
    account_info: AccountInfo,
    positions: list[Position],
    new_deals: list[Deal],
) -> bool:
    """
    POST a full snapshot to the Next.js bridge endpoint.
    Returns True on success, False on any error.
    """
    payload: dict[str, Any] = {
        "account_number":  str(account_info.login),
        "server":          account_info.server,
        "equity":          account_info.equity,
        "balance":         account_info.balance,
        "margin_free":     account_info.margin_free,
        "open_positions":  [_serialise_position(p) for p in positions],
        "closed_deals":    [_serialise_deal(d) for d in new_deals],
        "timestamp":       datetime.now(tz=timezone.utc).isoformat(),
    }

    try:
        resp = requests.post(
            PUSH_URL,
            json=payload,
            headers={
                "X-Bridge-Secret": BRIDGE_SECRET,
                "Content-Type":    "application/json",
            },
            timeout=TIMEOUT,
        )
        if resp.status_code == 200:
            data = resp.json()
            logger.debug(
                "Push OK — account %s, challenge %s, equity %.2f",
                account_info.login,
                data.get("challengeId", "?"),
                account_info.equity,
            )
            return True
        else:
            logger.warning(
                "Push returned %d for account %s: %s",
                resp.status_code,
                account_info.login,
                resp.text[:200],
            )
            return False
    except requests.exceptions.ConnectionError:
        logger.warning("Push failed — cannot reach %s (connection refused)", PUSH_URL)
        return False
    except requests.exceptions.Timeout:
        logger.warning("Push timed out for account %s", account_info.login)
        return False
    except Exception as exc:
        logger.error("Unexpected push error for account %s: %s", account_info.login, exc)
        return False

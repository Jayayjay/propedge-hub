"""
PropEdge MT5 Bridge — entry point.

Fetches active MT5 accounts from the Next.js API on startup and every
ACCOUNT_REFRESH_INTERVAL seconds, so new users who connect accounts via
the Settings page are picked up automatically without restarting the bridge.
"""
import logging
import signal
import sys
import threading
from datetime import datetime, timezone, timedelta
from threading import Event, Thread

import uvicorn

from config import (
    fetch_accounts, POLL_INTERVAL, LOG_LEVEL,
    BRIDGE_HOST, BRIDGE_PORT, ACCOUNT_REFRESH_INTERVAL, AccountConfig,
)
from mt5_client import make_client
from api_client import push_snapshot
import server as bridge_server

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("mt5_bridge")

_stop = Event()

def _handle_signal(sig, frame):
    logger.info("Signal %s — shutting down…", sig)
    _stop.set()

signal.signal(signal.SIGINT,  _handle_signal)
signal.signal(signal.SIGTERM, _handle_signal)


# ── Per-account push worker ────────────────────────────────────────────────────

class AccountWorker:
    RECONNECT_DELAY = 30

    def __init__(self, cfg: AccountConfig):
        self.cfg = cfg
        self._client = make_client(cfg.login)
        self._connected = False
        self._last_deal_fetch: datetime = (
            datetime.now(tz=timezone.utc) - timedelta(hours=24)
        )

    def _ensure_connected(self) -> bool:
        if self._connected:
            return True
        logger.info("Connecting %s (%s @ %s)…", self.cfg.label, self.cfg.login, self.cfg.server)
        ok = self._client.connect(self.cfg.login, self.cfg.password, self.cfg.server)
        if ok:
            self._connected = True
            bridge_server.register(self.cfg.login, self._client)
        return ok

    def _disconnect(self):
        self._client.disconnect()
        self._connected = False

    def _poll(self):
        if not self._ensure_connected():
            return
        try:
            info = self._client.account_info()
            if info is None:
                logger.warning("[%s] account_info() returned None — reconnecting", self.cfg.label)
                self._disconnect()
                return

            positions  = self._client.open_positions()
            new_deals  = self._client.closed_deals_since(self._last_deal_fetch)
            if new_deals:
                logger.info("[%s] %d new closed deal(s)", self.cfg.label, len(new_deals))
                self._last_deal_fetch = datetime.now(tz=timezone.utc)

            if not push_snapshot(info, positions, new_deals):
                logger.warning("[%s] push failed — will retry next cycle", self.cfg.label)

        except Exception as exc:
            logger.error("[%s] poll error: %s", self.cfg.label, exc, exc_info=True)
            self._disconnect()

    def run(self, stop: Event):
        logger.info("Worker started: %s (login %s)", self.cfg.label, self.cfg.login)
        while not stop.is_set():
            self._poll()
            stop.wait(POLL_INTERVAL)
        self._disconnect()
        logger.info("Worker stopped: %s", self.cfg.label)


# ── Account manager — hot-reloads new users' accounts ─────────────────────────

class AccountManager:
    """Watches the API for new accounts and spawns workers for them."""

    def __init__(self, stop: Event):
        self._stop     = stop
        self._active: dict[int, Thread] = {}   # login → thread

    def _spawn(self, cfg: AccountConfig):
        worker = AccountWorker(cfg)
        t = Thread(
            target=worker.run,
            args=(self._stop,),
            daemon=True,
            name=f"mt5-{cfg.login}",
        )
        t.start()
        self._active[cfg.login] = t
        logger.info("Spawned worker for account %s (%s)", cfg.login, cfg.label)

    def refresh(self):
        accounts = fetch_accounts()
        for cfg in accounts:
            if cfg.login not in self._active:
                self._spawn(cfg)
            # existing workers keep running — they reconnect on their own

    def run(self):
        self.refresh()   # initial load
        while not self._stop.is_set():
            self._stop.wait(ACCOUNT_REFRESH_INTERVAL)
            if not self._stop.is_set():
                logger.debug("Refreshing account list from API…")
                self.refresh()


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    logger.info(
        "PropEdge MT5 Bridge — polling every %ds, "
        "account refresh every %ds, API on %s:%d",
        POLL_INTERVAL, ACCOUNT_REFRESH_INTERVAL, BRIDGE_HOST, BRIDGE_PORT,
    )

    manager = AccountManager(_stop)

    # Run the account manager in its own thread
    mgr_thread = Thread(target=manager.run, daemon=True, name="account-manager")
    mgr_thread.start()

    # Block on FastAPI until Ctrl-C / SIGTERM
    cfg = uvicorn.Config(
        app=bridge_server.app,
        host=BRIDGE_HOST,
        port=BRIDGE_PORT,
        log_level=LOG_LEVEL.lower(),
    )
    srv = uvicorn.Server(cfg)
    try:
        srv.run()
    finally:
        _stop.set()

    mgr_thread.join(timeout=15)
    logger.info("Bridge stopped cleanly.")


if __name__ == "__main__":
    main()

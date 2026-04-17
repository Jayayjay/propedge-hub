"""
PropEdge MT5 Bridge — entry point.

Runs two things concurrently:
  1. AccountWorkers  — poll MT5 every POLL_INTERVAL seconds and POST
                       snapshots to Next.js /api/mt5/push
  2. FastAPI server  — REST endpoints for health, account info,
                       positions, tick data, OHLCV history, and orders

Workers register their MT5 clients into server.py's registry so the
REST endpoints can serve live data directly to the dashboard.
"""
import logging
import signal
import sys
import threading
from datetime import datetime, timezone, timedelta
from threading import Event, Thread

import uvicorn

from config import ACCOUNTS, POLL_INTERVAL, LOG_LEVEL, BRIDGE_HOST, BRIDGE_PORT, AccountConfig
from mt5_client import make_client
from api_client import push_snapshot
import server as bridge_server

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("mt5_bridge")

# ── Graceful shutdown ──────────────────────────────────────────────────────────
_stop = Event()

def _handle_signal(sig, frame):
    logger.info("Signal %s — shutting down…", sig)
    _stop.set()

signal.signal(signal.SIGINT,  _handle_signal)
signal.signal(signal.SIGTERM, _handle_signal)


# ── Per-account push worker ────────────────────────────────────────────────────

class AccountWorker:
    """Connects to one MT5 account, polls, pushes snapshots, and registers
    the client in the FastAPI registry for direct REST queries."""

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

            positions = self._client.open_positions()

            new_deals = self._client.closed_deals_since(self._last_deal_fetch)
            if new_deals:
                logger.info("[%s] %d new closed deal(s)", self.cfg.label, len(new_deals))
                self._last_deal_fetch = datetime.now(tz=timezone.utc)

            ok = push_snapshot(info, positions, new_deals)
            if not ok:
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


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    if not ACCOUNTS:
        logger.error(
            "No accounts configured. "
            "Set MT5_ACCOUNTS in .env (format: LOGIN:PASSWORD:SERVER:LABEL)"
        )
        sys.exit(1)

    logger.info(
        "PropEdge MT5 Bridge v2 — %d account(s), polling every %ds, API on %s:%d",
        len(ACCOUNTS), POLL_INTERVAL, BRIDGE_HOST, BRIDGE_PORT,
    )

    # Start push workers in daemon threads
    workers = [AccountWorker(cfg) for cfg in ACCOUNTS]
    threads = [
        Thread(
            target=w.run,
            args=(_stop,),
            daemon=True,
            name=f"mt5-{w.cfg.login}",
        )
        for w in workers
    ]
    for t in threads:
        t.start()

    # Run FastAPI in main thread (blocks until server stops)
    config = uvicorn.Config(
        app=bridge_server.app,
        host=BRIDGE_HOST,
        port=BRIDGE_PORT,
        log_level=LOG_LEVEL.lower(),
    )
    srv = uvicorn.Server(config)

    # When the server exits (e.g. Ctrl-C), signal workers to stop
    try:
        srv.run()
    finally:
        _stop.set()

    logger.info("Waiting for workers…")
    for t in threads:
        t.join(timeout=15)
    logger.info("Bridge stopped cleanly.")


if __name__ == "__main__":
    main()

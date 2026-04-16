"""
PropEdge MT5 Bridge
───────────────────
Polls one or more MT5 accounts and pushes live snapshots to the
Next.js /api/mt5/push endpoint every POLL_INTERVAL seconds.

Usage
-----
  # Install deps (Windows with MT5 terminal installed):
  pip install -r requirements.txt

  # Copy and fill in credentials:
  cp .env.example .env

  # Run:
  python main.py

The bridge runs forever and reconnects on errors.
To run as a background service on Windows, use NSSM or Task Scheduler.
"""
import logging
import signal
import sys
import time
from datetime import datetime, timezone, timedelta
from threading import Thread, Event

from config import ACCOUNTS, POLL_INTERVAL, LOG_LEVEL, AccountConfig
from mt5_client import make_client
from api_client import push_snapshot

# ── Logging ────────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("mt5_bridge")

# ── Graceful shutdown ──────────────────────────────────────────────────────────
_stop_event = Event()

def _handle_signal(sig, frame):
    logger.info("Signal %s received — shutting down…", sig)
    _stop_event.set()

signal.signal(signal.SIGINT,  _handle_signal)
signal.signal(signal.SIGTERM, _handle_signal)


# ── Per-account worker ─────────────────────────────────────────────────────────

class AccountWorker:
    """Manages one MT5 account: connects, polls, pushes."""

    RECONNECT_DELAY = 30  # seconds between reconnect attempts

    def __init__(self, cfg: AccountConfig):
        self.cfg = cfg
        self._client = make_client(cfg.login)
        self._connected = False
        # Track last sync time so we only fetch NEW closed deals
        self._last_deal_fetch: datetime = datetime.now(tz=timezone.utc) - timedelta(hours=24)

    # ── Connection ─────────────────────────────────────────────────────────────

    def ensure_connected(self) -> bool:
        if self._connected:
            return True
        logger.info("Connecting to %s (%s @ %s)…",
                    self.cfg.label, self.cfg.login, self.cfg.server)
        ok = self._client.connect(self.cfg.login, self.cfg.password, self.cfg.server)
        self._connected = ok
        return ok

    def disconnect(self):
        self._client.disconnect()
        self._connected = False

    # ── Single poll cycle ──────────────────────────────────────────────────────

    def poll_and_push(self):
        if not self.ensure_connected():
            return

        try:
            account_info = self._client.account_info()
            if account_info is None:
                logger.warning("[%s] account_info() returned None — reconnecting", self.cfg.label)
                self.disconnect()
                return

            positions = self._client.open_positions()

            # Only fetch deals we haven't seen yet
            new_deals = self._client.closed_deals_since(self._last_deal_fetch)
            if new_deals:
                logger.info("[%s] %d new closed deal(s)", self.cfg.label, len(new_deals))
                self._last_deal_fetch = datetime.now(tz=timezone.utc)

            ok = push_snapshot(account_info, positions, new_deals)
            if not ok:
                logger.warning("[%s] push failed — will retry next cycle", self.cfg.label)

        except Exception as exc:
            logger.error("[%s] poll error: %s — reconnecting", self.cfg.label, exc, exc_info=True)
            self.disconnect()

    # ── Thread loop ────────────────────────────────────────────────────────────

    def run(self, stop: Event):
        logger.info("Worker started for account %s (%s)", self.cfg.login, self.cfg.label)
        while not stop.is_set():
            self.poll_and_push()
            stop.wait(POLL_INTERVAL)
        self.disconnect()
        logger.info("Worker stopped for account %s", self.cfg.login)


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    if not ACCOUNTS:
        logger.error(
            "No accounts configured. "
            "Set MT5_ACCOUNTS in .env (format: LOGIN:PASSWORD:SERVER:LABEL)"
        )
        sys.exit(1)

    logger.info(
        "PropEdge MT5 Bridge starting — %d account(s), polling every %ds",
        len(ACCOUNTS),
        POLL_INTERVAL,
    )

    workers = [AccountWorker(cfg) for cfg in ACCOUNTS]
    threads = [
        Thread(target=w.run, args=(_stop_event,), daemon=True, name=f"mt5-{w.cfg.login}")
        for w in workers
    ]

    for t in threads:
        t.start()

    # Keep main thread alive; wait for shutdown signal
    try:
        while not _stop_event.is_set():
            _stop_event.wait(timeout=1)
    except KeyboardInterrupt:
        _stop_event.set()

    logger.info("Waiting for workers to finish…")
    for t in threads:
        t.join(timeout=15)

    logger.info("Bridge stopped cleanly.")


if __name__ == "__main__":
    main()

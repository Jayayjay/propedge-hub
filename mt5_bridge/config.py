"""Bridge configuration — accounts come from the Next.js API, not .env."""
import os
import logging
import requests
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


@dataclass
class AccountConfig:
    login: int
    password: str
    server: str
    label: str


NEXTJS_URL:    str = os.getenv("NEXTJS_URL", "http://localhost:3000").rstrip("/")
BRIDGE_SECRET: str = os.getenv("BRIDGE_SECRET", "PropEdge_Bridge007")
POLL_INTERVAL: int = int(os.getenv("POLL_INTERVAL_SECONDS", "5"))
LOG_LEVEL:     str = os.getenv("LOG_LEVEL", "INFO").upper()
BRIDGE_HOST:   str = os.getenv("BRIDGE_HOST", "0.0.0.0")
BRIDGE_PORT:   int = int(os.getenv("BRIDGE_PORT", "8000"))

# How often (seconds) to re-fetch the account list from the API
# so new users who add accounts get picked up without restarting.
ACCOUNT_REFRESH_INTERVAL: int = int(os.getenv("ACCOUNT_REFRESH_SECONDS", "120"))


def fetch_accounts() -> list[AccountConfig]:
    """Fetch all active MT5 accounts from the Next.js API."""
    url = f"{NEXTJS_URL}/api/mt5/accounts"
    try:
        r = requests.get(
            url,
            headers={"X-Bridge-Secret": BRIDGE_SECRET},
            timeout=10,
        )
        r.raise_for_status()
        data = r.json()
        accounts = []
        for a in data:
            if not a.get("password"):
                logger.warning("Account %s has no password stored — skipping", a.get("login"))
                continue
            accounts.append(AccountConfig(
                login=int(a["login"]),
                password=a["password"],
                server=a["server"],
                label=a["label"],
            ))
        logger.info("Fetched %d active account(s) from API", len(accounts))
        return accounts
    except Exception as exc:
        logger.error("Failed to fetch accounts from API (%s): %s", url, exc)
        return []

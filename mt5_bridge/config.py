"""Bridge configuration loaded from .env"""
import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass
class AccountConfig:
    login: int
    password: str
    server: str
    label: str


def parse_accounts() -> list[AccountConfig]:
    """Parse MT5_ACCOUNTS env var into a list of AccountConfig."""
    raw = os.getenv("MT5_ACCOUNTS", "")
    accounts = []
    for entry in raw.split(","):
        entry = entry.strip()
        if not entry:
            continue
        parts = entry.split(":", 3)
        if len(parts) != 4:
            raise ValueError(
                f"Invalid account entry '{entry}'. "
                "Expected format: LOGIN:PASSWORD:SERVER:LABEL"
            )
        login, password, server, label = parts
        accounts.append(AccountConfig(
            login=int(login),
            password=password,
            server=server.strip(),
            label=label.strip(),
        ))
    return accounts


# ── Exported config ────────────────────────────────────────────────────────────
NEXTJS_URL:    str  = os.getenv("NEXTJS_URL", "http://localhost:3000").rstrip("/")
BRIDGE_SECRET: str  = os.getenv("BRIDGE_SECRET", "dev-secret")
POLL_INTERVAL: int  = int(os.getenv("POLL_INTERVAL_SECONDS", "5"))
LOG_LEVEL:     str  = os.getenv("LOG_LEVEL", "INFO").upper()
BRIDGE_HOST:   str  = os.getenv("BRIDGE_HOST", "0.0.0.0")
BRIDGE_PORT:   int  = int(os.getenv("BRIDGE_PORT", "8000"))
ACCOUNTS: list[AccountConfig] = parse_accounts()

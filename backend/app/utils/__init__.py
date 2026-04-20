import uuid
from datetime import date, timedelta


def new_id() -> str:
    return str(uuid.uuid4())


def today_str() -> str:
    return date.today().isoformat()


def last_n_days(n: int) -> list[str]:
    today = date.today()
    return [(today - timedelta(days=i)).isoformat() for i in range(n - 1, -1, -1)]


def day_label(iso_date: str) -> str:
    """Return short weekday label from ISO date string."""
    d = date.fromisoformat(iso_date)
    return d.strftime("%a")

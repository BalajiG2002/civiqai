import json
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# ── In-memory fallback store (works without Redis server) ─────────
# Acts like Redis but uses a plain dict.  When a real Redis is
# available the app can be switched back by uncommenting the
# redis.Redis() block below.
# ------------------------------------------------------------------

class _MemoryStore:
    """Minimal Redis-compatible dict for dev / Windows environments."""
    def __init__(self):
        self._data: dict[str, str] = {}

    def set(self, key: str, value: str):
        self._data[key] = value

    def get(self, key: str) -> Optional[str]:
        return self._data.get(key)

    def keys(self, pattern: str = "*") -> list[str]:
        import fnmatch
        return [k for k in self._data if fnmatch.fnmatch(k, pattern)]

    def ping(self):
        return True

    def flushdb(self):
        self._data.clear()


# Try real Redis first, fall back to in-memory
_use_memory = True
try:
    import socket as _sock
    _s = _sock.socket(_sock.AF_INET, _sock.SOCK_STREAM)
    _s.settimeout(0.2)
    _s.connect(("localhost", 6379))
    _s.close()
    # Port is open — try real Redis
    import redis as _redis_lib
    from core.config import settings
    _real = _redis_lib.Redis(
        host=settings.REDIS_HOST, port=settings.REDIS_PORT,
        db=0, decode_responses=True,
        socket_connect_timeout=1, socket_timeout=1,
    )
    _real.ping()
    redis_client = _real
    _use_memory = False
    logger.info("✓ Connected to Redis at %s:%s", settings.REDIS_HOST, settings.REDIS_PORT)
except Exception as _e:
    pass

if _use_memory:
    redis_client = _MemoryStore()
    logger.warning("⚠ Redis unavailable — using in-memory store (dev mode)")


# ── Municipality helpers ──────────────────────────────────────────

def set_municipality(ward: str, category: str, data: dict) -> None:
    key = f"municipality:{ward.lower().replace(' ', '_')}:{category}"
    redis_client.set(key, json.dumps(data))

def get_municipality(ward: str, category: str) -> Optional[dict]:
    key = f"municipality:{ward.lower().replace(' ', '_')}:{category}"
    val = redis_client.get(key)
    if val is None:
        return None
    return json.loads(str(val))

def get_all_municipalities() -> list:
    keys = redis_client.keys("municipality:*")
    results = []
    for k in keys:
        val = redis_client.get(str(k))
        if val:
            results.append(json.loads(str(val)))
    return results


# ── SEED the 3 municipalities on import ────────────────────────────
# Avadi, Tambaram, Kancheepuram — all categories, all pointing
# to adithya8112002@gmail.com
# ------------------------------------------------------------------

_MUNICIPALITIES = {
    "avadi": {
        "name": "Avadi City Municipal Corporation",
        "area": "Avadi",
        "zone": "Avadi Zone",
        "lat":  13.1145, "lng": 80.1027,
        "depot_address": "Avadi Municipal Office, Avadi, Chennai 600062",
    },
    "tambaram": {
        "name": "Tambaram Corporation",
        "area": "Tambaram",
        "zone": "Tambaram Zone",
        "lat":  12.9249, "lng": 80.1000,
        "depot_address": "Tambaram Corporation Office, Tambaram, Chennai 600045",
    },
    "kancheepuram": {
        "name": "Kancheepuram Municipality",
        "area": "Kancheepuram",
        "zone": "Kancheepuram Zone",
        "lat":  12.8342, "lng": 79.7036,
        "depot_address": "Kancheepuram Municipal Office, Kancheepuram 631501",
    },
}

_CATEGORIES = ["roads", "water", "garbage", "electricity", "sewage", "parks"]

_DEPT_NAMES = {
    "roads":       "Roads & Public Works",
    "water":       "Water Supply & Drainage",
    "garbage":     "Solid Waste Management",
    "electricity": "Street Lighting & Power",
    "sewage":      "Sewage & Sanitation",
    "parks":       "Parks & Environment",
}

def _seed_municipalities():
    count = 0
    for key, muni in _MUNICIPALITIES.items():
        for cat in _CATEGORIES:
            data = {
                "ward": key,
                "zone": muni["zone"],
                "area": muni["area"],
                "municipality": muni["name"],
                "department": f"{_DEPT_NAMES[cat]} — {muni['name']}",
                "officer_name": f"Municipal Officer ({muni['area']})",
                "email": "adithya8112002@gmail.com",
                "phone": "044-12345678",
                "depot_address": muni["depot_address"],
                "lat": muni["lat"],
                "lng": muni["lng"],
            }
            set_municipality(key, cat, data)
            count += 1
    logger.info("✓ Seeded %d municipality entries (Avadi, Tambaram, Kancheepuram)", count)

_seed_municipalities()


# ── Official email cache ──────────────────────────────────────────
# Caches official corporation emails fetched from Google Search.
# Key: "official_email:<municipality_key>" → email string.
# ------------------------------------------------------------------

def get_cached_official_email(municipality_key: str) -> Optional[str]:
    """Return cached official email for a municipality, or None."""
    key = f"official_email:{municipality_key.lower().replace(' ', '_')}"
    val = redis_client.get(key)
    return str(val) if val else None

def cache_official_email(municipality_key: str, email: str) -> None:
    """Cache an official corporation email."""
    key = f"official_email:{municipality_key.lower().replace(' ', '_')}"
    redis_client.set(key, email)
    logger.info("  Cached official email for %s: %s", municipality_key, email)


# ── Status change log ──────────────────────────────────────────────
# Tracks every status transition for complaints.
# Key: "status_log:<complaint_id>" → JSON array of transitions.
# ------------------------------------------------------------------

def log_status_change(complaint_id: str, old_status: str,
                      new_status: str, changed_by: str = "officer") -> dict:
    """Append a status change entry to the complaint's history."""
    from datetime import datetime
    key = f"status_log:{complaint_id}"
    existing = redis_client.get(key)
    history: list = json.loads(existing) if existing else []
    entry = {
        "from": old_status,
        "to": new_status,
        "changed_by": changed_by,
        "timestamp": datetime.utcnow().isoformat(),
    }
    history.append(entry)
    redis_client.set(key, json.dumps(history))
    logger.info("  Status log: %s  %s → %s (by %s)",
                complaint_id, old_status, new_status, changed_by)
    return entry


def get_status_history(complaint_id: str) -> list:
    """Get full status change history for a complaint."""
    key = f"status_log:{complaint_id}"
    existing = redis_client.get(key)
    if not existing:
        return []
    return json.loads(existing)

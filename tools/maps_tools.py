"""
Geocoding & location tools — powered by OpenStreetMap Nominatim (free, no key).
Google Maps is NOT used.
"""
from core.database import SessionLocal, ComplaintDB
from core.redis_client import _MUNICIPALITIES
from datetime import datetime, timedelta
import math
import logging
import requests

logger = logging.getLogger(__name__)

# ── Nominatim (OpenStreetMap) — FREE, no API key ─────────────────
NOMINATIM_URL = "https://nominatim.openstreetmap.org"
NOMINATIM_HEADERS = {"User-Agent": "CiviqAI/1.0 (civic-complaint-platform)"}


# ──────────────────────────────────────────────────────────────────
#  Core Nominatim helpers
# ──────────────────────────────────────────────────────────────────
def _nominatim_geocode(address: str) -> dict | None:
    """Forward-geocode via OpenStreetMap Nominatim (free)."""
    try:
        r = requests.get(f"{NOMINATIM_URL}/search", params={
            "q": address, "format": "json", "limit": 1,
            "addressdetails": 1, "countrycodes": "in"
        }, headers=NOMINATIM_HEADERS, timeout=5)
        data = r.json()
        if data:
            hit = data[0]
            return {
                "lat": float(hit["lat"]),
                "lng": float(hit["lon"]),
                "display_name": hit.get("display_name", ""),
                "address": hit.get("address", {})
            }
    except Exception as e:
        logger.warning("     ⚠ Nominatim geocode error: %s", str(e)[:60])
    return None


def _nominatim_reverse(lat: float, lng: float) -> dict | None:
    """Reverse-geocode via OpenStreetMap Nominatim (free)."""
    try:
        r = requests.get(f"{NOMINATIM_URL}/reverse", params={
            "lat": lat, "lon": lng, "format": "json", "addressdetails": 1
        }, headers=NOMINATIM_HEADERS, timeout=5)
        data = r.json()
        if "address" in data:
            return {
                "display_name": data.get("display_name", ""),
                "address": data["address"]
            }
    except Exception as e:
        logger.warning("     ⚠ Nominatim reverse error: %s", str(e)[:60])
    return None


# ──────────────────────────────────────────────────────────────────
#  Municipality matching by coordinate proximity
# ──────────────────────────────────────────────────────────────────
def _match_municipality(lat: float, lng: float,
                        locality: str = "", address: str = "") -> tuple[str, float]:
    """Return (municipality_key, distance) for the closest seeded municipality."""
    best_key, best_dist = "unknown", float("inf")
    for key, muni in _MUNICIPALITIES.items():
        d = math.sqrt((lat - muni["lat"]) ** 2 + (lng - muni["lng"]) ** 2)
        if d < best_dist:
            best_dist = d
            best_key = key

    if best_dist > 0.15:                       # ~15 km threshold
        low = (locality or address).lower()
        for key in _MUNICIPALITIES:
            if key in low:
                return key, best_dist

    return best_key, best_dist


# ──────────────────────────────────────────────────────────────────
#  Public API — geocode / reverse-geocode
# ──────────────────────────────────────────────────────────────────
def geocode_address(address: str) -> dict:
    """Convert address → lat/lng.
    Priority: Nominatim (free) → seeded municipality → Chennai center."""
    logger.info("  → LocationAgent: geocoding address '%s'", address)

    # ── 1. Nominatim (OpenStreetMap) ──
    nom = _nominatim_geocode(f"{address}, Chennai, Tamil Nadu, India")
    if nom:
        logger.info("     ✓ Nominatim returned: (%s, %s) — %s",
                     nom["lat"], nom["lng"], nom["display_name"][:60])
        return {"lat": nom["lat"], "lng": nom["lng"],
                "formatted": nom["display_name"]}

    # ── 2. Fallback: match address text to seeded municipality ──
    low = address.lower()
    for key, muni in _MUNICIPALITIES.items():
        if key in low:
            logger.info("     ✓ Fallback matched municipality '%s' (%s, %s)",
                        key, muni["lat"], muni["lng"])
            return {"lat": muni["lat"], "lng": muni["lng"],
                    "formatted": f"{address} (near {muni['name']})"}

    # ── 3. Last resort: Chennai center ──
    logger.info("     ✓ Fallback: using Chennai center coords")
    return {"lat": 13.0827, "lng": 80.2707,
            "formatted": f"{address}, Chennai (approx)"}


def reverse_geocode(lat: float, lng: float) -> dict:
    """lat/lng → ward, zone, area, municipality, formatted address.
    Priority: Nominatim (free) → seeded municipality matching."""
    logger.info("  → LocationAgent: reverse geocoding (%s, %s)", lat, lng)

    ward, zone, area = "Unknown Ward", "Unknown Zone", "Unknown Area"
    locality = ""
    formatted_address = ""

    # ── 1. Nominatim (OpenStreetMap) ──
    nom = _nominatim_reverse(lat, lng)
    if nom:
        addr = nom["address"]
        formatted_address = nom["display_name"]
        locality = addr.get("city", addr.get("town", addr.get("village", "")))
        ward = addr.get("suburb", addr.get("neighbourhood", ward))
        zone = addr.get("city_district", addr.get("state_district", zone))
        area = addr.get("suburb", addr.get("town", area))
        logger.info("     ✓ Nominatim returned: %s", formatted_address[:80])

    # ── 2. Match to seeded municipality by coordinate proximity ──
    municipality, best_dist = _match_municipality(lat, lng, locality, formatted_address)

    # If Nominatim failed, build synthetic address from municipality data
    if not formatted_address and municipality != "unknown":
        muni_data = _MUNICIPALITIES.get(municipality, {})
        formatted_address = f"Near {muni_data.get('name', municipality)}, Chennai"
        area = muni_data.get("name", area)

    logger.info("     ✓ Result: Ward=%s, Zone=%s, Area=%s, Municipality=%s (dist=%.4f)",
                ward, zone, area, municipality, best_dist)
    return {
        "ward": ward,
        "zone": zone,
        "area": area,
        "municipality": municipality,
        "locality": locality or area,
        "formatted_address": formatted_address,
    }


# ──────────────────────────────────────────────────────────────────
#  Nearby complaints (pure math, no external API)
# ──────────────────────────────────────────────────────────────────
def find_nearby_complaints(lat: float, lng: float,
                            radius_m: int, hours: int,
                            issue_type: str) -> list:
    """Find complaints of same type near this location within time window.
    Uses Haversine-approximation (no external API)."""
    db = SessionLocal()
    since = datetime.utcnow() - timedelta(hours=hours)
    complaints = db.query(ComplaintDB).filter(
        ComplaintDB.issue_type == issue_type,
        ComplaintDB.submitted_at >= since
    ).all()
    db.close()

    nearby = []
    for c in complaints:
        if c.lat and c.lng:
            meters = int(math.sqrt((lat - c.lat)**2 + (lng - c.lng)**2) * 111_000)
            if meters <= radius_m:
                nearby.append({
                    "complaint_id": c.id,
                    "lat": c.lat, "lng": c.lng,
                    "severity": c.severity,
                    "distance_m": meters
                })
    return nearby


# ──────────────────────────────────────────────────────────────────
#  Route / directions (OSRM — free, no key)
# ──────────────────────────────────────────────────────────────────
OSRM_URL = "https://router.project-osrm.org/route/v1/driving"

def get_route_to_site(depot_address: str,
                       site_lat: float, site_lng: float) -> dict:
    """Get driving route from depot to complaint site via OSRM (free)."""
    try:
        # First geocode the depot address to coords
        depot = _nominatim_geocode(f"{depot_address}, Chennai, India")
        if not depot:
            raise ValueError("could not geocode depot")
        d_lat, d_lng = depot["lat"], depot["lng"]

        r = requests.get(
            f"{OSRM_URL}/{d_lng},{d_lat};{site_lng},{site_lat}",
            params={"overview": "false", "steps": "false"},
            headers=NOMINATIM_HEADERS, timeout=5
        )
        data = r.json()
        if data.get("code") == "Ok" and data.get("routes"):
            route = data["routes"][0]
            dur_min = round(route["duration"] / 60)
            dist_km = round(route["distance"] / 1000, 1)
            return {
                "duration": f"{dur_min} mins",
                "distance": f"{dist_km} km",
                "start_address": depot_address,
                "end_address": f"{site_lat},{site_lng}",
                "maps_url": f"https://www.openstreetmap.org/?mlat={site_lat}&mlon={site_lng}#map=16/{site_lat}/{site_lng}"
            }
        raise ValueError(data.get("code", "unknown"))
    except Exception as e:
        logger.warning("     ⚠ OSRM routing failed (%s), returning fallback", str(e)[:60])
        return {
            "duration": "N/A",
            "distance": "N/A",
            "start_address": depot_address,
            "end_address": f"{site_lat},{site_lng}",
            "maps_url": f"https://www.openstreetmap.org/?mlat={site_lat}&mlon={site_lng}#map=16/{site_lat}/{site_lng}"
        }


# ──────────────────────────────────────────────────────────────────
#  Utilities
# ──────────────────────────────────────────────────────────────────
def get_streetview_url(lat: float, lng: float) -> str:
    """Return an OpenStreetMap link for the location (replaces Google StreetView)."""
    return f"https://www.openstreetmap.org/?mlat={lat}&mlon={lng}#map=18/{lat}/{lng}"


def get_affected_households(lat: float, lng: float, radius_m: int) -> dict:
    """Estimate affected households via Overpass API (OpenStreetMap, free)."""
    try:
        query = f"""
        [out:json][timeout:5];
        (node["building"](around:{radius_m},{lat},{lng});
         way["building"](around:{radius_m},{lat},{lng}););
        out count;
        """
        r = requests.post("https://overpass-api.de/api/interpreter",
                          data={"data": query}, timeout=8)
        count = r.json().get("elements", [{}])[0].get("tags", {}).get("total", 0)
        count = int(count) if count else 0
        return {"estimated_households": count * 3, "buildings_found": count}
    except Exception:
        return {"estimated_households": 0, "buildings_found": 0}

from core.redis_client import redis_client, get_municipality
import json
import logging

logger = logging.getLogger(__name__)

ISSUE_CATEGORY_MAP = {
    "pothole":             "roads",
    "road_damage":         "roads",
    "water_leak":          "water",
    "waterlogging":        "water",
    "sewage_overflow":     "sewage",
    "garbage_overflow":    "garbage",
    "streetlight_failure": "electricity",
    "power_outage":        "electricity",
    "tree_fallen":         "parks",
    "other":               "roads",
}

def search_municipal_directory(ward: str, issue_type: str,
                                municipality: str | None = None) -> dict:
    """Find responsible officer and email from Redis.

    Lookup priority:
      1. municipality key (e.g. 'avadi') + category
      2. ward key + category
      3. wildcard scan for category
      4. hardcoded fallback
    """
    category = ISSUE_CATEGORY_MAP.get(issue_type, "roads")

    logger.info("  → DirectoryAgent: searching for %s officer", issue_type)
    logger.info("    municipality=%s  ward=%s  category=%s",
                municipality, ward, category)

    result = None

    # 1️⃣ Try municipality key first (from reverse_geocode match)
    if municipality:
        result = get_municipality(municipality, category)
        if result:
            logger.info("     ✓ Matched by municipality key '%s:%s'",
                        municipality, category)

    # 2️⃣ Fall back to ward key
    if not result:
        result = get_municipality(ward, category)
        if result:
            logger.info("     ✓ Matched by ward key '%s:%s'", ward, category)

    # 3️⃣ Wildcard scan
    if not result:
        keys = redis_client.keys(f"municipality:*:{category}")
        if keys:
            val = redis_client.get(keys[0])
            if val:
                result = json.loads(val)
                logger.info("     ✓ Wildcard match: %s", keys[0])

    # 4️⃣ Hardcoded fallback
    if not result:
        logger.info("     ⚠ Using fallback: Duty Officer")
        return {
            "email": "complaints@chennaicorporation.gov.in",
            "officer_name": "Duty Officer",
            "department": "Greater Chennai Corporation",
            "depot_address": "Ripon Building, Chennai",
            "municipality": "Greater Chennai Corporation",
        }

    logger.info("     ✓ Found: %s — %s <%s>",
                result.get('municipality'), result.get('officer_name'),
                result.get('email'))
    return result

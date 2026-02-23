"""
EXIF GPS metadata extraction from images.
Extracts latitude/longitude from JPEG/TIFF image EXIF data.
"""
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def _dms_to_decimal(dms_tuple, ref: str) -> float:
    """Convert EXIF DMS (degrees, minutes, seconds) to decimal degrees."""
    degrees, minutes, seconds = dms_tuple
    decimal = float(degrees) + float(minutes) / 60 + float(seconds) / 3600
    if ref in ("S", "W"):
        decimal = -decimal
    return decimal


def extract_gps_from_image(image_path: str) -> Optional[dict]:
    """
    Extract GPS coordinates from image EXIF metadata.

    Returns:
        dict with 'lat' and 'lng' keys, or None if no GPS data found.
    """
    try:
        from PIL import Image
        from PIL.ExifTags import TAGS, GPSTAGS

        img = Image.open(image_path)
        exif_data = img._getexif()

        if not exif_data:
            logger.info("     No EXIF data found in image")
            return None

        # Find GPSInfo tag
        gps_info = {}
        for tag_id, value in exif_data.items():
            tag_name = TAGS.get(tag_id, tag_id)
            if tag_name == "GPSInfo":
                for gps_tag_id, gps_value in value.items():
                    gps_tag_name = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    gps_info[gps_tag_name] = gps_value
                break

        if not gps_info:
            logger.info("     No GPS info in EXIF data")
            return None

        # Extract lat/lng
        lat_dms = gps_info.get("GPSLatitude")
        lat_ref = gps_info.get("GPSLatitudeRef", "N")
        lng_dms = gps_info.get("GPSLongitude")
        lng_ref = gps_info.get("GPSLongitudeRef", "E")

        if not lat_dms or not lng_dms:
            logger.info("     GPS tags present but lat/lng missing")
            return None

        lat = _dms_to_decimal(lat_dms, lat_ref)
        lng = _dms_to_decimal(lng_dms, lng_ref)

        # Sanity check — valid coordinate range
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            logger.warning("     Invalid GPS coordinates: (%s, %s)", lat, lng)
            return None

        logger.info("     ✓ EXIF GPS extracted: lat=%s  lng=%s", lat, lng)
        return {"lat": lat, "lng": lng}

    except ImportError:
        logger.warning("     Pillow not installed — cannot read EXIF data")
        return None
    except Exception as e:
        logger.info("     Could not extract GPS from EXIF: %s", str(e)[:100])
        return None

from google import genai
from google.genai import types
from typing import Optional
from core.config import settings
import json
import logging

logger = logging.getLogger(__name__)

client = genai.Client(api_key=settings.GEMINI_API_KEY)

FLASH  = "gemini-2.5-flash"
FLASH25 = "gemini-2.5-flash"


def gemini_analyze_image(image_path: str, location: str) -> dict:
    """Analyze complaint photo using Gemini vision to identify civic issue."""
    logger.info("  → ImageAnalysisAgent: calling gemini_analyze_image")
    logger.info("     Image: %s | Location: %s", image_path, location)
    
    with open(image_path, "rb") as f:
        image_bytes = f.read()

    prompt = f"""
    A citizen from {location} uploaded this photo as a civic complaint.
    Analyze carefully and return ONLY valid JSON:
    {{
      "issue_type": "one of: pothole, water_leak, garbage_overflow,
                    streetlight_failure, power_outage, waterlogging,
                    sewage_overflow, tree_fallen, other",
      "severity":    "low or moderate or high",
      "description": "one sentence plain English description",
      "confidence":  0-100
    }}
    """
    try:
        logger.info("     Calling Gemini Vision API...")
        response = client.models.generate_content(
            model=FLASH,
            contents=[
                types.Part.from_text(text=prompt),
                types.Part.from_bytes(
                    data=image_bytes,
                    mime_type="image/jpeg"
                )
            ]
        )
        text = response.text
        if text is None:
            logger.warning("     ✗ Gemini returned empty response")
            return {"issue_type": "other", "severity": "moderate",
                    "description": "Empty Gemini response", "confidence": 0}
        cleaned = text.strip().strip("```json").strip("```").strip()
        result = json.loads(cleaned)
        logger.info("     ✓ Image analysis complete: %s (%s severity)", 
                    result.get('issue_type'), result.get('severity'))
        return result
    except json.JSONDecodeError as e:
        logger.warning("     ✗ Failed to parse Gemini response as JSON")
        return {"issue_type": "other", "severity": "moderate",
                "description": "Could not parse image", "confidence": 0}
    except Exception as e:
        error_str = str(e)
        if "RESOURCE_EXHAUSTED" in error_str or "429" in error_str:
            logger.warning("     ✗ Gemini API quota exhausted (429)")
        else:
            logger.error("     ✗ Image analysis error: %s", error_str[:100])
        return {"issue_type": "other", "severity": "moderate",
                "description": f"Image analysis error: {e}", "confidence": 0}


def gemini_parse_complaint(email_body: str) -> dict:
    """Extract structured complaint data from email text."""
    prompt = f"""
    Extract complaint details from this email.
    Return ONLY valid JSON:
    {{
      "issue_type":    "pothole/water_leak/garbage_overflow/
                       streetlight_failure/power_outage/
                       waterlogging/sewage_overflow/tree_fallen",
      "location":      "exact address or landmark",
      "severity":      "low/moderate/high",
      "description":   "one line summary",
      "citizen_name":  "name if mentioned else null"
    }}
    Email: {email_body}
    """
    response = client.models.generate_content(
        model=FLASH,
        contents=prompt
    )
    text = response.text
    if text is None:
        return {"issue_type": "other", "severity": "low",
                "description": email_body[:100], "location": "unknown"}
    cleaned = text.strip().strip("```json").strip("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {"issue_type": "other", "severity": "low",
                "description": email_body[:100], "location": "unknown"}


def gemini_predict_failure(cluster_json: str, history_json: str) -> dict:
    """Predict infrastructure failure from cluster pattern vs history."""
    try:
        cluster = json.loads(cluster_json) if cluster_json else {}
        if not isinstance(cluster, dict):
            cluster = {}
    except Exception:
        cluster = {}

    try:
        history = json.loads(history_json) if history_json else []
        if not isinstance(history, list):
            history = []
    except Exception:
        history = []

    prompt = f"""
    Analyze this civic complaint cluster for failure prediction.

    CURRENT CLUSTER:
    - Type: {cluster.get('issue_type')}
    - Complaints: {cluster.get('size')} within {cluster.get('radius_m')}m
    - Timespan: last 48 hours
    - Location: {cluster.get('location_text')}

    SIMILAR HISTORICAL CLUSTERS:
    {json.dumps(history, indent=2)}

    Return ONLY valid JSON:
    {{
      "is_pre_failure":       true/false,
      "confidence":           0-100,
      "failure_type":         "pipe_burst/road_collapse/power_failure/etc",
      "estimated_window_hrs": number or null,
      "reasoning":            "one sentence explanation"
    }}
    """
    response = client.models.generate_content(
        model=FLASH25,
        contents=prompt
    )
    text = response.text
    if text is None:
        return {"is_pre_failure": False, "confidence": 0,
                "failure_type": "unknown", "reasoning": "empty response"}
    cleaned = text.strip().strip("```json").strip("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {"is_pre_failure": False, "confidence": 0,
                "failure_type": "unknown", "reasoning": "parse error"}


def gemini_write_work_order(
    complaint_id: str,
    issue_type: str,
    location: str,
    severity: str,
    officer_name: str,
    department: str,
    route_duration: str = "N/A",
    maps_url: str = "#",
    prediction_json: Optional[str] = None
) -> str:
    """Generate professional HTML work order email body."""
    prediction = None
    if prediction_json:
        try:
            parsed = json.loads(prediction_json)
            prediction = parsed if isinstance(parsed, dict) else None
        except Exception:
            prediction = None

    prediction_section = ""
    if prediction and prediction.get("is_pre_failure"):
        prediction_section = f"""
        <div style="background:#fef3c7;padding:12px;border-radius:6px;margin:12px 0">
          <strong>\u26a0\ufe0f AI Prediction:</strong>
          {str(prediction.get('failure_type','')).replace('_',' ').title()}
          likely within {prediction.get('estimated_window_hrs','?')} hours
          (Confidence: {prediction.get('confidence', 0)}%).<br/>
          <em>{prediction.get('reasoning','')}</em>
        </div>
        """

    prompt = f"""
    Write a professional municipal work order (3 short paragraphs max).
    Complaint: {complaint_id} | {issue_type.replace('_',' ').title()}
    Location:  {location}
    Severity:  {severity.upper()}
    Officer:   {officer_name}, {department}
    Route:     {route_duration} from depot
    Return plain HTML paragraphs only.
    """
    response = client.models.generate_content(
        model=FLASH,
        contents=prompt
    )
    return f"""
    <div style="font-family:sans-serif;max-width:600px;padding:20px">
      <h2 style="color:#dc2626">\U0001f6a8 Work Order \u2014 {complaint_id}</h2>
      <table style="width:100%;border-collapse:collapse;margin:12px 0">
        <tr><td style="padding:6px;font-weight:bold">Issue</td>
            <td>{issue_type.replace('_',' ').title()}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Location</td>
            <td>{location}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Severity</td>
            <td style="color:#dc2626">{severity.upper()}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Crew ETA</td>
            <td>{route_duration}</td></tr>
        <tr><td style="padding:6px;font-weight:bold">Maps</td>
            <td><a href="{maps_url}">View Location</a></td></tr>
      </table>
      {prediction_section}
      <div>{response.text or ''}</div>
      <p style="color:#6b7280;font-size:11px;margin-top:20px">
        Auto-generated by CiviqAI \u2022 #{complaint_id}
      </p>
    </div>
    """


def gemini_parse_status_reply(email_body: str) -> dict:
    """Extract status update from department reply email."""
    prompt = f"""
    From this department reply, extract status. Return ONLY JSON:
    {{
      "status": "acknowledged/in_progress/resolved/rejected",
      "eta":    "time if mentioned else null",
      "notes":  "important update notes"
    }}
    Email: {email_body}
    """
    response = client.models.generate_content(
        model=FLASH,
        contents=prompt
    )
    text = response.text
    if text is None:
        return {"status": "acknowledged", "eta": None, "notes": ""}
    cleaned = text.strip().strip("```json").strip("```").strip()
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {"status": "acknowledged", "eta": None, "notes": ""}


def gemini_lookup_official_email(municipality_name: str) -> Optional[str]:
    """Use Gemini with Google Search grounding to find the official
    corporation/municipality email address."""
    logger.info("  → Gemini Search: looking up official email for '%s'", municipality_name)
    prompt = (
        f"What is the official public grievance or complaint email address of "
        f"{municipality_name}, Tamil Nadu, India? "
        f"Return ONLY the email address (e.g. info@avadi.tn.gov.in). "
        f"If you cannot find an exact email, return the closest official "
        f"municipal contact email. Return ONLY the email, nothing else."
    )
    try:
        response = client.models.generate_content(
            model=FLASH,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            ),
        )
        text = (response.text or "").strip()
        # Extract email from the response (might contain extra text)
        import re as _re
        emails = _re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
        if emails:
            official = emails[0].lower()
            logger.info("     ✓ Found official email: %s", official)
            return official
        logger.warning("     ✗ No email found in Gemini response: %s", text[:120])
        return None
    except Exception as e:
        logger.error("     ✗ Gemini search error: %s", str(e)[:100])
        return None


def gemini_summarize_trends(complaints_json: str) -> str:
    """Generate plain English trend summary for officer analytics."""
    try:
        complaints = json.loads(complaints_json) if complaints_json else []
        if not isinstance(complaints, list):
            complaints = []
    except Exception:
        complaints = []

    prompt = f"""
    Summarize these civic complaints for a municipal officer in 3-4 sentences.
    Highlight: most common issue, worst zones, open P1s, resolution rate.
    Data: {json.dumps(complaints[:50], indent=2)}
    """
    result = client.models.generate_content(
        model=FLASH25,
        contents=prompt
    )
    return result.text or "No summary available."

from core.gmail_client import get_gmail_service, build_email, settings
import base64
import logging

logger = logging.getLogger(__name__)

def gmail_watch() -> dict:
    """Register Gmail inbox watch for Pub/Sub notifications."""
    svc = get_gmail_service()
    body = {
        "labelIds": ["INBOX"],
        "topicName": f"projects/{settings.PUBSUB_PROJECT_ID}/topics/{settings.PUBSUB_TOPIC}"
    }
    result = svc.users().watch(userId="me", body=body).execute()
    return {"expiration": result["expiration"], "historyId": result["historyId"]}


def gmail_get_latest_message(history_id: str) -> dict:
    """Fetch the latest Gmail message since a given historyId.
    Used by the inbox webhook to retrieve the actual email content."""
    svc = get_gmail_service()
    try:
        history = svc.users().history().list(
            userId="me", startHistoryId=history_id,
            historyTypes=["messageAdded"]
        ).execute()
        messages = []
        for record in history.get("history", []):
            for msg in record.get("messagesAdded", []):
                messages.append(msg["message"]["id"])
        if not messages:
            return {"error": "no_new_messages"}
        # Fetch the most recent message
        return gmail_get_message(messages[-1])
    except Exception as e:
        return {"error": str(e)}


def gmail_get_message(message_id: str) -> dict:
    """Fetch full email body from Gmail by message ID."""
    svc = get_gmail_service()
    msg = svc.users().messages().get(
        userId="me", id=message_id, format="full"
    ).execute()

    body = ""
    payload = msg.get("payload", {})
    parts = payload.get("parts", [])
    if parts:
        for part in parts:
            if part.get("mimeType") == "text/plain":
                data = part["body"].get("data", "")
                body = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")
                break
    else:
        data = payload.get("body", {}).get("data", "")
        body = base64.urlsafe_b64decode(data).decode("utf-8", errors="ignore")

    headers = {h["name"]: h["value"] for h in payload.get("headers", [])}
    return {
        "message_id": message_id,
        "from": headers.get("From", ""),
        "subject": headers.get("Subject", ""),
        "body": body
    }

def gmail_send_work_order(to: str, complaint_id: str,
                           subject: str, html_body: str,
                           image_path: str = None,
                           cc: str = None) -> dict:
    """Send formatted work order email to municipal department."""
    logger.info("  → EmailDispatchAgent: sending work order to %s (cc: %s)", to, cc)
    svc = get_gmail_service()
    msg = build_email(to=to, subject=subject,
                      html_body=html_body, attachment_path=image_path,
                      cc=cc)
    result = svc.users().messages().send(
        userId="me", body=msg
    ).execute()
    logger.info("     ✓ Work order sent: %s", complaint_id)
    return {"message_id": result["id"], "status": "sent"}

def gmail_send_acknowledgement(citizen_email: str,
                                complaint_id: str,
                                issue_type: str,
                                status: str = "received") -> dict:
    """Send acknowledgement email to the citizen."""
    svc = get_gmail_service()
    status_map = {
        "received": ("received \u2014 we're on it", "#f59e0b"),
        "resolved": ("has been resolved \u2705", "#10b981")
    }
    msg_text, color = status_map.get(status, status_map["received"])

    html = f"""
    <div style="font-family:sans-serif;max-width:500px;padding:20px">
      <h2 style="color:{color}">CiviqAI \u2014 Complaint Update</h2>
      <p>Your <strong>{issue_type.replace('_', ' ')}</strong> complaint
         <strong>#{complaint_id}</strong> has been {msg_text}.</p>
      <p style="color:#6b7280;font-size:12px">
        CiviqAI \u2014 Civic Intelligence Platform
      </p>
    </div>
    """
    msg = build_email(to=citizen_email,
                      subject=f"CiviqAI \u2014 Complaint #{complaint_id} Update",
                      html_body=html)
    result = svc.users().messages().send(
        userId="me", body=msg
    ).execute()
    return {"message_id": result["id"], "status": "sent"}

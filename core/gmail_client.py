import base64
import json
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from core.config import settings

_gmail_service = None

def get_gmail_service():
    """Lazy-init Gmail service — only called when a Gmail tool runs."""
    global _gmail_service
    if _gmail_service is not None:
        return _gmail_service

    if not settings.GMAIL_REFRESH_TOKEN:
        raise RuntimeError(
            "GMAIL_REFRESH_TOKEN is empty. "
            "Run `python seed/get_refresh_token.py` to obtain one."
        )

    creds = Credentials(
        token=None,
        refresh_token=settings.GMAIL_REFRESH_TOKEN,
        client_id=settings.GMAIL_CLIENT_ID,
        client_secret=settings.GMAIL_CLIENT_SECRET,
        token_uri="https://oauth2.googleapis.com/token",
        scopes=[
            "https://www.googleapis.com/auth/gmail.send",
            "https://www.googleapis.com/auth/gmail.readonly",
            "https://www.googleapis.com/auth/gmail.modify"
        ]
    )
    creds.refresh(Request())
    _gmail_service = build("gmail", "v1", credentials=creds)
    return _gmail_service

def _guess_image_mime(filename: str) -> tuple:
    """Return (maintype, subtype) for common image formats."""
    ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else 'jpeg'
    mime_map = {
        'jpg': ('image', 'jpeg'), 'jpeg': ('image', 'jpeg'),
        'png': ('image', 'png'), 'gif': ('image', 'gif'),
        'webp': ('image', 'webp'), 'bmp': ('image', 'bmp'),
    }
    return mime_map.get(ext, ('application', 'octet-stream'))


def build_email(to: str, subject: str, html_body: str,
                attachment_path: str | None = None,
                cc: str | None = None) -> dict:
    """Build a MIME email with optional inline image + attachment + CC."""
    from email.mime.image import MIMEImage
    import os

    # Use 'related' so inline images render in the HTML body
    msg = MIMEMultipart("related")
    msg["To"] = to
    msg["From"] = settings.GMAIL_USER_EMAIL
    msg["Subject"] = subject
    if cc:
        msg["Cc"] = cc

    # If we have an image, inject it inline in the HTML
    if attachment_path and os.path.isfile(attachment_path):
        filename = os.path.basename(attachment_path)
        # Add inline image reference to the HTML body
        img_block = (
            '<hr style="border:none;border-top:1px solid #e5e7eb;margin:16px 0"/>'
            '<p style="font-size:13px;color:#6b7280;margin-bottom:8px">'
            '&#128248; <strong>Complaint Photo:</strong></p>'
            '<img src="cid:complaint_image" alt="Complaint Photo"'
            ' style="max-width:100%;border-radius:8px;border:1px solid #e5e7eb" />'
        )
        # Insert image block before the last </div>
        last_div = html_body.rfind("</div>")
        if last_div != -1:
            inline_html = html_body[:last_div] + img_block + html_body[last_div:]
        else:
            inline_html = html_body + img_block
        msg.attach(MIMEText(inline_html, "html"))

        # Attach as inline image
        with open(attachment_path, "rb") as f:
            img_data = f.read()
        maintype, subtype = _guess_image_mime(filename)
        if maintype == 'image':
            img_part = MIMEImage(img_data, _subtype=subtype)
        else:
            img_part = MIMEBase(maintype, subtype)
            img_part.set_payload(img_data)
            encoders.encode_base64(img_part)
        img_part.add_header("Content-ID", "<complaint_image>")
        img_part.add_header("Content-Disposition", "inline",
                            filename=filename)
        msg.attach(img_part)

        # Also attach as a downloadable file
        with open(attachment_path, "rb") as f:
            attach_part = MIMEBase(maintype, subtype)
            attach_part.set_payload(f.read())
            encoders.encode_base64(attach_part)
            attach_part.add_header("Content-Disposition", "attachment",
                                   filename=filename)
            msg.attach(attach_part)
    else:
        msg.attach(MIMEText(html_body, "html"))

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    return {"raw": raw}

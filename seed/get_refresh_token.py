"""
Obtain a Gmail OAuth2 refresh token for CiviqAI.

Run this once:
    python seed/get_refresh_token.py

It will:
  1. Open your browser for Google sign-in
  2. Ask you to authorize Gmail access
  3. Print the refresh token
  4. Patch your .env automatically

Prerequisites:
  - GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET must be set in .env
  - http://localhost:8080/ must be added as redirect URI
"""

import json
import http.server
import urllib.parse
import urllib.request
import webbrowser
import threading
from pathlib import Path
import sys

# ────────────────────────────────────────────────────────────────
# Load .env manually
# ────────────────────────────────────────────────────────────────

env_path = Path(__file__).resolve().parent.parent / ".env"

if not env_path.exists():
    raise SystemExit("ERROR: .env file not found in project root.")

env_vars = {}
for line in env_path.read_text(encoding="utf-8").splitlines():
    line = line.strip()
    if line and not line.startswith("#") and "=" in line:
        k, v = line.split("=", 1)
        env_vars[k.strip()] = v.strip()

CLIENT_ID     = env_vars.get("GMAIL_CLIENT_ID", "")
CLIENT_SECRET = env_vars.get("GMAIL_CLIENT_SECRET", "")

if not CLIENT_ID or not CLIENT_SECRET:
    raise SystemExit(
        "ERROR: Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env first."
    )

# ────────────────────────────────────────────────────────────────
# OAuth Config
# ────────────────────────────────────────────────────────────────

SCOPES = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
]

REDIRECT_URI = "http://localhost:8080/"
TOKEN_URL    = "https://oauth2.googleapis.com/token"

# ────────────────────────────────────────────────────────────────
# Step 1: Build Authorization URL
# ────────────────────────────────────────────────────────────────

auth_url = (
    "https://accounts.google.com/o/oauth2/v2/auth?"
    + urllib.parse.urlencode({
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
    })
)

# ────────────────────────────────────────────────────────────────
# Step 2: Temporary Local Server
# ────────────────────────────────────────────────────────────────

auth_code = None

class CallbackHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code

        qs = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(qs)
        auth_code = params.get("code", [None])[0]

        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.end_headers()
        self.wfile.write(
            b"<h2>Authorization successful! You can close this tab.</h2>"
        )

    def log_message(self, *_):
        pass  # silence server logs

print("\nOpening browser for Google sign-in...\n")

server = http.server.HTTPServer(("localhost", 8080), CallbackHandler)
thread = threading.Thread(target=server.handle_request, daemon=True)
thread.start()

webbrowser.open(auth_url)

print("If browser did not open, visit this URL manually:\n")
print(auth_url + "\n")

thread.join(timeout=180)
server.server_close()

if not auth_code:
    raise SystemExit(
        "\nERROR: No authorization code received.\n"
        "Make sure:\n"
        "  • Redirect URI is correct\n"
        "  • Port 8080 is not blocked\n"
    )

print("Authorization code received.\n")

# ────────────────────────────────────────────────────────────────
# Step 3: Exchange Code for Tokens
# ────────────────────────────────────────────────────────────────

token_data = urllib.parse.urlencode({
    "code": auth_code,
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "redirect_uri": REDIRECT_URI,
    "grant_type": "authorization_code",
}).encode()

req = urllib.request.Request(TOKEN_URL, data=token_data, method="POST")
req.add_header("Content-Type", "application/x-www-form-urlencoded")

try:
    with urllib.request.urlopen(req) as resp:
        tokens = json.loads(resp.read().decode())
except Exception as e:
    raise SystemExit(f"ERROR exchanging code for token:\n{e}")

refresh_token = tokens.get("refresh_token")

if not refresh_token:
    raise SystemExit(
        "\nERROR: Google did not return a refresh_token.\n"
        "Possible reasons:\n"
        "  • App already authorized before\n"
        "  • Missing access_type=offline\n"
        "  • Missing prompt=consent\n\n"
        "Fix:\n"
        "  1. Visit https://myaccount.google.com/permissions\n"
        "  2. Remove this app\n"
        "  3. Run this script again\n"
    )

print("Refresh token obtained successfully.\n")

# ────────────────────────────────────────────────────────────────
# Step 4: Safely Update .env
# ────────────────────────────────────────────────────────────────

env_lines = env_path.read_text(encoding="utf-8").splitlines()
updated = False

for i, line in enumerate(env_lines):
    if line.startswith("GMAIL_REFRESH_TOKEN="):
        env_lines[i] = f"GMAIL_REFRESH_TOKEN={refresh_token}"
        updated = True
        break

if not updated:
    env_lines.append(f"GMAIL_REFRESH_TOKEN={refresh_token}")

env_path.write_text("\n".join(env_lines) + "\n", encoding="utf-8")

print("✅ Refresh token saved to .env\n")
print(f"GMAIL_REFRESH_TOKEN={refresh_token}\n")
print("Now restart your server:\n")
print("    uvicorn api.main:app --reload\n")
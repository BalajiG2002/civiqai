"""Quick smoke test for all CiviqAI API endpoints."""
import urllib.request
import json
import sys

BASE = "http://localhost:8080"
results = []

def test(method, path, body=None, headers=None, timeout=60):
    url = BASE + path
    req = urllib.request.Request(url, data=body, headers=headers or {}, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode())
            results.append((path, "OK", resp.status, data))
            print(f"  {method:5} {path:20} -> {resp.status} {json.dumps(data)[:120]}")
            return data
    except Exception as e:
        detail = ""
        if hasattr(e, "read"):
            detail = e.read().decode()[:200]
        results.append((path, "FAIL", str(e), detail))
        print(f"  {method:5} {path:20} -> FAIL: {e}")
        if detail:
            print(f"        {detail}")
        return None

print("\n=== CiviqAI API Smoke Tests ===\n")

# 1. Health
print("[1] GET /health")
test("GET", "/health")

# 2. Complaints (empty DB)
print("[2] GET /complaints")
test("GET", "/complaints")

# 3. POST /complaint (multipart with tiny image)
print("[3] POST /complaint")
boundary = "----CiviqTestBoundary"
parts = []
parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"location\"\r\n\r\nAnna Nagar, Chennai")
parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"citizen_email\"\r\n\r\ntest@example.com")
parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"image\"; filename=\"test.jpg\"\r\nContent-Type: image/jpeg\r\n\r\nfake-image-bytes")
parts.append(f"--{boundary}--")
body = "\r\n".join(parts).encode("utf-8")
test("POST", "/complaint", body=body, headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}, timeout=90)

# 4. POST /chat
print("[4] POST /chat")
chat_body = json.dumps({"officer_id": "test_officer", "message": "Show me latest complaints"}).encode()
test("POST", "/chat", body=chat_body, headers={"Content-Type": "application/json"}, timeout=90)

# 5. POST /inbox (dummy pubsub)
print("[5] POST /inbox")
import base64
inbox_payload = base64.b64encode(json.dumps({"historyId": "12345", "emailAddress": "test@test.com"}).encode()).decode()
inbox_body = json.dumps({"message": {"data": inbox_payload}}).encode()
test("POST", "/inbox", body=inbox_body, headers={"Content-Type": "application/json"}, timeout=90)

# Summary
print("\n=== Summary ===")
ok = sum(1 for r in results if r[1] == "OK")
print(f"  {ok}/{len(results)} endpoints responded successfully\n")

#!/usr/bin/env python3
"""One-time Google OAuth consent for the ads tooling (stdlib only, loopback flow).

Writes .secrets/google-ads-token.json (client_id, client_secret, refresh_token, scopes) in
the same shape as .secrets/token.json (GA4), which is left untouched.

Scopes: Google Ads API, Merchant Center (Content / Merchant API), GA4 read-only.

Usage:  python3 scripts/ops/google-oauth-consent.py
        -> prints a URL; open it, sign in as support@robome.io, click Allow.
"""
import http.server
import json
import secrets
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CREDS = ROOT / ".secrets" / "oauth-credentials.json"
OUT = ROOT / ".secrets" / "google-ads-token.json"
SCOPES = [
    "https://www.googleapis.com/auth/adwords",
    "https://www.googleapis.com/auth/content",
    "https://www.googleapis.com/auth/analytics.readonly",
]
PORT = 8765


def main():
    c = json.loads(CREDS.read_text())
    c = c.get("installed") or c.get("web")
    redirect = f"http://127.0.0.1:{PORT}/"
    state = secrets.token_urlsafe(16)
    url = c["auth_uri"] + "?" + urllib.parse.urlencode({
        "client_id": c["client_id"], "redirect_uri": redirect, "response_type": "code",
        "scope": " ".join(SCOPES), "access_type": "offline", "prompt": "consent",
        "state": state, "login_hint": "support@robome.io",
    })
    print("Open this URL and click Allow:\n" + url, flush=True)

    result = {}

    class Handler(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
            if q.get("state", [""])[0] != state:
                self.send_response(400); self.end_headers(); return
            result["code"] = q.get("code", [None])[0]
            result["error"] = q.get("error", [None])[0]
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.end_headers()
            self.wfile.write(b"Done - you can close this tab." if result["code"] else b"Consent failed.")

        def log_message(self, *a):
            pass

    srv = http.server.HTTPServer(("127.0.0.1", PORT), Handler)
    while "code" not in result:
        srv.handle_request()
    if not result["code"]:
        sys.exit(f"consent failed: {result['error']}")

    body = urllib.parse.urlencode({
        "code": result["code"], "client_id": c["client_id"], "client_secret": c["client_secret"],
        "redirect_uri": redirect, "grant_type": "authorization_code",
    }).encode()
    tok = json.load(urllib.request.urlopen(urllib.request.Request(c["token_uri"], data=body)))
    if "refresh_token" not in tok:
        sys.exit("no refresh_token returned")
    OUT.write_text(json.dumps({
        "client_id": c["client_id"], "client_secret": c["client_secret"],
        "refresh_token": tok["refresh_token"], "token_uri": c["token_uri"],
        "scopes": tok.get("scope", "").split(),
    }, indent=1))
    OUT.chmod(0o600)
    print(f"saved {OUT.relative_to(ROOT)} with scopes: {tok.get('scope')}")


if __name__ == "__main__":
    main()

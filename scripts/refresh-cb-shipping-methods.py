#!/usr/bin/env python3
"""
Refresh data/cb-shipping-methods.json from CB tbl_ShippingMethodUpdate.

The web app (Vercel) has no live connection to the on-prem CB database, so the
per-item shipping method used by the CB order-import generator is cached here.
Re-run this on the VPN whenever the CB shipping-method mappings change.

  python scripts/refresh-cb-shipping-methods.py

Output: data/cb-shipping-methods.json  →  { "<itemname lowercased>": "<ShippingMethod>", ... }
Lookup default when an item isn't found: "UPS Ground".
"""
import os, re, json, sys
try:
    import pyodbc
    from dotenv import load_dotenv
except ImportError:
    sys.exit("pip install pyodbc python-dotenv (use a venv)")

load_dotenv(".env.local")
cs = os.environ["CB_READONLY_DB_CONNECTION_STRING"]
cs = re.sub(r"Server=[^;]+", "Server=10.8.33.11,1433", cs, flags=re.I)
cs = re.sub(r"Database=[^;]+", "Database=JLConceptsProduction18", cs, flags=re.I)
if "trustservercertificate" not in cs.lower():
    cs += ";TrustServerCertificate=yes"

cur = pyodbc.connect(cs, timeout=60).cursor()
cur.execute("SELECT ItemName, ShippingMethod FROM tbl_ShippingMethodUpdate WHERE ItemName IS NOT NULL AND ShippingMethod IS NOT NULL")
out = {}
for name, method in cur.fetchall():
    k = str(name).strip().lower()
    v = str(method).strip()
    if k and v:
        out[k] = v
path = "data/cb-shipping-methods.json"
with open(path, "w") as f:
    json.dump(out, f, separators=(",", ":"), sort_keys=True)
print(f"wrote {len(out):,} item→method mappings -> {path}")

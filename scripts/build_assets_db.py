import urllib.request
import json
import os

OUT_PATH = "src/shared/data/global_assets.json"

def fetch_json(url):
    print(f"Fetching {url}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8')).get("data", [])
    except Exception as e:
        print(f"Failed to fetch {url}: {e}")
        return []

print("Initiating Asset Harvest Protocol...")
nasdaq = fetch_json("https://api.twelvedata.com/stocks?exchange=NASDAQ")
nyse = fetch_json("https://api.twelvedata.com/stocks?exchange=NYSE")
forex = fetch_json("https://api.twelvedata.com/forex_pairs")
crypto = fetch_json("https://api.twelvedata.com/cryptocurrencies")

print(f"Harvested: {len(nasdaq)} NASDAQ, {len(nyse)} NYSE, {len(forex)} Forex, {len(crypto)} Crypto")

formatted = []
for s in nasdaq + nyse:
    stype = s.get("type", "")
    if "Stock" not in stype:
        continue
    formatted.append({
        "symbol": s["symbol"],
        "name": s.get("name", s["symbol"]),
        "type": "Stocks",
        "exchange": s.get("exchange", ""),
        "country": s.get("country", "")
    })

for f in forex:
    formatted.append({
        "symbol": f["symbol"],
        "name": f.get("currency_base", "") + " / " + f.get("currency_quote", ""),
        "type": "Forex",
        "exchange": "FX",
        "country": "Global"
    })

for c in crypto:
    q = c.get("currency_quote", "")
    if q not in ("USD", "USDT"):
        continue
    sym = c["symbol"].split("/")[0] if "/" in c["symbol"] else c["symbol"]
    formatted.append({
        "symbol": sym,
        "name": c.get("currency_base", sym),
        "type": "Crypto",
        "exchange": "Crypto",
        "country": "Global"
    })

# Deduplicate
seen = set()
final_db = []
for item in formatted:
    if item["symbol"] not in seen:
        seen.add(item["symbol"])
        final_db.append(item)

# Ensure dir
os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
with open(OUT_PATH, "w") as f:
    json.dump(final_db, f, separators=(',', ':'))

size_kb = os.path.getsize(OUT_PATH) / 1024
print(f"Database built successfully at {OUT_PATH}")
print(f"Total Assets: {len(final_db)} ({size_kb:.2f} KB)")

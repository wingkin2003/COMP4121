#!/usr/bin/env python3
"""
SecondLife — Seed Data Script
==============================
Populates the database with fake products, rentals, buy orders, rental requests,
and mystery box eligible items via the API.

Usage:
    # Backend must be running at http://localhost:8000
    pip install requests
    python seed_data.py

    # Or with custom URL:
    API_BASE=http://localhost:8000 python seed_data.py
"""

import os
import sys
import random
import requests

BASE = os.environ.get("API_BASE", "http://localhost:8000")

# ── Check backend is running ──
try:
    r = requests.get(f"{BASE}/api/health", timeout=5)
    r.raise_for_status()
except Exception:
    print(f"❌ Backend not reachable at {BASE}. Start it first.")
    sys.exit(1)

# ── Register two demo users ──
def register(username, email, password="demo1234"):
    r = requests.post(f"{BASE}/api/auth/register", json={
        "username": username, "email": email, "password": password
    })
    if r.status_code == 200:
        return r.json()["access_token"]
    elif r.status_code == 409:
        # Already exists, login instead
        r2 = requests.post(f"{BASE}/api/auth/login", json={
            "username": username, "password": password
        })
        if r2.status_code == 200:
            return r2.json()["access_token"]
    print(f"  ⚠ Could not register/login {username}: {r.status_code} {r.text[:100]}")
    return None

print("🔑 Setting up demo users...")
token_alice = register("demo_alice", "alice@secondlife.hk")
token_bob = register("demo_bob", "bob@secondlife.hk")

if not token_alice or not token_bob:
    print("❌ Failed to create demo users.")
    sys.exit(1)
print("  ✅ demo_alice & demo_bob ready")

def auth(token):
    return {"Authorization": f"Bearer {token}"}

# ═══════════════════════════════════════════════════════════════
# PRODUCTS (Sell Listings)
# ═══════════════════════════════════════════════════════════════
print("\n📦 Creating sell listings...")

products_data = [
    {
        "title": "MacBook Pro 2024 M3",
        "description": "14-inch, 16GB RAM, 512GB SSD. Barely used, purchased 3 months ago. Comes with original box and charger.",
        "price": 8500,
        "category": "Electronics",
        "condition": "Like New",
        "location": "Mong Kok",
        "seller_name": "Alice",
    },
    {
        "title": "IKEA KALLAX Shelf Unit",
        "description": "White, 4x4 cube shelving unit. Some minor scratches on the side. Self pickup only.",
        "price": 350,
        "category": "Furniture",
        "condition": "Good",
        "location": "Sha Tin",
        "seller_name": "Alice",
    },
    {
        "title": "Nike Air Max 90 (Size 42)",
        "description": "Classic white/black colorway. Worn a few times, still in great shape. Fits true to size.",
        "price": 450,
        "category": "Fashion",
        "condition": "Good",
        "location": "Tsim Sha Tsui",
        "seller_name": "Alice",
    },
    {
        "title": "Harry Potter Complete Box Set",
        "description": "All 7 books, hardcover Bloomsbury edition. Perfect condition, collected but rarely read.",
        "price": 300,
        "category": "Books",
        "condition": "Like New",
        "location": "Central",
        "seller_name": "Alice",
    },
    {
        "title": "Dyson V10 Vacuum Cleaner",
        "description": "Cordless stick vacuum. Battery lasts ~40 mins. All attachments included. Moving so must sell.",
        "price": 1200,
        "category": "Appliances",
        "condition": "Good",
        "location": "Tseung Kwan O",
        "seller_name": "Bob",
    },
    {
        "title": "LEGO Technic Porsche 911 GT3",
        "description": "Fully assembled display model. Includes original box and instructions. Dust-free display case.",
        "price": 800,
        "category": "Toys",
        "condition": "Like New",
        "location": "Causeway Bay",
        "seller_name": "Bob",
    },
    {
        "title": "Wilson Tennis Racket Pro Staff",
        "description": "Roger Federer edition. Grip size 3. Strung at 55lbs. Used for ~6 months of weekend play.",
        "price": 380,
        "category": "Sports",
        "condition": "Good",
        "location": "Happy Valley",
        "seller_name": "Bob",
    },
    {
        "title": "iPad Air 5th Gen + Magic Keyboard",
        "description": "M1 chip, 256GB, Space Gray. Perfect for students. Magic Keyboard included, worth $2,399 alone.",
        "price": 3800,
        "category": "Electronics",
        "condition": "Good",
        "location": "Wan Chai",
        "seller_name": "Bob",
    },
    {
        "title": "Vintage Denim Jacket Levi's",
        "description": "Authentic 1990s Levi's trucker jacket. Size M. Beautiful natural fading. A collector's piece.",
        "price": 550,
        "category": "Fashion",
        "condition": "Fair",
        "location": "Sham Shui Po",
        "seller_name": "Alice",
        "sustainability_tag": "Upcycled",
    },
    {
        "title": "Standing Desk (Electric)",
        "description": "FlexiSpot E7, 140x70cm white top. Height adjustable 60-125cm. Minor cable management clips missing.",
        "price": 1800,
        "category": "Furniture",
        "condition": "Good",
        "location": "Kwun Tong",
        "seller_name": "Bob",
        "sustainability_tag": "Recyclable",
    },
    # Cheap items for mystery box
    {
        "title": "USB-C Hub Adapter",
        "description": "7-in-1 hub. HDMI, USB3, SD card. Works perfectly, just upgraded.",
        "price": 35,
        "category": "Electronics",
        "condition": "Good",
        "location": "Yau Ma Tei",
        "seller_name": "Alice",
    },
    {
        "title": "Cooking Recipe Book Bundle",
        "description": "5 Asian cuisine cookbooks. Some pages have minor stains but all readable.",
        "price": 40,
        "category": "Books",
        "condition": "Fair",
        "location": "North Point",
        "seller_name": "Bob",
    },
]

product_ids = []
mystery_candidates = []

for i, p in enumerate(products_data):
    tok = token_alice if p["seller_name"] == "Alice" else token_bob
    r = requests.post(f"{BASE}/api/products", json=p, headers=auth(tok))
    if r.status_code == 201:
        pid = r.json()["id"]
        product_ids.append(pid)
        if p["price"] <= 50:
            mystery_candidates.append(pid)
        print(f"  ✅ {p['title']}")
    else:
        print(f"  ❌ {p['title']}: {r.status_code}")

# ── Add some likes ──
print("\n❤️  Adding likes...")
for pid in product_ids[:5]:
    requests.post(f"{BASE}/api/products/{pid}/like", headers=auth(token_bob))
for pid in product_ids[4:8]:
    requests.post(f"{BASE}/api/products/{pid}/like", headers=auth(token_alice))
print("  ✅ Likes added")

# ── Move cheap items to mystery box ──
print("\n🎁 Moving items to mystery box pool...")
for pid in mystery_candidates:
    r = requests.post(f"{BASE}/api/products/{pid}/move-to-mystery-box", headers=auth(
        token_alice if random.random() > 0.5 else token_bob
    ))
    # Try both users since we don't know who owns it
    if r.status_code != 200:
        other_tok = token_bob if r.status_code != 200 else token_alice
        r = requests.post(f"{BASE}/api/products/{pid}/move-to-mystery-box", headers=auth(other_tok))
    if r.status_code == 200:
        print(f"  ✅ Moved to mystery box")
    else:
        print(f"  ⚠ Could not move: {r.status_code}")

# ═══════════════════════════════════════════════════════════════
# BUY ORDERS
# ═══════════════════════════════════════════════════════════════
print("\n🛒 Creating buy orders...")

buy_orders_data = [
    {
        "title": "Looking for PS5",
        "description": "Want a PS5 disc edition in good condition. Budget negotiable for mint condition.",
        "budget": 2500,
        "category": "Electronics",
        "condition": "Good",
        "location": "Kowloon Bay",
        "buyer_name": "Bob",
    },
    {
        "title": "Need Office Chair",
        "description": "Ergonomic office chair, preferably Herman Miller or Steelcase. Mesh back preferred.",
        "budget": 1500,
        "category": "Furniture",
        "condition": "Good",
        "location": "Quarry Bay",
        "buyer_name": "Alice",
    },
    {
        "title": "Wanted: Canon Camera Lens",
        "description": "Canon RF 50mm f/1.8 or similar prime lens. Must be in working condition with no fungus.",
        "budget": 800,
        "category": "Electronics",
        "condition": "Like New",
        "location": "Tsim Sha Tsui",
        "buyer_name": "Bob",
    },
    {
        "title": "Kids Bicycle (Age 5-7)",
        "description": "Looking for a used kids bike with training wheels. Any color fine.",
        "budget": 200,
        "category": "Sports",
        "condition": "Fair",
        "location": "Tung Chung",
        "buyer_name": "Alice",
    },
]

for bo in buy_orders_data:
    tok = token_alice if bo["buyer_name"] == "Alice" else token_bob
    r = requests.post(f"{BASE}/api/buy-orders", json=bo, headers=auth(tok))
    if r.status_code == 201:
        print(f"  ✅ {bo['title']}")

        # Add a negotiation from the other user
        other_tok = token_bob if tok == token_alice else token_alice
        other_name = "Bob" if tok == token_alice else "Alice"
        neg = {
            "buy_order_id": r.json()["id"],
            "mode": "negotiate",
            "seller_name": other_name,
            "seller_phone": "9" + str(random.randint(1000000, 9999999)),
            "selling_item_title": f"My {bo['category']} Item",
            "offered_price": round(bo["budget"] * random.uniform(0.7, 0.95)),
            "condition": bo["condition"],
            "meetup_location": bo["location"],
            "note": "I have exactly what you need!",
        }
        requests.post(f"{BASE}/api/buy-orders/negotiations", json=neg, headers=auth(other_tok))
    else:
        print(f"  ❌ {bo['title']}: {r.status_code}")

# ═══════════════════════════════════════════════════════════════
# RENTAL LISTINGS
# ═══════════════════════════════════════════════════════════════
print("\n🏠 Creating rental listings...")

rentals_data = [
    {
        "title": "Canon EOS R6 Camera",
        "description": "Full-frame mirrorless camera. Comes with 24-105mm kit lens, 2 batteries, and bag.",
        "daily_price": 200,
        "deposit": 3000,
        "min_days": 1,
        "max_days": 14,
        "category": "Electronics",
        "condition": "Like New",
        "location": "Central",
        "owner_name": "Alice",
    },
    {
        "title": "DJ Equipment Set",
        "description": "Pioneer DDJ-400 controller + JBL speakers. Perfect for house parties or events.",
        "daily_price": 350,
        "deposit": 2000,
        "min_days": 1,
        "max_days": 7,
        "category": "Electronics",
        "condition": "Good",
        "location": "Lan Kwai Fong",
        "owner_name": "Bob",
    },
    {
        "title": "Camping Tent (4-Person)",
        "description": "North Face 4-person dome tent. Waterproof, easy setup. Great for weekend trips.",
        "daily_price": 80,
        "deposit": 500,
        "min_days": 2,
        "max_days": 10,
        "category": "Sports",
        "condition": "Good",
        "location": "Sai Kung",
        "owner_name": "Alice",
    },
    {
        "title": "Electric Scooter",
        "description": "Xiaomi M365 Pro. 45km range, foldable. Helmet included. Great for commuting.",
        "daily_price": 60,
        "deposit": 800,
        "min_days": 1,
        "max_days": 30,
        "category": "Sports",
        "condition": "Good",
        "location": "Tai Po",
        "owner_name": "Bob",
    },
    {
        "title": "Formal Suit (Size M)",
        "description": "Navy blue Hugo Boss suit. Only worn twice. Comes with matching tie and shirt.",
        "daily_price": 100,
        "deposit": 600,
        "min_days": 1,
        "max_days": 5,
        "category": "Fashion",
        "condition": "Like New",
        "location": "Admiralty",
        "owner_name": "Alice",
    },
]

rental_ids = []
for rl in rentals_data:
    tok = token_alice if rl["owner_name"] == "Alice" else token_bob
    r = requests.post(f"{BASE}/api/rentals", json=rl, headers=auth(tok))
    if r.status_code == 201:
        rental_ids.append(r.json()["id"])
        print(f"  ✅ {rl['title']}")
    else:
        print(f"  ❌ {rl['title']}: {r.status_code}")

# ── Create a rental order (Bob rents from Alice) ──
if rental_ids:
    r = requests.post(f"{BASE}/api/rental-orders", json={
        "rental_id": rental_ids[0],
        "renter_name": "Bob",
        "days": 3,
        "start_date": "2026-04-20",
        "pickup_time": "14:00",
        "phone": "91234567",
        "note": "Will pick up at Central MTR",
    }, headers=auth(token_bob))
    if r.status_code == 201:
        print("  ✅ Rental order created (Bob rents camera)")

# ═══════════════════════════════════════════════════════════════
# RENTAL REQUESTS
# ═══════════════════════════════════════════════════════════════
print("\n📋 Creating rental requests...")

rental_requests_data = [
    {
        "title": "Need Projector for Presentation",
        "description": "HD projector for a 2-day business conference. Must have HDMI input.",
        "daily_budget": 150,
        "min_days": 2,
        "max_days": 3,
        "category": "Electronics",
        "condition": "Good",
        "location": "Kwun Tong",
        "requester_name": "Bob",
    },
    {
        "title": "Looking for Party Speakers",
        "description": "Large bluetooth speakers for outdoor birthday party. Need good bass.",
        "daily_budget": 100,
        "min_days": 1,
        "max_days": 2,
        "category": "Electronics",
        "condition": "Good",
        "location": "Repulse Bay",
        "requester_name": "Alice",
    },
    {
        "title": "Wedding Dress (Size S)",
        "description": "White wedding dress for photo shoot. Size S or adjustable. Date flexible.",
        "daily_budget": 200,
        "min_days": 1,
        "max_days": 3,
        "category": "Fashion",
        "condition": "Like New",
        "location": "The Peak",
        "requester_name": "Bob",
    },
]

rental_req_ids = []
for rr in rental_requests_data:
    tok = token_alice if rr["requester_name"] == "Alice" else token_bob
    r = requests.post(f"{BASE}/api/rental-requests", json=rr, headers=auth(tok))
    if r.status_code == 201:
        rental_req_ids.append(r.json()["id"])
        print(f"  ✅ {rr['title']}")
    else:
        print(f"  ❌ {rr['title']}: {r.status_code}")

# ── Add a lending offer ──
if rental_req_ids:
    r = requests.post(f"{BASE}/api/rental-lendings", json={
        "request_id": rental_req_ids[0],
        "lender_name": "Alice",
        "lender_phone": "98765432",
        "note": "I have an Epson projector available",
        "days": 2,
        "rental_fee": 250,
        "deposit": 500,
        "start_date": "2026-04-25",
        "end_date": "2026-04-27",
        "pickup_time": "09:00",
        "location": "Kwun Tong MTR Exit A",
    }, headers=auth(token_alice))
    if r.status_code == 201:
        print("  ✅ Lending offer created (Alice offers projector)")

# ═══════════════════════════════════════════════════════════════
# COMMENTS
# ═══════════════════════════════════════════════════════════════
print("\n💬 Adding comments...")

if len(product_ids) >= 2:
    # Comment on first product
    c = requests.post(f"{BASE}/api/products/{product_ids[0]}/comments",
                      json={"text": "Is this still available? Can you do $7,500?"}, headers=auth(token_bob))
    if c.status_code == 201:
        cid = c.json()["id"]
        print(f"  ✅ Comment on MacBook Pro")
        # Reply
        requests.post(f"{BASE}/api/products/{product_ids[0]}/comments",
                      json={"text": "Yes still available! Lowest I can go is $8,000.", "parent_id": cid},
                      headers=auth(token_alice))
        print(f"  ✅ Reply added")

    # Comment on another product
    requests.post(f"{BASE}/api/products/{product_ids[4]}/comments",
                  json={"text": "Does the battery still hold full charge?"}, headers=auth(token_alice))
    print(f"  ✅ Comment on Dyson")

# ═══════════════════════════════════════════════════════════════
# CART & ORDER (Bob buys from Alice)
# ═══════════════════════════════════════════════════════════════
print("\n🛍️  Creating cart & order...")

if len(product_ids) >= 4:
    # Bob adds Alice's items to cart and places an order
    pid = product_ids[2]  # Nike Air Max (Alice's)
    requests.post(f"{BASE}/api/cart/items", json={"product_id": pid, "quantity": 1}, headers=auth(token_bob))

    r = requests.post(f"{BASE}/api/orders", json={
        "items": [{"product_id": pid, "quantity": 1}],
        "shipping_address": "Flat 12A, Tower 3, City One, Sha Tin, NT",
    }, headers=auth(token_bob))
    if r.status_code == 201:
        print(f"  ✅ Order placed (Bob bought Nike Air Max)")

# ═══════════════════════════════════════════════════════════════
print(f"\n{'='*50}")
print(f"  ✅ Seed data created successfully!")
print(f"{'='*50}")
print(f"  Demo accounts:")
print(f"    demo_alice / demo1234")
print(f"    demo_bob   / demo1234")
print(f"{'='*50}\n")

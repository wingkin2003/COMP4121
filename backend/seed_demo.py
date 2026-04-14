#!/usr/bin/env python3
"""
SecondLife — Demo Account & Bulk Fake Data Seed Script
======================================================
Creates:
  • 1 demo account  (demo / demo1234)
  • ~20 products listed by demo  (6 with created_at > 14 days ago → mystery-box eligible)
  • ~30 extra products by other fake sellers
  • Buy requests by demo + others
  • Rental listings by demo + others
  • Rental requests by demo + others
  • Mystery box products already in the pool
  • Comments, likes, orders, rental orders

Usage:
    python seed_demo.py          # backend must be at http://localhost:8000
"""

import os, sys, random, string, requests
from datetime import datetime, timezone, timedelta
from uuid import uuid4

BASE = os.environ.get("API_BASE", "http://localhost:8000")

# ── Check backend ──
try:
    requests.get(f"{BASE}/api/health", timeout=5).raise_for_status()
except Exception:
    print(f"❌ Backend not reachable at {BASE}"); sys.exit(1)

# ═══════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════
def register(username, email, password="demo1234"):
    r = requests.post(f"{BASE}/api/auth/register", json={
        "username": username, "email": email, "password": password})
    if r.status_code == 200:
        return r.json()["access_token"]
    if r.status_code == 409:
        r2 = requests.post(f"{BASE}/api/auth/login", json={
            "username": username, "password": password})
        if r2.status_code == 200:
            return r2.json()["access_token"]
    print(f"  ⚠ {username}: {r.status_code} {r.text[:80]}")
    return None

def auth(token):
    return {"Authorization": f"Bearer {token}"}

def post(path, json, token):
    return requests.post(f"{BASE}{path}", json=json, headers=auth(token))

def patch(path, json, token):
    return requests.patch(f"{BASE}{path}", json=json, headers=auth(token))

# ═══════════════════════════════════════════════════════
# Users
# ═══════════════════════════════════════════════════════
print("🔑 Setting up accounts...")
token_demo = register("demo_user", "demo@secondlife.hk")
token_seller1 = register("hk_seller_anna", "anna@secondlife.hk")
token_seller2 = register("hk_seller_ken", "ken@secondlife.hk")
token_buyer1  = register("hk_buyer_may", "may@secondlife.hk")
token_buyer2  = register("hk_buyer_tom", "tom@secondlife.hk")

tokens = {
    "demo_user": token_demo,
    "hk_seller_anna": token_seller1,
    "hk_seller_ken": token_seller2,
    "hk_buyer_may": token_buyer1,
    "hk_buyer_tom": token_buyer2,
}
for name, tok in tokens.items():
    if not tok:
        print(f"❌ Failed to set up {name}"); sys.exit(1)
print("  ✅ All accounts ready")

HK_LOCATIONS = [
    "Mong Kok", "Tsim Sha Tsui", "Causeway Bay", "Central", "Wan Chai",
    "Sha Tin", "Tai Po", "Tseung Kwan O", "Kwun Tong", "Sham Shui Po",
    "North Point", "Yau Ma Tei", "Admiralty", "Lai Chi Kok", "Quarry Bay",
    "Happy Valley", "Tung Chung", "Sai Kung", "Ma On Shan", "Sheung Wan",
]

# ═══════════════════════════════════════════════════════
# PRODUCTS — demo account (20 items, 6 old)
# ═══════════════════════════════════════════════════════
print("\n📦 Creating demo's products...")

demo_products = [
    # ── Recent products (normal listing) ──
    {"title": "Sony WH-1000XM5 Headphones", "description": "Noise-cancelling, barely used. Comes with case and cable.", "price": 1800, "category": "Electronics", "condition": "Like New", "seller_name": "Demo"},
    {"title": "Herman Miller Aeron Chair", "description": "Size B, fully loaded. Bought 6 months ago. Perfect for WFH.", "price": 4500, "category": "Furniture", "condition": "Good", "seller_name": "Demo"},
    {"title": "Uniqlo Down Jacket (M)", "description": "Ultra-light down jacket, navy blue. Men's medium. Worn twice.", "price": 250, "category": "Fashion", "condition": "Like New", "seller_name": "Demo"},
    {"title": "Nintendo Switch OLED", "description": "White model with Pro Controller and 3 games (Zelda, Mario, Splatoon).", "price": 2200, "category": "Electronics", "condition": "Good", "seller_name": "Demo"},
    {"title": "Xiaomi Air Purifier 4", "description": "HEPA filter, smart app control. Filter replaced 2 months ago.", "price": 450, "category": "Appliances", "condition": "Good", "seller_name": "Demo"},
    {"title": "Fjallraven Kanken Backpack", "description": "Classic 16L, forest green. Minor stain on bottom, otherwise perfect.", "price": 350, "category": "Fashion", "condition": "Good", "seller_name": "Demo"},
    {"title": "MUJI Desk Lamp", "description": "LED desk lamp with USB charging port. Adjustable brightness.", "price": 180, "category": "Furniture", "condition": "Like New", "seller_name": "Demo"},
    {"title": "Vitamix Blender E310", "description": "Professional grade blender. Makes smoothies, soups, everything.", "price": 1600, "category": "Appliances", "condition": "Good", "seller_name": "Demo"},
    {"title": "Adidas Ultraboost 22 (US10)", "description": "Core black colorway. Only worn to gym ~10 times.", "price": 380, "category": "Fashion", "condition": "Good", "seller_name": "Demo"},
    {"title": "Japanese Manga Collection", "description": "One Piece vol 1-30, Japanese edition. Good condition.", "price": 400, "category": "Books", "condition": "Good", "seller_name": "Demo"},
    {"title": "DJI Mini 3 Pro Drone", "description": "With Fly More combo. Under 249g. 4K video. Rarely flown.", "price": 4200, "category": "Electronics", "condition": "Like New", "seller_name": "Demo"},
    {"title": "Yoga Mat + Blocks Set", "description": "Manduka PRO mat (5mm) + 2 cork blocks. Used for 3 months.", "price": 280, "category": "Sports", "condition": "Good", "seller_name": "Demo"},
    {"title": "Le Creuset Dutch Oven 26cm", "description": "Flame orange, cast iron. A few minor chips on enamel edge.", "price": 800, "category": "Appliances", "condition": "Fair", "seller_name": "Demo", "sustainability_tag": "Recyclable"},
    {"title": "Kindle Paperwhite 2024", "description": "6.8\" display, 16GB, ad-free. Includes leather cover.", "price": 700, "category": "Electronics", "condition": "Like New", "seller_name": "Demo"},
    # ── OLD products (14+ days) — mystery box eligible ──
    {"title": "USB-C Charging Cable 3-Pack", "description": "Braided nylon, 1m each. One slightly frayed at tip.", "price": 25, "category": "Electronics", "condition": "Fair", "seller_name": "Demo", "_old": True},
    {"title": "Pocket Notebook Set", "description": "5x Moleskine-style pocket notebooks. Plain pages.", "price": 30, "category": "Books", "condition": "Good", "seller_name": "Demo", "_old": True},
    {"title": "Phone Stand Holder", "description": "Adjustable aluminum phone/tablet stand. Fits up to 12\".", "price": 35, "category": "Electronics", "condition": "Good", "seller_name": "Demo", "_old": True},
    {"title": "Cotton Tote Bag Bundle", "description": "4 canvas tote bags, various prints. Great for shopping.", "price": 20, "category": "Fashion", "condition": "Good", "seller_name": "Demo", "_old": True, "sustainability_tag": "Upcycled"},
    {"title": "Wireless Mouse (Logitech)", "description": "Logitech M185. Works fine, just upgraded.", "price": 40, "category": "Electronics", "condition": "Good", "seller_name": "Demo", "_old": True},
    {"title": "Resistance Bands Set", "description": "5 bands with handles + door anchor. Light to extra heavy.", "price": 45, "category": "Sports", "condition": "Good", "seller_name": "Demo", "_old": True},
]

demo_product_ids = []
demo_old_product_ids = []

for p in demo_products:
    is_old = p.pop("_old", False)
    p["location"] = random.choice(HK_LOCATIONS)
    r = post("/api/products", p, token_demo)
    if r.status_code == 201:
        pid = r.json()["id"]
        demo_product_ids.append(pid)
        if is_old:
            demo_old_product_ids.append(pid)
        print(f"  ✅ {p['title']}" + (" (old)" if is_old else ""))
    else:
        print(f"  ❌ {p['title']}: {r.status_code}")

# ── Back-date old products directly via DB ──
print("\n⏪ Back-dating old products for mystery box eligibility...")
import pymongo
MONGO_URI = os.environ.get("MONGO_URI", "mongodb+srv://admin:password123987@comp4121.rv6xhbd.mongodb.net/secondlife")
client = pymongo.MongoClient(MONGO_URI)
db = client["secondlife"]
old_date = (datetime.now(timezone.utc) - timedelta(days=20)).isoformat()
for pid in demo_old_product_ids:
    db.products.update_one({"_id": pid}, {"$set": {"created_at": old_date}})
    print(f"  ✅ {pid} → 20 days ago")

# ═══════════════════════════════════════════════════════
# PRODUCTS — other sellers (30 items for marketplace variety)
# ═══════════════════════════════════════════════════════
print("\n📦 Creating other sellers' products...")

other_products = [
    # Anna's products
    {"title": "MacBook Air M2", "description": "13\" Midnight, 8GB/256GB. Has AppleCare until 2027.", "price": 6500, "category": "Electronics", "condition": "Like New", "seller_name": "Anna", "owner": "hk_seller_anna"},
    {"title": "IKEA MALM Desk", "description": "White 140x65cm desk. Some scratches. Self pickup.", "price": 300, "category": "Furniture", "condition": "Good", "seller_name": "Anna", "owner": "hk_seller_anna"},
    {"title": "Zara Leather Boots (EU38)", "description": "Black ankle boots, worn one season. Still look great.", "price": 280, "category": "Fashion", "condition": "Good", "seller_name": "Anna", "owner": "hk_seller_anna"},
    {"title": "Board Game Collection", "description": "Settlers of Catan + Ticket to Ride + Codenames. All complete.", "price": 350, "category": "Toys", "condition": "Good", "seller_name": "Anna", "owner": "hk_seller_anna"},
    {"title": "Nespresso Vertuo Plus", "description": "Coffee machine with milk frother. 20 free capsules included.", "price": 550, "category": "Appliances", "condition": "Good", "seller_name": "Anna", "owner": "hk_seller_anna"},
    {"title": "Samsung Galaxy S24", "description": "128GB Phantom Black. Screen protector + case from day one.", "price": 3200, "category": "Electronics", "condition": "Like New", "seller_name": "Anna", "owner": "hk_seller_anna"},
    {"title": "Acoustic Guitar (Yamaha F310)", "description": "Beginner guitar. Comes with soft case, tuner, picks.", "price": 600, "category": "Other", "condition": "Good", "seller_name": "Anna", "owner": "hk_seller_anna"},
    {"title": "Mini Fridge", "description": "45L compact fridge. Perfect for dorm or office. Quiet operation.", "price": 380, "category": "Appliances", "condition": "Good", "seller_name": "Anna", "owner": "hk_seller_anna"},
    {"title": "Converse Chuck 70 High (US8)", "description": "Parchment colourway. Classic pair, barely worn.", "price": 320, "category": "Fashion", "condition": "Like New", "seller_name": "Anna", "owner": "hk_seller_anna"},
    {"title": "Japanese Tea Set", "description": "Handmade ceramic set: teapot + 4 cups. Beautiful glaze.", "price": 180, "category": "Other", "condition": "Like New", "seller_name": "Anna", "owner": "hk_seller_anna", "sustainability_tag": "Handmade"},
    # Some old cheap items from Anna for mystery box
    {"title": "Pencil Case Bundle", "description": "3 pencil cases, various colors. Canvas material.", "price": 15, "category": "Other", "condition": "Good", "seller_name": "Anna", "owner": "hk_seller_anna", "_old": True},
    {"title": "USB Flash Drive 32GB", "description": "SanDisk Cruzer. Works perfectly.", "price": 20, "category": "Electronics", "condition": "Good", "seller_name": "Anna", "owner": "hk_seller_anna", "_old": True},
    {"title": "Bookmark Collection", "description": "10 handmade leather bookmarks. Nice gift.", "price": 30, "category": "Books", "condition": "Like New", "seller_name": "Anna", "owner": "hk_seller_anna", "_old": True},
    # Ken's products
    {"title": "PlayStation 5 Disc Edition", "description": "With 2 controllers + Spider-Man 2. Perfect condition.", "price": 3000, "category": "Electronics", "condition": "Like New", "seller_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "LEGO Star Wars AT-AT", "description": "75313 UCS model. Fully built, display only. Original box.", "price": 3500, "category": "Toys", "condition": "Like New", "seller_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "Road Bicycle (Giant Defy)", "description": "Size M, 10-speed. Well maintained, new tires. Great commuter.", "price": 2800, "category": "Sports", "condition": "Good", "seller_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "Dyson Pure Cool Fan", "description": "TP04 air purifier + fan. HEPA filter 6 months old.", "price": 1500, "category": "Appliances", "condition": "Good", "seller_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "North Face Puffer Jacket (L)", "description": "700-fill goose down. Excellent warmth. Some minor pilling.", "price": 650, "category": "Fashion", "condition": "Good", "seller_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "Tom Ford Sunglasses", "description": "FT0248 Henry. Comes with case and cloth. Minor scratches.", "price": 800, "category": "Fashion", "condition": "Good", "seller_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "Secretlab Titan Chair", "description": "2022 edition, Stealth fabric. Lumbar support pillow included.", "price": 2200, "category": "Furniture", "condition": "Good", "seller_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "AirPods Pro 2 (USB-C)", "description": "With MagSafe case. Silicone tips (all sizes). Battery 92%.", "price": 900, "category": "Electronics", "condition": "Good", "seller_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "Japanese Whisky Set", "description": "Suntory Toki + 2 crystal glasses. Gift set, never opened.", "price": 450, "category": "Other", "condition": "Like New", "seller_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "Camping Sleeping Bag", "description": "Rated to 5°C. Mummy style. Compact when packed.", "price": 200, "category": "Sports", "condition": "Good", "seller_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "Python Programming Book", "description": "Fluent Python, 2nd ed. Highlight marks on some pages.", "price": 120, "category": "Books", "condition": "Fair", "seller_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "Standing Desk Converter", "description": "Sits on your existing desk. Adjustable height. Missing one screw.", "price": 500, "category": "Furniture", "condition": "Fair", "seller_name": "Ken", "owner": "hk_seller_ken", "sustainability_tag": "Recyclable"},
    # Some old cheap items from Ken for mystery box
    {"title": "Earphone Pouch", "description": "Small leather pouch for earphones/coins.", "price": 10, "category": "Fashion", "condition": "Fair", "seller_name": "Ken", "owner": "hk_seller_ken", "_old": True},
    {"title": "Sticky Notes Mega Pack", "description": "12 pads, assorted colors. Post-it brand.", "price": 25, "category": "Other", "condition": "Good", "seller_name": "Ken", "owner": "hk_seller_ken", "_old": True},
    {"title": "Mini Screwdriver Set", "description": "Precision screwdriver set for electronics repair.", "price": 35, "category": "Electronics", "condition": "Good", "seller_name": "Ken", "owner": "hk_seller_ken", "_old": True},
]

other_product_ids = []
other_old_ids = []

for p in other_products:
    is_old = p.pop("_old", False)
    owner = p.pop("owner")
    p["location"] = random.choice(HK_LOCATIONS)
    r = post("/api/products", p, tokens[owner])
    if r.status_code == 201:
        pid = r.json()["id"]
        other_product_ids.append(pid)
        if is_old:
            other_old_ids.append(pid)
        print(f"  ✅ {p['title']}" + (" (old)" if is_old else ""))
    else:
        print(f"  ❌ {p['title']}: {r.status_code}")

# Back-date other old products
for pid in other_old_ids:
    days_ago = random.randint(15, 30)
    old_d = (datetime.now(timezone.utc) - timedelta(days=days_ago)).isoformat()
    db.products.update_one({"_id": pid}, {"$set": {"created_at": old_d}})
print(f"  ✅ Back-dated {len(other_old_ids)} items")

# ═══════════════════════════════════════════════════════
# Mystery Box — move old cheap items into pool
# ═══════════════════════════════════════════════════════
print("\n🎁 Moving old items into mystery box pool...")

# Move demo's old items
for pid in demo_old_product_ids:
    r = post(f"/api/products/{pid}/move-to-mystery-box", {}, token_demo)
    if r.status_code == 200:
        print(f"  ✅ Moved (demo)")
    else:
        print(f"  ⚠ {pid}: {r.status_code} {r.text[:60]}")

# Move other sellers' old items
for pid in other_old_ids:
    # Determine whose token to use
    doc = db.products.find_one({"_id": pid})
    if doc:
        owner_tok = tokens.get(doc["seller_account"])
        if owner_tok:
            r = post(f"/api/products/{pid}/move-to-mystery-box", {}, owner_tok)
            if r.status_code == 200:
                print(f"  ✅ Moved ({doc['seller_account']})")
            else:
                print(f"  ⚠ {pid}: {r.status_code}")

# ═══════════════════════════════════════════════════════
# Likes & Comments
# ═══════════════════════════════════════════════════════
print("\n❤️  Adding likes...")
all_active_products = demo_product_ids + other_product_ids
for pid in all_active_products:
    # Random users like random items
    for t in random.sample(list(tokens.values()), random.randint(1, 3)):
        requests.post(f"{BASE}/api/products/{pid}/like", headers=auth(t))
print(f"  ✅ Likes added to {len(all_active_products)} products")

print("\n💬 Adding comments...")
comment_texts = [
    "Is this still available?",
    "Can you do a lower price?",
    "What's the condition of the battery?",
    "Can I see more photos?",
    "Where can we meet for pickup?",
    "Interested! Sending you a message.",
    "Is the price negotiable?",
    "Does it come with the original box?",
    "How old is this item?",
    "Great price! I'll take it.",
]
reply_texts = [
    "Yes, still available!",
    "Sorry, price is firm.",
    "Battery is at 95% health.",
    "Sure, I'll upload more photos soon.",
    "I'm near Mong Kok MTR, can meet there.",
    "Thanks for your interest!",
    "I can do HK$50 off for quick deal.",
    "Yes, original box and accessories included.",
    "Bought it about 6 months ago.",
    "Great, let's arrange the meetup!",
]

comment_count = 0
for pid in random.sample(all_active_products, min(15, len(all_active_products))):
    commenter = random.choice([t for t in tokens.values()])
    c = requests.post(f"{BASE}/api/products/{pid}/comments",
                      json={"text": random.choice(comment_texts)}, headers=auth(commenter))
    if c.status_code == 201:
        comment_count += 1
        # 50% chance of reply
        if random.random() > 0.5:
            replier = random.choice([t for t in tokens.values()])
            requests.post(f"{BASE}/api/products/{pid}/comments",
                          json={"text": random.choice(reply_texts), "parent_id": c.json()["id"]},
                          headers=auth(replier))
            comment_count += 1
print(f"  ✅ {comment_count} comments added")

# ═══════════════════════════════════════════════════════
# BUY REQUESTS — by demo and others
# ═══════════════════════════════════════════════════════
print("\n🛒 Creating buy requests...")

buy_requests = [
    # Demo's buy requests
    {"title": "Looking for AirPods Max", "description": "Silver or Space Gray. Must be in good condition with case.", "budget": 2000, "category": "Electronics", "condition": "Good", "buyer_name": "Demo", "owner": "demo_user"},
    {"title": "Wanted: Standing Desk", "description": "Electric sit-stand desk, at least 120cm wide. White preferred.", "budget": 1500, "category": "Furniture", "condition": "Good", "buyer_name": "Demo", "owner": "demo_user"},
    {"title": "Need Winter Jacket (M)", "description": "Down jacket or puffer, men's medium. Dark colours preferred.", "budget": 400, "category": "Fashion", "condition": "Good", "buyer_name": "Demo", "owner": "demo_user"},
    # Others' buy requests
    {"title": "Want to Buy iPad Pro", "description": "11\" M2 or newer. WiFi only is fine. 128GB+.", "budget": 4000, "category": "Electronics", "condition": "Like New", "buyer_name": "May", "owner": "hk_buyer_may"},
    {"title": "Seeking Baby Stroller", "description": "Lightweight foldable stroller. Safety certified.", "budget": 800, "category": "Other", "condition": "Good", "buyer_name": "May", "owner": "hk_buyer_may"},
    {"title": "ISO: Mechanical Keyboard", "description": "TKL or 65% layout. Cherry MX Brown or equivalent.", "budget": 500, "category": "Electronics", "condition": "Good", "buyer_name": "Tom", "owner": "hk_buyer_tom"},
    {"title": "Looking for Yoga Mat", "description": "Premium mat, at least 5mm thick. Non-slip.", "budget": 200, "category": "Sports", "condition": "Good", "buyer_name": "Tom", "owner": "hk_buyer_tom"},
    {"title": "Wanted: DSLR Camera", "description": "Canon or Nikon body with kit lens. Budget flexible for good condition.", "budget": 3000, "category": "Electronics", "condition": "Good", "buyer_name": "May", "owner": "hk_buyer_may"},
    {"title": "Need Bookshelf", "description": "Wooden bookshelf, 5 tiers. Not too heavy. Must fit in taxi.", "budget": 350, "category": "Furniture", "condition": "Good", "buyer_name": "Tom", "owner": "hk_buyer_tom"},
    {"title": "Looking for Nintendo Games", "description": "Switch games: Animal Crossing, Pokemon, Kirby.", "budget": 150, "category": "Electronics", "condition": "Good", "buyer_name": "May", "owner": "hk_buyer_may"},
]

buy_order_ids = []
for bo in buy_requests:
    owner = bo.pop("owner")
    bo["location"] = random.choice(HK_LOCATIONS)
    r = post("/api/buy-orders", bo, tokens[owner])
    if r.status_code == 201:
        boid = r.json()["id"]
        buy_order_ids.append((boid, owner))
        print(f"  ✅ {bo['title']}")

        # Add a negotiation from another user
        other_users = [k for k in tokens if k != owner]
        negotiator = random.choice(other_users)
        neg = {
            "buy_order_id": boid,
            "mode": "negotiate",
            "seller_name": negotiator.replace("hk_seller_", "").replace("hk_buyer_", "").title(),
            "seller_phone": "9" + str(random.randint(1000000, 9999999)),
            "selling_item_title": f"My {bo['category']} Item",
            "offered_price": round(bo["budget"] * random.uniform(0.6, 0.95)),
            "condition": bo["condition"],
            "meetup_location": bo["location"],
            "note": "I have what you're looking for!",
        }
        post("/api/buy-orders/negotiations", neg, tokens[negotiator])
    else:
        print(f"  ❌ {bo['title']}: {r.status_code}")

# ═══════════════════════════════════════════════════════
# RENTAL LISTINGS — by demo and others
# ═══════════════════════════════════════════════════════
print("\n🏠 Creating rental listings...")

rental_listings = [
    # Demo's rentals
    {"title": "Sony A7III Camera Kit", "description": "Full-frame camera + 28-70mm lens + 50mm f1.8. 2 batteries.", "daily_price": 250, "deposit": 3000, "min_days": 1, "max_days": 14, "category": "Electronics", "condition": "Like New", "location": "Central", "owner_name": "Demo", "owner": "demo_user"},
    {"title": "Portable Projector (Epson)", "description": "1080p projector + screen. Great for movie nights or presentations.", "daily_price": 120, "deposit": 1000, "min_days": 1, "max_days": 7, "category": "Electronics", "condition": "Good", "location": "Mong Kok", "owner_name": "Demo", "owner": "demo_user"},
    {"title": "BBQ Grill Set", "description": "Weber portable grill + utensils + charcoal starter.", "daily_price": 80, "deposit": 400, "min_days": 1, "max_days": 5, "category": "Appliances", "condition": "Good", "location": "Sai Kung", "owner_name": "Demo", "owner": "demo_user"},
    {"title": "Board Game Party Pack", "description": "10 party games incl. Codenames, Avalon, Werewolf, etc.", "daily_price": 50, "deposit": 200, "min_days": 1, "max_days": 7, "category": "Toys", "condition": "Good", "location": "Sha Tin", "owner_name": "Demo", "owner": "demo_user"},
    # Others' rentals
    {"title": "Canon EOS R5 + RF 24-70mm", "description": "Pro-grade camera setup. Great for events and photography.", "daily_price": 350, "deposit": 5000, "min_days": 1, "max_days": 7, "category": "Electronics", "condition": "Like New", "location": "Admiralty", "owner_name": "Anna", "owner": "hk_seller_anna"},
    {"title": "Camping Full Kit", "description": "4-person tent + sleeping bags x4 + cooking set + lanterns.", "daily_price": 150, "deposit": 1200, "min_days": 2, "max_days": 10, "category": "Sports", "condition": "Good", "location": "Tai Po", "owner_name": "Anna", "owner": "hk_seller_anna"},
    {"title": "DJ Controller + Speakers", "description": "Pioneer DDJ-800 + 2x JBL PartyBox 300. Party ready!", "daily_price": 400, "deposit": 3000, "min_days": 1, "max_days": 5, "category": "Electronics", "condition": "Good", "location": "Causeway Bay", "owner_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "Electric Bike", "description": "Foldable e-bike, 50km range. Helmet + lock included.", "daily_price": 100, "deposit": 1500, "min_days": 1, "max_days": 14, "category": "Sports", "condition": "Good", "location": "Tseung Kwan O", "owner_name": "Ken", "owner": "hk_seller_ken"},
    {"title": "Wedding Suit (Size M)", "description": "Hugo Boss 3-piece navy suit. Comes with tie + shirt + cufflinks.", "daily_price": 150, "deposit": 800, "min_days": 1, "max_days": 5, "category": "Fashion", "condition": "Like New", "location": "Tsim Sha Tsui", "owner_name": "Anna", "owner": "hk_seller_anna"},
    {"title": "VR Headset (Quest 3)", "description": "Meta Quest 3, 128GB. Controllers + charging dock + elite strap.", "daily_price": 120, "deposit": 2000, "min_days": 1, "max_days": 7, "category": "Electronics", "condition": "Like New", "location": "Kwun Tong", "owner_name": "Ken", "owner": "hk_seller_ken"},
]

rental_ids = []
demo_rental_ids = []
for rl in rental_listings:
    owner = rl.pop("owner")
    r = post("/api/rentals", rl, tokens[owner])
    if r.status_code == 201:
        rid = r.json()["id"]
        rental_ids.append((rid, owner))
        if owner == "demo_user":
            demo_rental_ids.append(rid)
        print(f"  ✅ {rl['title']}")
    else:
        print(f"  ❌ {rl['title']}: {r.status_code}")

# ── Create rental orders (others rent demo's items, demo rents from others) ──
print("\n📋 Creating rental orders...")

if demo_rental_ids:
    # May rents demo's camera
    r = post("/api/rental-orders", {
        "rental_id": demo_rental_ids[0],
        "renter_name": "May", "days": 3,
        "start_date": "2026-04-20", "pickup_time": "10:00",
        "phone": "91234567", "note": "Will pick up at Central MTR",
    }, token_buyer1)
    if r.status_code == 201:
        print("  ✅ May rents Demo's camera")

# Demo rents Canon R5 from Anna
other_rental_ids = [rid for rid, owner in rental_ids if owner != "demo"]
if other_rental_ids:
    r = post("/api/rental-orders", {
        "rental_id": other_rental_ids[0],
        "renter_name": "Demo", "days": 2,
        "start_date": "2026-04-22", "pickup_time": "14:00",
        "phone": "98765432", "note": "For a photo shoot",
    }, token_demo)
    if r.status_code == 201:
        print("  ✅ Demo rents Canon R5 from Anna")

# ═══════════════════════════════════════════════════════
# RENTAL REQUESTS — by demo and others
# ═══════════════════════════════════════════════════════
print("\n📋 Creating rental requests...")

rental_reqs = [
    {"title": "Need Projector for Meeting", "description": "HD projector for 2-day business meeting. HDMI required.", "daily_budget": 150, "min_days": 2, "max_days": 3, "category": "Electronics", "condition": "Good", "location": "Kwun Tong", "requester_name": "Demo", "owner": "demo_user"},
    {"title": "Looking for Surfboard", "description": "Beginner surfboard for weekend trip to Shek O.", "daily_budget": 80, "min_days": 2, "max_days": 3, "category": "Sports", "condition": "Good", "location": "Shek O", "requester_name": "Demo", "owner": "demo_user"},
    {"title": "Need Power Tools for DIY", "description": "Drill, circular saw for home renovation project.", "daily_budget": 100, "min_days": 3, "max_days": 7, "category": "Other", "condition": "Good", "location": "Sha Tin", "requester_name": "May", "owner": "hk_buyer_may"},
    {"title": "Party Decorations Kit", "description": "Balloon arches, banners, photo booth props for birthday party.", "daily_budget": 60, "min_days": 1, "max_days": 2, "category": "Other", "condition": "Good", "location": "Causeway Bay", "requester_name": "Tom", "owner": "hk_buyer_tom"},
    {"title": "Karaoke Machine", "description": "Karaoke speaker with wireless mics for gathering.", "daily_budget": 120, "min_days": 1, "max_days": 2, "category": "Electronics", "condition": "Good", "location": "Mong Kok", "requester_name": "May", "owner": "hk_buyer_may"},
]

rental_req_ids = []
for rr in rental_reqs:
    owner = rr.pop("owner")
    r = post("/api/rental-requests", rr, tokens[owner])
    if r.status_code == 201:
        rrid = r.json()["id"]
        rental_req_ids.append((rrid, owner))
        print(f"  ✅ {rr['title']}")

        # Add a lending offer from someone else
        other_users = [k for k in tokens if k != owner and "seller" in k]
        if other_users:
            lender = random.choice(other_users)
            lender_name = lender.replace("hk_seller_", "").title()
            post("/api/rental-lendings", {
                "request_id": rrid,
                "lender_name": lender_name,
                "lender_phone": "9" + str(random.randint(1000000, 9999999)),
                "note": f"I have what you need! Can deliver to {rr['location']}.",
                "days": rr["min_days"],
                "rental_fee": rr["daily_budget"] * rr["min_days"],
                "deposit": rr["daily_budget"] * 3,
                "start_date": "2026-04-25",
                "end_date": f"2026-04-{25 + rr['min_days']:02d}",
                "pickup_time": "10:00",
                "location": rr["location"],
            }, tokens[lender])
    else:
        print(f"  ❌ {rr['title']}: {r.status_code}")

# ═══════════════════════════════════════════════════════
# PRODUCT ORDERS (demo buys something)
# ═══════════════════════════════════════════════════════
print("\n🛍️  Creating product orders...")

# Demo buys from Anna
if other_product_ids:
    buy_pid = other_product_ids[0]  # MacBook Air M2
    requests.post(f"{BASE}/api/cart/items", json={"product_id": buy_pid, "quantity": 1}, headers=auth(token_demo))
    r = post("/api/orders", {
        "items": [{"product_id": buy_pid, "quantity": 1}],
        "shipping_address": "Flat 5B, Tower 2, City One, Sha Tin, NT",
    }, token_demo)
    if r.status_code == 201:
        print("  ✅ Demo bought MacBook Air M2")

# Tom buys from Demo
if demo_product_ids:
    buy_pid = demo_product_ids[3]  # Nintendo Switch
    requests.post(f"{BASE}/api/cart/items", json={"product_id": buy_pid, "quantity": 1}, headers=auth(token_buyer2))
    r = post("/api/orders", {
        "items": [{"product_id": buy_pid, "quantity": 1}],
        "shipping_address": "Unit 8, 15/F, Kornhill, Quarry Bay",
    }, token_buyer2)
    if r.status_code == 201:
        print("  ✅ Tom bought Nintendo Switch from Demo")

# ═══════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════
print(f"\n{'='*55}")
print(f"  ✅ Demo seed data created successfully!")
print(f"{'='*55}")
print(f"  Demo account:  demo_user / demo1234")
print(f"  Other accounts:")
print(f"    hk_seller_anna / demo1234")
print(f"    hk_seller_ken  / demo1234")
print(f"    hk_buyer_may   / demo1234")
print(f"    hk_buyer_tom   / demo1234")
print(f"{'='*55}")
print(f"  Demo has:")
print(f"    • {len(demo_product_ids)} products listed ({len(demo_old_product_ids)} moved to mystery box)")
print(f"    • 3 buy requests")
print(f"    • {len(demo_rental_ids)} rental listings")
print(f"    • 2 rental requests")
print(f"    • 1 rental order (renting from Anna)")
print(f"    • 1 product order (bought from Anna)")
print(f"{'='*55}")
print(f"  Marketplace totals:")
print(f"    • {len(demo_product_ids) + len(other_product_ids)} products")
print(f"    • {len(rental_ids)} rental listings")
print(f"    • {len(buy_requests)} buy requests")
print(f"    • {len(rental_reqs)} rental requests")
print(f"    • {len(demo_old_product_ids) + len(other_old_ids)} mystery box items")
print(f"{'='*55}\n")

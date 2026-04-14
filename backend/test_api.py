#!/usr/bin/env python3
"""
SecondLife API — Comprehensive Test Script
===========================================
Tests all 37+ endpoints against a running backend at http://localhost:8000.

Usage:
    # Start the backend first:
    cd backend && docker-compose up --build

    # Then run this script (outside Docker):
    pip install requests
    python test_api.py

    # Or with a custom base URL:
    API_BASE=http://your-server:8000 python test_api.py
"""

import os
import sys
import json
import time
import random
import string
import requests

BASE = os.environ.get("API_BASE", "http://localhost:8000")
PASS = 0
FAIL = 0
ERRORS = []

# ─── Helpers ────────────────────────────────────────────────────────────────

def rand_str(n=8):
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=n))

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def test(name, method, path, *, token=None, json_body=None, expected_status=200, data=None, files=None):
    global PASS, FAIL
    url = f"{BASE}{path}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        if method == "GET":
            r = requests.get(url, headers=headers, timeout=10)
        elif method == "POST":
            if files:
                r = requests.post(url, headers=headers, data=data, files=files, timeout=10)
            else:
                r = requests.post(url, headers=headers, json=json_body, timeout=10)
        elif method == "PATCH":
            r = requests.patch(url, headers=headers, json=json_body, timeout=10)
        elif method == "DELETE":
            r = requests.delete(url, headers=headers, timeout=10)
        else:
            raise ValueError(f"Unknown method: {method}")

        status_ok = r.status_code == expected_status
        if status_ok:
            PASS += 1
            print(f"  ✅ {name} — {r.status_code}")
        else:
            FAIL += 1
            detail = ""
            try:
                detail = r.json().get("detail", r.text[:120])
            except Exception:
                detail = r.text[:120]
            msg = f"  ❌ {name} — got {r.status_code}, expected {expected_status} | {detail}"
            print(msg)
            ERRORS.append(msg)

        try:
            return r.json()
        except Exception:
            return r.text

    except requests.exceptions.ConnectionError:
        FAIL += 1
        msg = f"  ❌ {name} — Connection refused (is the backend running at {BASE}?)"
        print(msg)
        ERRORS.append(msg)
        return None
    except Exception as e:
        FAIL += 1
        msg = f"  ❌ {name} — Exception: {e}"
        print(msg)
        ERRORS.append(msg)
        return None

# ═══════════════════════════════════════════════════════════════════════════
#  0. Health Check
# ═══════════════════════════════════════════════════════════════════════════

section("0. Health Check")
health = test("Health endpoint", "GET", "/api/health")
if health is None:
    print("\n⛔ Backend is not reachable. Please start it first:")
    print("   cd backend && docker-compose up --build\n")
    sys.exit(1)

# ═══════════════════════════════════════════════════════════════════════════
#  1. Auth
# ═══════════════════════════════════════════════════════════════════════════

section("1. Auth")

# --- Register two users ---
user_a = f"testuser_{rand_str()}"
user_b = f"testuser_{rand_str()}"
email_a = f"{user_a}@test.com"
email_b = f"{user_b}@test.com"
password = "testpass123"

reg_a = test("Register User A", "POST", "/api/auth/register", json_body={
    "username": user_a, "email": email_a, "password": password
})
token_a = reg_a.get("access_token", "") if reg_a else ""

reg_b = test("Register User B", "POST", "/api/auth/register", json_body={
    "username": user_b, "email": email_b, "password": password
})
token_b = reg_b.get("access_token", "") if reg_b else ""

# --- Login ---
login = test("Login User A", "POST", "/api/auth/login", json_body={
    "username": user_a, "password": password
})
if login and login.get("access_token"):
    token_a = login["access_token"]

# --- Get profile ---
test("Get profile (me)", "GET", "/api/auth/me", token=token_a)

# --- Update email ---
new_email = f"updated_{rand_str()}@test.com"
test("Update email", "PATCH", "/api/auth/me", token=token_a, json_body={
    "email": new_email
})

# --- Auth error cases ---
test("Register duplicate username", "POST", "/api/auth/register",
     json_body={"username": user_a, "email": "x@x.com", "password": password},
     expected_status=409)

test("Login wrong password", "POST", "/api/auth/login",
     json_body={"username": user_a, "password": "wrongpass"},
     expected_status=401)

test("Get profile without token", "GET", "/api/auth/me", expected_status=403)

# ═══════════════════════════════════════════════════════════════════════════
#  2. Products
# ═══════════════════════════════════════════════════════════════════════════

section("2. Products")

# --- Create products ---
prod1 = test("Create product 1 (User A)", "POST", "/api/products", token=token_a, expected_status=201, json_body={
    "title": f"Test Laptop {rand_str()}",
    "description": "A test laptop",
    "price": 250.0,
    "category": "Electronics",
    "condition": "Good",
    "location": "Hong Kong"
})
product1_id = prod1.get("id", "") if prod1 else ""

prod2 = test("Create product 2 (User A, cheap)", "POST", "/api/products", token=token_a, expected_status=201, json_body={
    "title": f"Cheap Item {rand_str()}",
    "description": "For mystery box test",
    "price": 30.0,
    "category": "Books",
    "condition": "Fair",
    "location": "Kowloon"
})
product2_id = prod2.get("id", "") if prod2 else ""

prod3 = test("Create product 3 (User B)", "POST", "/api/products", token=token_b, expected_status=201, json_body={
    "title": f"User B Item {rand_str()}",
    "description": "User B's product",
    "price": 80.0,
    "category": "Fashion",
    "condition": "Like New",
    "location": "Tsim Sha Tsui"
})
product3_id = prod3.get("id", "") if prod3 else ""

# --- List products ---
test("List all products", "GET", "/api/products")
test("List products (filter: Electronics)", "GET", "/api/products?category=Electronics")
test("List products (search query)", "GET", "/api/products?q=Test")

# --- Get product detail ---
if product1_id:
    test("Get product detail", "GET", f"/api/products/{product1_id}")

# --- Update product ---
if product1_id:
    test("Update product (owner)", "PATCH", f"/api/products/{product1_id}", token=token_a, json_body={
        "description": "Updated description"
    })

# --- Like product ---
if product1_id:
    test("Toggle like (User B likes product 1)", "POST", f"/api/products/{product1_id}/like", token=token_b)
    test("Check if liked", "GET", f"/api/products/{product1_id}/liked", token=token_b)
    test("Toggle like again (unlike)", "POST", f"/api/products/{product1_id}/like", token=token_b)

# --- Stale products ---
test("Get stale products", "GET", "/api/products/stale", token=token_a)

# --- Move to mystery box ---
if product2_id:
    test("Move product to mystery box", "POST", f"/api/products/{product2_id}/move-to-mystery-box", token=token_a)

# --- Error cases ---
test("Create product without auth", "POST", "/api/products",
     json_body={"title": "X", "price": 10}, expected_status=403)

# ═══════════════════════════════════════════════════════════════════════════
#  3. Buy Orders
# ═══════════════════════════════════════════════════════════════════════════

section("3. Buy Orders")

buy1 = test("Create buy order (User A)", "POST", "/api/buy-orders", token=token_a, expected_status=201, json_body={
    "title": f"Want Laptop {rand_str()}",
    "description": "Looking for a laptop",
    "budget": 200.0,
    "category": "Electronics",
    "condition": "Good",
    "location": "Mong Kok"
})
buy_order_id = buy1.get("id", "") if buy1 else ""

test("List buy orders", "GET", "/api/buy-orders")

if buy_order_id:
    test("Get buy order detail", "GET", f"/api/buy-orders/{buy_order_id}")

    test("Update buy order", "PATCH", f"/api/buy-orders/{buy_order_id}", token=token_a, json_body={
        "budget": 220.0
    })

    # --- Negotiation ---
    neg = test("Submit negotiation (User B)", "POST", "/api/buy-orders/negotiations", token=token_b, expected_status=201, json_body={
        "buy_order_id": buy_order_id,
        "mode": "negotiate",
        "seller_name": "Seller B",
        "seller_phone": "12345678",
        "selling_item_title": "My Laptop",
        "offered_price": 190.0,
        "condition": "Good",
        "meetup_location": "Mong Kok MTR",
        "note": "Can meet this weekend"
    })

    # --- Delete buy order ---
    test("Delete buy order", "DELETE", f"/api/buy-orders/{buy_order_id}", token=token_a, expected_status=204)

# ═══════════════════════════════════════════════════════════════════════════
#  4. Rentals
# ═══════════════════════════════════════════════════════════════════════════

section("4. Rentals")

# --- Create rental listing ---
rental1 = test("Create rental listing (User A)", "POST", "/api/rentals", token=token_a, expected_status=201, json_body={
    "title": f"Rent Camera {rand_str()}",
    "description": "Canon camera for rent",
    "daily_price": 50.0,
    "deposit": 200.0,
    "min_days": 1,
    "max_days": 14,
    "category": "Electronics",
    "condition": "Like New",
    "location": "Central"
})
rental1_id = rental1.get("id", "") if rental1 else ""

test("List rentals", "GET", "/api/rentals")

if rental1_id:
    test("Get rental detail", "GET", f"/api/rentals/{rental1_id}")

    test("Update rental", "PATCH", f"/api/rentals/{rental1_id}", token=token_a, json_body={
        "daily_price": 55.0
    })

# --- Create rental order (User B books) ---
if rental1_id:
    ro = test("Create rental order (User B)", "POST", "/api/rental-orders", token=token_b, expected_status=201, json_body={
        "rental_id": rental1_id,
        "renter_name": "Renter B",
        "days": 3,
        "start_date": "2026-05-01",
        "pickup_time": "10:00",
        "phone": "98765432",
        "note": "Will pick up at Central"
    })
    rental_order_id = ro.get("id", "") if ro else ""

    if rental_order_id:
        test("Cancel rental order", "PATCH", f"/api/rental-orders/{rental_order_id}", token=token_b, json_body={
            "status": "cancelled"
        })

    test("List rental orders", "GET", "/api/rental-orders", token=token_b)

# --- Rental Requests ---
rreq = test("Create rental request (User B)", "POST", "/api/rental-requests", token=token_b, expected_status=201, json_body={
    "title": f"Need Projector {rand_str()}",
    "description": "For presentation",
    "daily_budget": 30.0,
    "deposit": 100.0,
    "min_days": 2,
    "max_days": 5,
    "category": "Electronics",
    "condition": "Good",
    "location": "Kwun Tong"
})
rental_req_id = rreq.get("id", "") if rreq else ""

test("List rental requests", "GET", "/api/rental-requests")

if rental_req_id:
    test("Update rental request", "PATCH", f"/api/rental-requests/{rental_req_id}", token=token_b, json_body={
        "daily_budget": 35.0
    })

    # --- Lending offer ---
    lending = test("Create lending offer (User A)", "POST", "/api/rental-lendings", token=token_a, expected_status=201, json_body={
        "request_id": rental_req_id,
        "lender_name": "Lender A",
        "lender_phone": "11112222",
        "note": "I have a projector",
        "days": 3,
        "rental_fee": 90.0,
        "deposit": 100.0,
        "start_date": "2026-05-10",
        "end_date": "2026-05-13",
        "pickup_time": "14:00",
        "location": "Kwun Tong MTR"
    })

    test("List rental lendings", "GET", "/api/rental-lendings", token=token_a)

# ═══════════════════════════════════════════════════════════════════════════
#  5. Cart & Orders
# ═══════════════════════════════════════════════════════════════════════════

section("5. Cart & Orders")

# Use product3 (User B's product, so User A can buy it)
if product3_id:
    test("Add to cart (User A)", "POST", "/api/cart/items", token=token_a, json_body={
        "product_id": product3_id,
        "quantity": 1
    })

    test("Get cart", "GET", "/api/cart", token=token_a)

    test("Update cart item quantity", "PATCH", f"/api/cart/items/{product3_id}", token=token_a, json_body={
        "quantity": 2
    })

    test("Get cart (after update)", "GET", "/api/cart", token=token_a)

    # --- Create order ---
    order = test("Create order (User A)", "POST", "/api/orders", token=token_a, expected_status=201, json_body={
        "items": [{"product_id": product3_id, "quantity": 1}],
        "shipping_address": "123 Test St, HK"
    })

    test("List orders", "GET", "/api/orders", token=token_a)

    # --- Remove remaining cart item ---
    test("Remove from cart", "DELETE", f"/api/cart/items/{product3_id}", token=token_a)

    test("Get cart (after removal)", "GET", "/api/cart", token=token_a)

# ═══════════════════════════════════════════════════════════════════════════
#  6. Mystery Box
# ═══════════════════════════════════════════════════════════════════════════

section("6. Mystery Box")

test("Get mystery box tiers", "GET", "/api/mystery-box/tiers")

# Purchase a mystery box (needs products in the pool — we moved product2 earlier)
mbp = test("Purchase mystery box ($50 tier)", "POST", "/api/mystery-box/purchase", token=token_b, json_body={
    "tier": "$50"
})

test("List mystery box purchases", "GET", "/api/mystery-box/purchases", token=token_b)

# ═══════════════════════════════════════════════════════════════════════════
#  7. Comments
# ═══════════════════════════════════════════════════════════════════════════

section("7. Comments")

if product1_id:
    c1 = test("Add comment (User B)", "POST", f"/api/products/{product1_id}/comments", token=token_b, expected_status=201, json_body={
        "text": "Great product! Is it still available?"
    })
    comment1_id = c1.get("id", "") if c1 else ""

    # --- Reply ---
    if comment1_id:
        test("Reply to comment (User A)", "POST", f"/api/products/{product1_id}/comments", token=token_a, expected_status=201, json_body={
            "text": "Yes, still available!",
            "parent_id": comment1_id
        })

    test("Get comments", "GET", f"/api/products/{product1_id}/comments")

# ═══════════════════════════════════════════════════════════════════════════
#  8. Uploads
# ═══════════════════════════════════════════════════════════════════════════

section("8. Uploads")

# Create a tiny test image (1x1 pixel PNG)
import io
# Minimal valid PNG (1x1 transparent pixel)
png_data = (
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
    b'\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89'
    b'\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01'
    b'\r\n\xb4\x00\x00\x00\x00IEND\xaeB`\x82'
)

upload_result = test("Upload image", "POST", "/api/uploads", token=token_a,
                     files={"file": ("test_image.png", io.BytesIO(png_data), "image/png")})

if upload_result and isinstance(upload_result, dict) and upload_result.get("url"):
    print(f"       Uploaded to: {upload_result['url']}")

# ═══════════════════════════════════════════════════════════════════════════
#  Summary
# ═══════════════════════════════════════════════════════════════════════════

print(f"\n{'='*60}")
print(f"  TEST SUMMARY")
print(f"{'='*60}")
print(f"  ✅ Passed: {PASS}")
print(f"  ❌ Failed: {FAIL}")
print(f"  Total:    {PASS + FAIL}")
print(f"{'='*60}")

if ERRORS:
    print(f"\n  Failed tests:")
    for e in ERRORS:
        print(f"  {e}")

print()
sys.exit(0 if FAIL == 0 else 1)

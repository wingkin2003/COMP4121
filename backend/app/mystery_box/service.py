import random
from datetime import datetime, timezone
from uuid import uuid4

from app.database import get_db

MYSTERY_BOX_TIERS = [
    {"tier": "$50", "label": "$50 Box", "price": 50, "max_original_price": 100, "description": "Items originally ≤ HK$100"},
    {"tier": "$150", "label": "$150 Box", "price": 150, "max_original_price": 300, "description": "Items originally HK$101–300"},
    {"tier": "$300", "label": "$300 Box", "price": 300, "max_original_price": 500, "description": "Items originally HK$301–500"},
    {"tier": "$500", "label": "$500 Box", "price": 500, "max_original_price": 1000, "description": "Items originally HK$501–1,000"},
    {"tier": "$1500", "label": "$1500 Box", "price": 1500, "max_original_price": 3000, "description": "Items originally HK$1,001–3,000"},
]


def get_tier_for_price(price: float) -> dict | None:
    for tier in MYSTERY_BOX_TIERS:
        if price <= tier["max_original_price"]:
            return tier
    return None


async def get_mystery_box_products() -> list[dict]:
    db = get_db()
    cursor = db.products.find({"in_mystery_box": True, "status": "mystery-box"})
    return await cursor.to_list(length=500)


async def get_tier_counts() -> list[dict]:
    products = await get_mystery_box_products()
    counts: dict[str, int] = {}
    for tier in MYSTERY_BOX_TIERS:
        counts[tier["tier"]] = 0

    for p in products:
        tier = get_tier_for_price(p["price"])
        if tier:
            counts[tier["tier"]] = counts.get(tier["tier"], 0) + 1

    result = []
    for tier in MYSTERY_BOX_TIERS:
        result.append({
            **tier,
            "count": counts.get(tier["tier"], 0),
        })
    return result


async def purchase_mystery_box(tier_key: str, buyer_account: str) -> dict | None:
    db = get_db()
    tier = next((t for t in MYSTERY_BOX_TIERS if t["tier"] == tier_key), None)
    if not tier:
        return None

    products = await get_mystery_box_products()
    eligible = [
        p for p in products
        if get_tier_for_price(p["price"]) and get_tier_for_price(p["price"])["tier"] == tier_key
    ]

    if not eligible:
        return None

    picked = random.choice(eligible)

    # Mark product as sold
    await db.products.update_one(
        {"_id": picked["_id"]},
        {"$set": {"status": "sold", "in_mystery_box": False}},
    )

    purchase = {
        "_id": str(uuid4()),
        "tier": tier["tier"],
        "price_paid": tier["price"],
        "product_id": picked["_id"],
        "product_title": picked["title"],
        "original_price": picked["price"],
        "buyer_account": buyer_account,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.mystery_box_purchases.insert_one(purchase)
    return purchase


async def get_purchases_by_account(buyer_account: str) -> list[dict]:
    db = get_db()
    cursor = db.mystery_box_purchases.find(
        {"buyer_account": buyer_account}
    ).sort("created_at", -1)
    return await cursor.to_list(length=500)

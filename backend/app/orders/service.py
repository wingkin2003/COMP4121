from datetime import datetime, timezone
from uuid import uuid4

from app.database import get_db
from app.cart.service import clear_cart

COMMISSION_RATE = 0.04


async def create_order(user_account: str, items: list[dict], shipping_address: str) -> dict:
    db = get_db()

    enriched_items = []
    subtotal = 0.0
    for item in items:
        product = await db.products.find_one({"_id": item["product_id"]})
        price = product["price"] if product else 0
        enriched_items.append({
            "product_id": item["product_id"],
            "quantity": item["quantity"],
            "title": product["title"] if product else "Unknown",
            "price": price,
        })
        subtotal += price * item["quantity"]

        # Mark products as sold
        if product:
            await db.products.update_one(
                {"_id": item["product_id"]},
                {"$set": {"status": "sold"}},
            )

    commission = round(subtotal * COMMISSION_RATE, 2)
    seller_payout = round(subtotal - commission, 2)
    total = round(subtotal + commission, 2)

    doc = {
        "_id": str(uuid4()),
        "user_account": user_account,
        "items": enriched_items,
        "subtotal": subtotal,
        "commission": commission,
        "seller_payout": seller_payout,
        "total": total,
        "shipping_address": shipping_address,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.orders.insert_one(doc)

    # Clear the cart
    await clear_cart(user_account)

    return doc


async def get_orders_by_account(user_account: str) -> list[dict]:
    db = get_db()
    cursor = db.orders.find({"user_account": user_account}).sort("created_at", -1)
    return await cursor.to_list(length=500)

from datetime import datetime, timezone
from uuid import uuid4

from app.database import get_db


async def create_buy_order(data: dict, buyer_account: str) -> dict:
    db = get_db()
    doc = {
        "_id": str(uuid4()),
        "title": data["title"],
        "description": data.get("description", ""),
        "budget": data["budget"],
        "category": data.get("category", "Other"),
        "condition": data.get("condition", "Good"),
        "image": data.get("image", ""),
        "location": data.get("location", ""),
        "buyer_name": data.get("buyer_name", ""),
        "buyer_account": buyer_account,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.buy_orders.insert_one(doc)
    return doc


async def get_buy_orders(
    status: str | None = None,
    q: str | None = None,
    category: str | None = None,
    condition: str | None = None,
    sort: str = "newest",
    buyer_account: str | None = None,
) -> list[dict]:
    db = get_db()
    query: dict = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if condition:
        query["condition"] = condition
    if buyer_account:
        query["buyer_account"] = buyer_account
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]

    sort_field = "created_at"
    sort_dir = -1
    if sort == "oldest":
        sort_dir = 1
    elif sort == "budget_asc":
        sort_field = "budget"
        sort_dir = 1
    elif sort == "budget_desc":
        sort_field = "budget"
        sort_dir = -1

    cursor = db.buy_orders.find(query).sort(sort_field, sort_dir)
    return await cursor.to_list(length=500)


async def get_buy_order_by_id(order_id: str) -> dict | None:
    db = get_db()
    return await db.buy_orders.find_one({"_id": order_id})


async def update_buy_order(order_id: str, updates: dict) -> dict | None:
    db = get_db()
    updates = {k: v for k, v in updates.items() if v is not None}
    if not updates:
        return await get_buy_order_by_id(order_id)
    return await db.buy_orders.find_one_and_update(
        {"_id": order_id}, {"$set": updates}, return_document=True,
    )


async def delete_buy_order(order_id: str) -> bool:
    db = get_db()
    result = await db.buy_orders.delete_one({"_id": order_id})
    return result.deleted_count > 0


async def create_negotiation(data: dict, seller_account: str) -> dict:
    db = get_db()
    buy_order = await get_buy_order_by_id(data["buy_order_id"])
    doc = {
        "_id": str(uuid4()),
        "buy_order_id": data["buy_order_id"],
        "buy_order_title": buy_order["title"] if buy_order else "",
        "mode": data.get("mode", "negotiate"),
        "seller_account": seller_account,
        "seller_name": data.get("seller_name", ""),
        "seller_phone": data.get("seller_phone", ""),
        "selling_item_title": data.get("selling_item_title", ""),
        "offered_price": data["offered_price"],
        "condition": data.get("condition", "Good"),
        "meetup_location": data.get("meetup_location", ""),
        "note": data.get("note", ""),
        "status": "submitted",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.buy_negotiations.insert_one(doc)
    return doc

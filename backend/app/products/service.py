from datetime import datetime, timezone
from uuid import uuid4

from app.database import get_db


async def create_product(data: dict, seller_account: str) -> dict:
    db = get_db()
    doc = {
        "_id": str(uuid4()),
        "title": data["title"],
        "description": data.get("description", ""),
        "price": data["price"],
        "category": data.get("category", "Other"),
        "condition": data.get("condition", "Good"),
        "image": data.get("image", ""),
        "location": data.get("location", ""),
        "seller_name": data.get("seller_name", ""),
        "seller_account": seller_account,
        "status": "selling",
        "likes": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "sustainability_tag": data.get("sustainability_tag"),
        "in_mystery_box": False,
        "mystery_box_invited": False,
    }
    await db.products.insert_one(doc)
    return doc


async def get_products(
    status: str | None = None,
    q: str | None = None,
    category: str | None = None,
    condition: str | None = None,
    sustainability_tag: str | None = None,
    sort: str = "newest",
    seller_account: str | None = None,
) -> list[dict]:
    db = get_db()
    query: dict = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if condition:
        query["condition"] = condition
    if sustainability_tag:
        query["sustainability_tag"] = sustainability_tag
    if seller_account:
        query["seller_account"] = seller_account
    if q:
        query["$or"] = [
            {"title": {"$regex": q, "$options": "i"}},
            {"description": {"$regex": q, "$options": "i"}},
        ]

    sort_field = "created_at"
    sort_dir = -1
    if sort == "oldest":
        sort_dir = 1
    elif sort == "price_asc":
        sort_field = "price"
        sort_dir = 1
    elif sort == "price_desc":
        sort_field = "price"
        sort_dir = -1

    cursor = db.products.find(query).sort(sort_field, sort_dir)
    return await cursor.to_list(length=500)


async def get_product_by_id(product_id: str) -> dict | None:
    db = get_db()
    return await db.products.find_one({"_id": product_id})


async def update_product(product_id: str, updates: dict) -> dict | None:
    db = get_db()
    # Remove None values
    updates = {k: v for k, v in updates.items() if v is not None}
    if not updates:
        return await get_product_by_id(product_id)
    result = await db.products.find_one_and_update(
        {"_id": product_id},
        {"$set": updates},
        return_document=True,
    )
    return result


async def toggle_like(product_id: str, user_account: str) -> dict:
    db = get_db()
    existing = await db.likes.find_one(
        {"user_account": user_account, "product_id": product_id}
    )
    if existing:
        await db.likes.delete_one({"_id": existing["_id"]})
        await db.products.update_one(
            {"_id": product_id}, {"$inc": {"likes": -1}}
        )
        product = await get_product_by_id(product_id)
        return {"liked": False, "likes": product["likes"] if product else 0}
    else:
        await db.likes.insert_one(
            {"user_account": user_account, "product_id": product_id}
        )
        await db.products.update_one(
            {"_id": product_id}, {"$inc": {"likes": 1}}
        )
        product = await get_product_by_id(product_id)
        return {"liked": True, "likes": product["likes"] if product else 0}


async def has_user_liked(product_id: str, user_account: str) -> bool:
    db = get_db()
    existing = await db.likes.find_one(
        {"user_account": user_account, "product_id": product_id}
    )
    return existing is not None


async def get_stale_products(seller_account: str, stale_days: int = 14) -> list[dict]:
    db = get_db()
    from datetime import timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(days=stale_days)).isoformat()
    cursor = db.products.find({
        "seller_account": seller_account,
        "status": "selling",
        "in_mystery_box": {"$ne": True},
        "created_at": {"$lte": cutoff},
    })
    return await cursor.to_list(length=500)


async def move_to_mystery_box(product_id: str) -> dict | None:
    return await update_product(product_id, {
        "status": "mystery-box",
        "in_mystery_box": True,
        "mystery_box_invited": True,
    })

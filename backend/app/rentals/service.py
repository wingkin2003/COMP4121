from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.database import get_db

COMMISSION_RATE = 0.04


# ── Rental Listings ──

async def create_rental(data: dict, owner_account: str) -> dict:
    db = get_db()
    doc = {
        "_id": str(uuid4()),
        "title": data["title"],
        "description": data.get("description", ""),
        "daily_price": data["daily_price"],
        "deposit": data.get("deposit", 0),
        "min_days": data.get("min_days", 1),
        "max_days": data.get("max_days", 7),
        "category": data.get("category", "Other"),
        "condition": data.get("condition", "Good"),
        "image": data.get("image", ""),
        "location": data.get("location", ""),
        "owner_name": data.get("owner_name", ""),
        "owner_account": owner_account,
        "status": "available",
        "likes": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.rentals.insert_one(doc)
    return doc


async def get_rentals(
    status: str | None = None,
    q: str | None = None,
    category: str | None = None,
    condition: str | None = None,
    sort: str = "newest",
    owner_account: str | None = None,
) -> list[dict]:
    db = get_db()
    query: dict = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if condition:
        query["condition"] = condition
    if owner_account:
        query["owner_account"] = owner_account
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
        sort_field = "daily_price"
        sort_dir = 1
    elif sort == "price_desc":
        sort_field = "daily_price"
        sort_dir = -1

    cursor = db.rentals.find(query).sort(sort_field, sort_dir)
    return await cursor.to_list(length=500)


async def get_rental_by_id(rental_id: str) -> dict | None:
    db = get_db()
    return await db.rentals.find_one({"_id": rental_id})


async def update_rental(rental_id: str, updates: dict) -> dict | None:
    db = get_db()
    updates = {k: v for k, v in updates.items() if v is not None}
    if not updates:
        return await get_rental_by_id(rental_id)
    return await db.rentals.find_one_and_update(
        {"_id": rental_id}, {"$set": updates}, return_document=True,
    )


# ── Rental Requests ──

async def create_rental_request(data: dict, requester_account: str) -> dict:
    db = get_db()
    doc = {
        "_id": str(uuid4()),
        "title": data["title"],
        "description": data.get("description", ""),
        "daily_budget": data["daily_budget"],
        "min_days": data.get("min_days", 1),
        "max_days": data.get("max_days", 7),
        "category": data.get("category", "Other"),
        "condition": data.get("condition", "Good"),
        "image": data.get("image", ""),
        "location": data.get("location", ""),
        "requester_name": data.get("requester_name", ""),
        "requester_account": requester_account,
        "status": "open",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.rental_requests.insert_one(doc)
    return doc


async def get_rental_requests(
    status: str | None = None,
    q: str | None = None,
    category: str | None = None,
    condition: str | None = None,
    sort: str = "newest",
    requester_account: str | None = None,
) -> list[dict]:
    db = get_db()
    query: dict = {}
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if condition:
        query["condition"] = condition
    if requester_account:
        query["requester_account"] = requester_account
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
        sort_field = "daily_budget"
        sort_dir = 1
    elif sort == "budget_desc":
        sort_field = "daily_budget"
        sort_dir = -1

    cursor = db.rental_requests.find(query).sort(sort_field, sort_dir)
    return await cursor.to_list(length=500)


async def get_rental_request_by_id(request_id: str) -> dict | None:
    db = get_db()
    return await db.rental_requests.find_one({"_id": request_id})


async def update_rental_request(request_id: str, updates: dict) -> dict | None:
    db = get_db()
    updates = {k: v for k, v in updates.items() if v is not None}
    if not updates:
        return await get_rental_request_by_id(request_id)
    return await db.rental_requests.find_one_and_update(
        {"_id": request_id}, {"$set": updates}, return_document=True,
    )


# ── Rental Orders (Bookings) ──

async def create_rental_order(data: dict, renter_account: str) -> dict:
    db = get_db()
    rental = await get_rental_by_id(data["rental_id"])
    if not rental:
        raise ValueError("Rental not found")

    days = data["days"]
    rental_fee = rental["daily_price"] * days
    deposit = rental["deposit"]
    commission = round(rental_fee * COMMISSION_RATE, 2)
    total = round(rental_fee + commission + deposit, 2)

    start_date = data.get("start_date", datetime.now(timezone.utc).strftime("%Y-%m-%d"))
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    end_date = (start_dt + timedelta(days=days)).strftime("%Y-%m-%d")

    doc = {
        "_id": str(uuid4()),
        "rental_id": data["rental_id"],
        "renter_account": renter_account,
        "renter_name": data.get("renter_name", ""),
        "days": days,
        "rental_fee": rental_fee,
        "deposit": deposit,
        "commission": commission,
        "total": total,
        "start_date": start_date,
        "end_date": end_date,
        "rental_title": rental["title"],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.rental_orders.insert_one(doc)
    # Mark rental as rented
    await update_rental(data["rental_id"], {"status": "rented"})
    return doc


async def get_rental_orders(renter_account: str | None = None) -> list[dict]:
    db = get_db()
    query: dict = {}
    if renter_account:
        query["renter_account"] = renter_account
    cursor = db.rental_orders.find(query).sort("created_at", -1)
    return await cursor.to_list(length=500)


async def update_rental_order(order_id: str, updates: dict) -> dict | None:
    db = get_db()
    updates = {k: v for k, v in updates.items() if v is not None}
    if not updates:
        return None
    return await db.rental_orders.find_one_and_update(
        {"_id": order_id}, {"$set": updates}, return_document=True,
    )


# ── Rental Lendings ──

async def create_rental_lending(data: dict, lender_account: str) -> dict:
    db = get_db()
    request = await get_rental_request_by_id(data["request_id"])

    rental_fee = data.get("rental_fee", 0)
    commission = round(rental_fee * COMMISSION_RATE, 2)
    deposit = data.get("deposit", 0)
    total = round(rental_fee + commission + deposit, 2)

    doc = {
        "_id": str(uuid4()),
        "request_id": data["request_id"],
        "request_title": request["title"] if request else "",
        "lender_account": lender_account,
        "lender_name": data.get("lender_name", ""),
        "lender_phone": data.get("lender_phone", ""),
        "note": data.get("note", ""),
        "days": data.get("days", 1),
        "rental_fee": rental_fee,
        "commission": commission,
        "deposit": deposit,
        "total": total,
        "start_date": data.get("start_date", ""),
        "end_date": data.get("end_date", ""),
        "pickup_time": data.get("pickup_time", ""),
        "location": data.get("location", ""),
        "status": "offered",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.rental_lendings.insert_one(doc)
    return doc


async def get_rental_lendings(lender_account: str | None = None) -> list[dict]:
    db = get_db()
    query: dict = {}
    if lender_account:
        query["lender_account"] = lender_account
    cursor = db.rental_lendings.find(query).sort("created_at", -1)
    return await cursor.to_list(length=500)

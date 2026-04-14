from datetime import datetime, timedelta

from app.database import get_db

COMMISSION_RATE = 0.04

MYSTERY_BOX_TIERS = {
    "$50": {"label": "$50 Box", "price": 50},
    "$150": {"label": "$150 Box", "price": 150},
    "$300": {"label": "$300 Box", "price": 300},
    "$500": {"label": "$500 Box", "price": 500},
    "$1500": {"label": "$1500 Box", "price": 1500},
}


async def get_cart(user_account: str) -> dict:
    db = get_db()
    cart = await db.carts.find_one({"user_account": user_account})
    if not cart:
        cart = {"user_account": user_account, "items": []}
        await db.carts.insert_one(cart)
    return cart


async def add_to_cart(user_account: str, product_id: str, quantity: int = 1) -> dict:
    db = get_db()
    cart = await get_cart(user_account)
    items = cart.get("items", [])

    existing = next(
        (i for i in items if i["product_id"] == product_id and i.get("type", "product") == "product"),
        None,
    )
    if existing:
        existing["quantity"] += quantity
    else:
        items.append({"product_id": product_id, "quantity": quantity, "type": "product"})

    await db.carts.update_one(
        {"user_account": user_account},
        {"$set": {"items": items}},
        upsert=True,
    )
    return await get_cart(user_account)


async def add_mystery_box_to_cart(user_account: str, tier: str) -> dict:
    db = get_db()
    cart = await get_cart(user_account)
    items = cart.get("items", [])

    item_id = f"mystery_box_{tier}"
    existing = next(
        (i for i in items if i["product_id"] == item_id and i.get("type") == "mystery_box"),
        None,
    )
    if existing:
        existing["quantity"] += 1
    else:
        items.append({
            "product_id": item_id,
            "quantity": 1,
            "type": "mystery_box",
            "tier": tier,
        })

    await db.carts.update_one(
        {"user_account": user_account},
        {"$set": {"items": items}},
        upsert=True,
    )
    return await get_cart(user_account)


async def add_rental_to_cart(user_account: str, data: dict) -> dict:
    db = get_db()
    cart = await get_cart(user_account)
    items = cart.get("items", [])

    rental_id = data["rental_id"]
    item_id = f"rental_{rental_id}"

    # Remove any existing entry for this rental
    items = [i for i in items if i["product_id"] != item_id]

    items.append({
        "product_id": item_id,
        "quantity": 1,
        "type": "rental",
        "rental_id": rental_id,
        "days": data.get("days", 1),
        "start_date": data.get("start_date", ""),
        "pickup_time": data.get("pickup_time", ""),
        "renter_name": data.get("renter_name", ""),
        "renter_phone": data.get("renter_phone", ""),
        "renter_note": data.get("renter_note", ""),
    })

    await db.carts.update_one(
        {"user_account": user_account},
        {"$set": {"items": items}},
        upsert=True,
    )
    return await get_cart(user_account)


async def update_cart_item(user_account: str, product_id: str, quantity: int) -> dict:
    db = get_db()
    cart = await get_cart(user_account)
    items = cart.get("items", [])

    if quantity <= 0:
        items = [i for i in items if i["product_id"] != product_id]
    else:
        existing = next((i for i in items if i["product_id"] == product_id), None)
        if existing:
            existing["quantity"] = quantity

    await db.carts.update_one(
        {"user_account": user_account},
        {"$set": {"items": items}},
        upsert=True,
    )
    return await get_cart(user_account)


async def remove_from_cart(user_account: str, product_id: str) -> dict:
    return await update_cart_item(user_account, product_id, 0)


async def clear_cart(user_account: str) -> None:
    db = get_db()
    await db.carts.update_one(
        {"user_account": user_account},
        {"$set": {"items": []}},
        upsert=True,
    )


async def get_cart_with_products(user_account: str) -> dict:
    db = get_db()
    cart = await get_cart(user_account)
    items = cart.get("items", [])

    enriched = []
    subtotal = 0.0

    for item in items:
        item_type = item.get("type", "product")

        if item_type == "mystery_box":
            tier_key = item.get("tier", "")
            tier_info = MYSTERY_BOX_TIERS.get(tier_key, {})
            price = tier_info.get("price", 0)
            qty = item["quantity"]
            enriched.append({
                "product_id": item["product_id"],
                "quantity": qty,
                "title": f"Mystery Box — {tier_info.get('label', tier_key)}",
                "price": price,
                "image": "",
                "seller_name": "",
                "type": "mystery_box",
                "tier": tier_key,
                "tier_label": tier_info.get("label", tier_key),
            })
            subtotal += price * qty

        elif item_type == "rental":
            rental_id = item.get("rental_id", "")
            rental = await db.rentals.find_one({"_id": rental_id})
            if not rental:
                continue
            days = item.get("days", 1)
            daily_price = rental.get("daily_price", 0)
            deposit = rental.get("deposit", 0)
            rental_fee = daily_price * days
            commission = round(rental_fee * COMMISSION_RATE, 2)
            rental_total = round(rental_fee + commission + deposit, 2)

            start_date = item.get("start_date", "")
            end_date = ""
            if start_date:
                try:
                    sd = datetime.strptime(start_date[:10], "%Y-%m-%d")
                    end_date = (sd + timedelta(days=days)).strftime("%Y-%m-%d")
                except Exception:
                    pass

            enriched.append({
                "product_id": item["product_id"],
                "quantity": 1,
                "title": f"Rental: {rental.get('title', 'Unknown')}",
                "price": rental_total,
                "image": rental.get("image", ""),
                "seller_name": rental.get("owner_name", ""),
                "type": "rental",
                "rental_id": rental_id,
                "days": days,
                "daily_price": daily_price,
                "deposit": deposit,
                "commission": commission,
                "rental_total": rental_total,
                "start_date": start_date[:10] if start_date else "",
                "end_date": end_date,
                "pickup_time": item.get("pickup_time", ""),
                "renter_name": item.get("renter_name", ""),
                "renter_phone": item.get("renter_phone", ""),
                "renter_note": item.get("renter_note", ""),
                "location": rental.get("location", ""),
                "owner_name": rental.get("owner_name", ""),
            })
            subtotal += rental_total

        else:
            # product type (default)
            product = await db.products.find_one({"_id": item["product_id"]})
            price = product["price"] if product else 0
            enriched.append({
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "title": product["title"] if product else "Unknown",
                "price": price,
                "image": product.get("image", "") if product else "",
                "seller_name": product.get("seller_name", "") if product else "",
                "type": "product",
            })
            subtotal += price * item["quantity"]

    return {"items": enriched, "subtotal": round(subtotal, 2)}

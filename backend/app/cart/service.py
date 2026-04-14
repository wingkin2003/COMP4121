from app.database import get_db


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

    existing = next((i for i in items if i["product_id"] == product_id), None)
    if existing:
        existing["quantity"] += quantity
    else:
        items.append({"product_id": product_id, "quantity": quantity})

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
        product = await db.products.find_one({"_id": item["product_id"]})
        price = product["price"] if product else 0
        enriched.append({
            "product_id": item["product_id"],
            "quantity": item["quantity"],
            "title": product["title"] if product else "Unknown",
            "price": price,
            "image": product.get("image", "") if product else "",
            "seller_name": product.get("seller_name", "") if product else "",
        })
        subtotal += price * item["quantity"]

    return {"items": enriched, "subtotal": round(subtotal, 2)}

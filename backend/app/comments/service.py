from datetime import datetime, timezone
from uuid import uuid4

from app.database import get_db


async def add_comment(product_id: str, user_account: str, text: str, parent_id: str | None = None) -> dict:
    db = get_db()
    doc = {
        "_id": str(uuid4()),
        "product_id": product_id,
        "user_account": user_account,
        "text": text,
        "parent_id": parent_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.comments.insert_one(doc)
    return doc


async def get_comments(product_id: str) -> list[dict]:
    db = get_db()
    cursor = db.comments.find({"product_id": product_id}).sort("created_at", 1)
    all_comments = await cursor.to_list(length=1000)

    # Build tree
    by_id: dict[str, dict] = {}
    roots: list[dict] = []

    for c in all_comments:
        c["replies"] = []
        by_id[c["_id"]] = c

    for c in all_comments:
        if c.get("parent_id") and c["parent_id"] in by_id:
            by_id[c["parent_id"]]["replies"].append(c)
        else:
            roots.append(c)

    return roots

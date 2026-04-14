#!/usr/bin/env python3
"""
Remove duplicate documents from all MongoDB collections.
Keeps the oldest document (by _id) for each group of duplicates.
"""

from pymongo import MongoClient

MONGODB_URI = "mongodb+srv://admin:password123987@comp4121.rv6xhbd.mongodb.net/secondlife"

# Define dedup keys for each collection
# (collection_name, list_of_fields_that_define_uniqueness)
DEDUP_RULES = {
    "products":        ["title", "seller"],
    "buy_orders":      ["title", "buyer"],
    "rentals":         ["title", "owner"],
    "rental_requests": ["title", "requester"],
    "rental_lendings": ["rental_request_id", "lender"],
    "rental_bookings": ["rental_id", "renter"],
    "comments":        ["product_id", "user_account", "text"],
    "orders":          ["user_account"],
    "mystery_box_items": ["product_id"],
    "likes":           ["user_account", "product_id"],
    "carts":           ["user_account"],
}


def dedup_collection(db, coll_name, key_fields):
    coll = db[coll_name]
    total = coll.count_documents({})
    if total == 0:
        print(f"  {coll_name}: empty, skipping")
        return 0

    # Build aggregation to find duplicate groups
    group_id = {f: f"${f}" for f in key_fields}
    pipeline = [
        {"$group": {
            "_id": group_id,
            "ids": {"$push": "$_id"},
            "count": {"$sum": 1}
        }},
        {"$match": {"count": {"$gt": 1}}}
    ]

    duplicates_removed = 0
    for doc in coll.aggregate(pipeline):
        # Keep the first (oldest) _id, delete the rest
        ids_to_delete = doc["ids"][1:]
        result = coll.delete_many({"_id": {"$in": ids_to_delete}})
        duplicates_removed += result.deleted_count

    remaining = coll.count_documents({})
    if duplicates_removed > 0:
        print(f"  {coll_name}: {total} → {remaining} (removed {duplicates_removed} duplicates)")
    else:
        print(f"  {coll_name}: {total} docs, no duplicates")

    return duplicates_removed


def main():
    client = MongoClient(MONGODB_URI)
    db = client.get_default_database()

    print("🧹 Cleaning up duplicate data...\n")

    total_removed = 0
    for coll_name, key_fields in DEDUP_RULES.items():
        removed = dedup_collection(db, coll_name, key_fields)
        total_removed += removed

    # Also check for any other collections not in our rules
    all_colls = db.list_collection_names()
    known = set(DEDUP_RULES.keys()) | {"users"}
    unknown = [c for c in all_colls if c not in known and not c.startswith("system.")]
    if unknown:
        print(f"\n  ℹ️  Other collections (not deduped): {', '.join(unknown)}")

    print(f"\n{'='*50}")
    print(f"  ✅ Done! Removed {total_removed} duplicate documents total.")
    print(f"{'='*50}")

    client.close()


if __name__ == "__main__":
    main()

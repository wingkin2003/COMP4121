from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None  # type: ignore
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.mongodb_uri)
    db = client.get_default_database()
    # Create indexes
    await db.users.create_index("username", unique=True)
    await db.likes.create_index([("user_account", 1), ("product_id", 1)], unique=True)
    await db.carts.create_index("user_account", unique=True)


async def close_db():
    global client
    if client:
        client.close()


def get_db():
    return db

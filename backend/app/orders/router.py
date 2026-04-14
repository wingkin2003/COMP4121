from fastapi import APIRouter, Depends

from app.auth.dependencies import get_current_user
from app.orders.schemas import OrderCreate, OrderOut
from app.orders.service import create_order, get_orders_by_account

router = APIRouter()


def _to_out(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "created_at": doc.get("created_at", ""),
        "items": [
            {
                "product_id": i["product_id"],
                "quantity": i["quantity"],
                "title": i.get("title", ""),
                "price": i.get("price", 0),
            }
            for i in doc.get("items", [])
        ],
        "subtotal": doc.get("subtotal", 0),
        "commission": doc.get("commission", 0),
        "seller_payout": doc.get("seller_payout", 0),
        "total": doc.get("total", 0),
        "shipping_address": doc.get("shipping_address", ""),
    }


@router.post("", response_model=OrderOut, status_code=201)
async def place_order(body: OrderCreate, user: dict = Depends(get_current_user)):
    items = [i.model_dump() for i in body.items]
    doc = await create_order(user["username"], items, body.shipping_address)
    return _to_out(doc)


@router.get("", response_model=list[OrderOut])
async def list_orders(user: dict = Depends(get_current_user)):
    docs = await get_orders_by_account(user["username"])
    return [_to_out(d) for d in docs]

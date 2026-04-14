from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_user
from app.buy_orders.schemas import (
    BuyOrderCreate, BuyOrderUpdate, BuyOrderOut,
    NegotiationCreate, NegotiationOut,
)
from app.buy_orders.service import (
    create_buy_order, get_buy_orders, get_buy_order_by_id,
    update_buy_order, delete_buy_order, create_negotiation,
)

router = APIRouter()


def _to_out(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "title": doc["title"],
        "description": doc.get("description", ""),
        "budget": doc["budget"],
        "category": doc.get("category", "Other"),
        "condition": doc.get("condition", "Good"),
        "image": doc.get("image", ""),
        "location": doc.get("location", ""),
        "buyer_name": doc.get("buyer_name", ""),
        "buyer_account": doc.get("buyer_account", ""),
        "status": doc.get("status", "open"),
        "created_at": doc.get("created_at", ""),
    }


def _neg_out(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "buy_order_id": doc["buy_order_id"],
        "buy_order_title": doc.get("buy_order_title", ""),
        "mode": doc.get("mode", "negotiate"),
        "seller_account": doc.get("seller_account", ""),
        "seller_name": doc.get("seller_name", ""),
        "seller_phone": doc.get("seller_phone", ""),
        "selling_item_title": doc.get("selling_item_title", ""),
        "offered_price": doc.get("offered_price", 0),
        "condition": doc.get("condition", "Good"),
        "meetup_location": doc.get("meetup_location", ""),
        "note": doc.get("note", ""),
        "status": doc.get("status", "submitted"),
        "created_at": doc.get("created_at", ""),
    }


@router.get("", response_model=list[BuyOrderOut])
async def list_buy_orders(
    status: str | None = Query(None),
    q: str | None = Query(None),
    category: str | None = Query(None),
    condition: str | None = Query(None),
    sort: str = Query("newest"),
    buyer_account: str | None = Query(None),
):
    docs = await get_buy_orders(
        status=status, q=q, category=category,
        condition=condition, sort=sort, buyer_account=buyer_account,
    )
    return [_to_out(d) for d in docs]


@router.get("/{order_id}", response_model=BuyOrderOut)
async def get_order(order_id: str):
    doc = await get_buy_order_by_id(order_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Buy order not found")
    return _to_out(doc)


@router.post("", response_model=BuyOrderOut, status_code=201)
async def create(body: BuyOrderCreate, user: dict = Depends(get_current_user)):
    doc = await create_buy_order(body.model_dump(), user["username"])
    return _to_out(doc)


@router.patch("/{order_id}", response_model=BuyOrderOut)
async def update(
    order_id: str, body: BuyOrderUpdate, user: dict = Depends(get_current_user)
):
    doc = await get_buy_order_by_id(order_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Buy order not found")
    if doc["buyer_account"] != user["username"]:
        raise HTTPException(status_code=403, detail="Not your buy order")
    updated = await update_buy_order(order_id, body.model_dump(exclude_none=True))
    return _to_out(updated)


@router.delete("/{order_id}", status_code=204)
async def delete(order_id: str, user: dict = Depends(get_current_user)):
    doc = await get_buy_order_by_id(order_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Buy order not found")
    if doc["buyer_account"] != user["username"]:
        raise HTTPException(status_code=403, detail="Not your buy order")
    await delete_buy_order(order_id)


@router.post("/negotiations", response_model=NegotiationOut, status_code=201)
async def negotiate(body: NegotiationCreate, user: dict = Depends(get_current_user)):
    buy_order = await get_buy_order_by_id(body.buy_order_id)
    if not buy_order:
        raise HTTPException(status_code=404, detail="Buy order not found")
    doc = await create_negotiation(body.model_dump(), user["username"])
    return _neg_out(doc)

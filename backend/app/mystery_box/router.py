from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.mystery_box.schemas import TierInfo, PurchaseRequest, PurchaseOut
from app.mystery_box.service import get_tier_counts, purchase_mystery_box, get_purchases_by_account

router = APIRouter()


@router.get("/tiers", response_model=list[TierInfo])
async def list_tiers():
    return await get_tier_counts()


@router.post("/purchase", response_model=PurchaseOut)
async def purchase(body: PurchaseRequest, user: dict = Depends(get_current_user)):
    result = await purchase_mystery_box(body.tier, user["username"])
    if not result:
        raise HTTPException(status_code=400, detail="No items available in this tier")
    return {
        "id": result["_id"],
        "tier": result["tier"],
        "price_paid": result["price_paid"],
        "product_id": result["product_id"],
        "product_title": result["product_title"],
        "original_price": result["original_price"],
        "buyer_account": result["buyer_account"],
        "created_at": result["created_at"],
    }


@router.get("/purchases", response_model=list[PurchaseOut])
async def list_purchases(user: dict = Depends(get_current_user)):
    docs = await get_purchases_by_account(user["username"])
    return [
        {
            "id": d["_id"],
            "tier": d["tier"],
            "price_paid": d["price_paid"],
            "product_id": d["product_id"],
            "product_title": d["product_title"],
            "original_price": d["original_price"],
            "buyer_account": d["buyer_account"],
            "created_at": d["created_at"],
        }
        for d in docs
    ]

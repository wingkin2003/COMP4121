from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_user
from app.products.schemas import ProductCreate, ProductUpdate, ProductOut
from app.products.service import (
    create_product,
    get_products,
    get_product_by_id,
    update_product,
    toggle_like,
    has_user_liked,
    get_stale_products,
    move_to_mystery_box,
)

router = APIRouter()


def _to_out(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "title": doc["title"],
        "description": doc.get("description", ""),
        "price": doc["price"],
        "category": doc.get("category", "Other"),
        "condition": doc.get("condition", "Good"),
        "image": doc.get("image", ""),
        "location": doc.get("location", ""),
        "seller_name": doc.get("seller_name", ""),
        "seller_account": doc.get("seller_account", ""),
        "status": doc.get("status", "selling"),
        "likes": doc.get("likes", 0),
        "created_at": doc.get("created_at", ""),
        "sustainability_tag": doc.get("sustainability_tag"),
        "in_mystery_box": doc.get("in_mystery_box", False),
        "mystery_box_invited": doc.get("mystery_box_invited", False),
    }


@router.get("/stale", response_model=list[ProductOut])
async def list_stale_products(user: dict = Depends(get_current_user)):
    docs = await get_stale_products(user["username"])
    return [_to_out(d) for d in docs]


@router.get("", response_model=list[ProductOut])
async def list_products(
    status: str | None = Query(None),
    q: str | None = Query(None),
    category: str | None = Query(None),
    condition: str | None = Query(None),
    sustainability_tag: str | None = Query(None),
    sort: str = Query("newest"),
    seller_account: str | None = Query(None),
):
    docs = await get_products(
        status=status, q=q, category=category, condition=condition,
        sustainability_tag=sustainability_tag, sort=sort,
        seller_account=seller_account,
    )
    return [_to_out(d) for d in docs]


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str):
    doc = await get_product_by_id(product_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    return _to_out(doc)


@router.post("", response_model=ProductOut, status_code=201)
async def create(body: ProductCreate, user: dict = Depends(get_current_user)):
    doc = await create_product(body.model_dump(), user["username"])
    return _to_out(doc)


@router.patch("/{product_id}", response_model=ProductOut)
async def update(
    product_id: str, body: ProductUpdate, user: dict = Depends(get_current_user)
):
    doc = await get_product_by_id(product_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    if doc["seller_account"] != user["username"]:
        raise HTTPException(status_code=403, detail="Not your product")
    updated = await update_product(product_id, body.model_dump(exclude_none=True))
    return _to_out(updated)


@router.post("/{product_id}/like")
async def like_product(product_id: str, user: dict = Depends(get_current_user)):
    doc = await get_product_by_id(product_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    result = await toggle_like(product_id, user["username"])
    return result


@router.get("/{product_id}/liked")
async def check_liked(product_id: str, user: dict = Depends(get_current_user)):
    liked = await has_user_liked(product_id, user["username"])
    return {"liked": liked}


@router.post("/{product_id}/move-to-mystery-box", response_model=ProductOut)
async def move_mystery(product_id: str, user: dict = Depends(get_current_user)):
    doc = await get_product_by_id(product_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    if doc["seller_account"] != user["username"]:
        raise HTTPException(status_code=403, detail="Not your product")
    updated = await move_to_mystery_box(product_id)
    return _to_out(updated)

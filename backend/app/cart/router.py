from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import get_current_user
from app.cart.schemas import CartItemAdd, CartItemUpdate, CartMysteryBoxAdd, CartRentalAdd, CartOut
from app.cart.service import (
    get_cart_with_products, add_to_cart, update_cart_item, remove_from_cart,
    add_mystery_box_to_cart, add_rental_to_cart,
)

router = APIRouter()


@router.get("", response_model=CartOut)
async def get_cart(user: dict = Depends(get_current_user)):
    return await get_cart_with_products(user["username"])


@router.post("/items", response_model=CartOut)
async def add_item(body: CartItemAdd, user: dict = Depends(get_current_user)):
    await add_to_cart(user["username"], body.product_id, body.quantity)
    return await get_cart_with_products(user["username"])


@router.post("/mystery-box", response_model=CartOut)
async def add_mystery_box(body: CartMysteryBoxAdd, user: dict = Depends(get_current_user)):
    await add_mystery_box_to_cart(user["username"], body.tier)
    return await get_cart_with_products(user["username"])


@router.post("/rental", response_model=CartOut)
async def add_rental(body: CartRentalAdd, user: dict = Depends(get_current_user)):
    await add_rental_to_cart(user["username"], body.model_dump())
    return await get_cart_with_products(user["username"])


@router.patch("/items/{product_id}", response_model=CartOut)
async def update_item(
    product_id: str, body: CartItemUpdate, user: dict = Depends(get_current_user)
):
    await update_cart_item(user["username"], product_id, body.quantity)
    return await get_cart_with_products(user["username"])


@router.delete("/items/{product_id}", response_model=CartOut)
async def delete_item(product_id: str, user: dict = Depends(get_current_user)):
    await remove_from_cart(user["username"], product_id)
    return await get_cart_with_products(user["username"])

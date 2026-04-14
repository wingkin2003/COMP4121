from pydantic import BaseModel, Field


class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = Field(1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0)


class CartItemOut(BaseModel):
    product_id: str
    quantity: int
    title: str = ""
    price: float = 0
    image: str = ""
    seller_name: str = ""


class CartOut(BaseModel):
    items: list[CartItemOut]
    subtotal: float

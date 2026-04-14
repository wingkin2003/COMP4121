from pydantic import BaseModel


class OrderItemIn(BaseModel):
    product_id: str
    quantity: int


class OrderCreate(BaseModel):
    items: list[OrderItemIn]
    shipping_address: str = ""


class OrderItemOut(BaseModel):
    product_id: str
    quantity: int
    title: str = ""
    price: float = 0


class OrderOut(BaseModel):
    id: str
    created_at: str
    items: list[OrderItemOut]
    subtotal: float
    commission: float
    seller_payout: float
    total: float
    shipping_address: str

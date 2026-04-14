from pydantic import BaseModel, Field
from typing import Literal

ProductCategory = Literal[
    "Electronics", "Furniture", "Fashion", "Books",
    "Appliances", "Toys", "Sports", "Other",
]
ProductCondition = Literal["Like New", "Good", "Fair", "Poor"]
BuyOrderStatus = Literal["open", "matched", "closed"]


class BuyOrderCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = ""
    budget: float = Field(..., gt=0)
    category: ProductCategory = "Other"
    condition: ProductCondition = "Good"
    image: str = ""
    location: str = ""
    buyer_name: str = ""


class BuyOrderUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    budget: float | None = None
    category: ProductCategory | None = None
    condition: ProductCondition | None = None
    image: str | None = None
    location: str | None = None
    buyer_name: str | None = None
    status: BuyOrderStatus | None = None


class BuyOrderOut(BaseModel):
    id: str
    title: str
    description: str
    budget: float
    category: str
    condition: str
    image: str
    location: str
    buyer_name: str
    buyer_account: str
    status: str
    created_at: str


class NegotiationCreate(BaseModel):
    buy_order_id: str
    mode: Literal["negotiate", "sales"] = "negotiate"
    seller_name: str = ""
    seller_phone: str = ""
    selling_item_title: str = ""
    offered_price: float = Field(..., gt=0)
    condition: ProductCondition = "Good"
    meetup_location: str = ""
    note: str = ""


class NegotiationOut(BaseModel):
    id: str
    buy_order_id: str
    buy_order_title: str
    mode: str
    seller_account: str
    seller_name: str
    seller_phone: str
    selling_item_title: str
    offered_price: float
    condition: str
    meetup_location: str
    note: str
    status: str
    created_at: str

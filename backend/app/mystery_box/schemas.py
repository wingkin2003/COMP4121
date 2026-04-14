from pydantic import BaseModel
from typing import Literal

MysteryBoxTier = Literal["$50", "$150", "$300", "$500", "$1500"]


class TierInfo(BaseModel):
    tier: str
    label: str
    price: float
    max_original_price: float
    description: str
    count: int


class PurchaseRequest(BaseModel):
    tier: MysteryBoxTier


class PurchaseOut(BaseModel):
    id: str
    tier: str
    price_paid: float
    product_id: str
    product_title: str
    original_price: float
    buyer_account: str
    created_at: str

from pydantic import BaseModel, Field
from typing import Literal


ProductCategory = Literal[
    "Electronics", "Furniture", "Fashion", "Books",
    "Appliances", "Toys", "Sports", "Other",
]
ProductCondition = Literal["Like New", "Good", "Fair", "Poor"]
ProductStatus = Literal["selling", "sold", "expired", "unpublished", "mystery-box"]
SustainabilityTag = Literal["Recyclable", "Upcycled"]


class ProductCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = ""
    price: float = Field(..., gt=0)
    category: ProductCategory = "Other"
    condition: ProductCondition = "Good"
    image: str = ""
    location: str = ""
    seller_name: str = ""
    sustainability_tag: SustainabilityTag | None = None


class ProductUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    price: float | None = None
    category: ProductCategory | None = None
    condition: ProductCondition | None = None
    image: str | None = None
    location: str | None = None
    seller_name: str | None = None
    status: ProductStatus | None = None
    sustainability_tag: SustainabilityTag | None = None


class ProductOut(BaseModel):
    id: str
    title: str
    description: str
    price: float
    category: str
    condition: str
    image: str
    location: str
    seller_name: str
    seller_account: str
    status: str
    likes: int
    created_at: str
    sustainability_tag: str | None = None
    in_mystery_box: bool = False
    mystery_box_invited: bool = False

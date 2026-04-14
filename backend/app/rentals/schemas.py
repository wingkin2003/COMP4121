from pydantic import BaseModel, Field
from typing import Literal

ProductCategory = Literal[
    "Electronics", "Furniture", "Fashion", "Books",
    "Appliances", "Toys", "Sports", "Other",
]
ProductCondition = Literal["Like New", "Good", "Fair", "Poor"]
RentalStatus = Literal["available", "rented", "returned", "unpublished"]
RentalRequestStatus = Literal["open", "matched", "closed"]
RentalOrderStatus = Literal["active", "returned", "overdue", "cancelled"]


# ── Rental Listing ──

class RentalCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = ""
    daily_price: float = Field(..., gt=0)
    deposit: float = Field(..., ge=0)
    min_days: int = Field(..., ge=1)
    max_days: int = Field(..., ge=1)
    category: ProductCategory = "Other"
    condition: ProductCondition = "Good"
    image: str = ""
    location: str = ""
    owner_name: str = ""


class RentalUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    daily_price: float | None = None
    deposit: float | None = None
    min_days: int | None = None
    max_days: int | None = None
    category: ProductCategory | None = None
    condition: ProductCondition | None = None
    image: str | None = None
    location: str | None = None
    owner_name: str | None = None
    status: RentalStatus | None = None


class RentalOut(BaseModel):
    id: str
    title: str
    description: str
    daily_price: float
    deposit: float
    min_days: int
    max_days: int
    category: str
    condition: str
    image: str
    location: str
    owner_name: str
    owner_account: str
    status: str
    likes: int
    created_at: str


# ── Rental Request ──

class RentalRequestCreate(BaseModel):
    title: str = Field(..., min_length=1)
    description: str = ""
    daily_budget: float = Field(..., gt=0)
    deposit: float = Field(..., ge=0)
    min_days: int = Field(..., ge=1)
    max_days: int = Field(..., ge=1)
    category: ProductCategory = "Other"
    condition: ProductCondition = "Good"
    image: str = ""
    location: str = ""
    requester_name: str = ""


class RentalRequestUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    daily_budget: float | None = None
    deposit: float | None = None
    min_days: int | None = None
    max_days: int | None = None
    category: ProductCategory | None = None
    condition: ProductCondition | None = None
    image: str | None = None
    location: str | None = None
    requester_name: str | None = None
    status: RentalRequestStatus | None = None


class RentalRequestOut(BaseModel):
    id: str
    title: str
    description: str
    daily_budget: float
    deposit: float
    min_days: int
    max_days: int
    category: str
    condition: str
    image: str
    location: str
    requester_name: str
    requester_account: str
    status: str
    created_at: str


# ── Rental Order (Booking) ──

class RentalOrderCreate(BaseModel):
    rental_id: str
    renter_name: str = ""
    days: int = Field(..., ge=1)
    start_date: str = ""
    pickup_time: str = ""
    phone: str = ""
    note: str = ""


class RentalOrderUpdate(BaseModel):
    status: RentalOrderStatus | None = None


class RentalOrderOut(BaseModel):
    id: str
    rental_id: str
    renter_account: str
    renter_name: str
    days: int
    rental_fee: float
    deposit: float
    commission: float
    total: float
    start_date: str
    end_date: str
    rental_title: str
    status: str
    created_at: str


# ── Rental Lending (offer for rental request) ──

class RentalLendingCreate(BaseModel):
    request_id: str
    lender_name: str = ""
    lender_phone: str = ""
    note: str = ""
    days: int = Field(..., ge=1)
    rental_fee: float = Field(..., ge=0)
    deposit: float = Field(..., ge=0)
    start_date: str = ""
    end_date: str = ""
    pickup_time: str = ""
    location: str = ""


class RentalLendingOut(BaseModel):
    id: str
    request_id: str
    request_title: str
    lender_account: str
    lender_name: str
    lender_phone: str
    note: str
    days: int
    rental_fee: float
    commission: float
    deposit: float
    total: float
    start_date: str
    end_date: str
    pickup_time: str
    location: str
    status: str
    created_at: str

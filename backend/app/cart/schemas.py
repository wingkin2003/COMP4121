from pydantic import BaseModel, Field


class CartItemAdd(BaseModel):
    product_id: str
    quantity: int = Field(1, ge=1)


class CartMysteryBoxAdd(BaseModel):
    tier: str


class CartRentalAdd(BaseModel):
    rental_id: str
    days: int = Field(..., ge=1)
    start_date: str = ""
    pickup_time: str = ""
    renter_name: str = ""
    renter_phone: str = ""
    renter_note: str = ""


class CartItemUpdate(BaseModel):
    quantity: int = Field(..., ge=0)


class CartItemOut(BaseModel):
    product_id: str
    quantity: int
    title: str = ""
    price: float = 0
    image: str = ""
    seller_name: str = ""
    type: str = "product"
    # mystery box fields
    tier: str = ""
    tier_label: str = ""
    # rental fields
    rental_id: str = ""
    days: int = 0
    daily_price: float = 0
    deposit: float = 0
    commission: float = 0
    rental_total: float = 0
    start_date: str = ""
    end_date: str = ""
    pickup_time: str = ""
    renter_name: str = ""
    renter_phone: str = ""
    renter_note: str = ""
    location: str = ""
    owner_name: str = ""


class CartOut(BaseModel):
    items: list[CartItemOut]
    subtotal: float

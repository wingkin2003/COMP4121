from fastapi import APIRouter, Depends, HTTPException, Query

from app.auth.dependencies import get_current_user
from app.rentals.schemas import (
    RentalCreate, RentalUpdate, RentalOut,
    RentalRequestCreate, RentalRequestUpdate, RentalRequestOut,
    RentalOrderCreate, RentalOrderUpdate, RentalOrderOut,
    RentalLendingCreate, RentalLendingOut,
)
from app.rentals.service import (
    create_rental, get_rentals, get_rental_by_id, update_rental,
    create_rental_request, get_rental_requests, get_rental_request_by_id, update_rental_request,
    create_rental_order, get_rental_orders, update_rental_order,
    create_rental_lending, get_rental_lendings,
)

router = APIRouter()


# ── helpers ──

def _rental_out(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "title": doc["title"],
        "description": doc.get("description", ""),
        "daily_price": doc["daily_price"],
        "deposit": doc.get("deposit", 0),
        "min_days": doc.get("min_days", 1),
        "max_days": doc.get("max_days", 7),
        "category": doc.get("category", "Other"),
        "condition": doc.get("condition", "Good"),
        "image": doc.get("image", ""),
        "location": doc.get("location", ""),
        "owner_name": doc.get("owner_name", ""),
        "owner_account": doc.get("owner_account", ""),
        "status": doc.get("status", "available"),
        "likes": doc.get("likes", 0),
        "created_at": doc.get("created_at", ""),
    }


def _request_out(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "title": doc["title"],
        "description": doc.get("description", ""),
        "daily_budget": doc["daily_budget"],
        "deposit": doc.get("deposit", 0),
        "min_days": doc.get("min_days", 1),
        "max_days": doc.get("max_days", 7),
        "category": doc.get("category", "Other"),
        "condition": doc.get("condition", "Good"),
        "image": doc.get("image", ""),
        "location": doc.get("location", ""),
        "requester_name": doc.get("requester_name", ""),
        "requester_account": doc.get("requester_account", ""),
        "status": doc.get("status", "open"),
        "created_at": doc.get("created_at", ""),
    }


def _order_out(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "rental_id": doc["rental_id"],
        "renter_account": doc.get("renter_account", ""),
        "renter_name": doc.get("renter_name", ""),
        "days": doc.get("days", 0),
        "rental_fee": doc.get("rental_fee", 0),
        "deposit": doc.get("deposit", 0),
        "commission": doc.get("commission", 0),
        "total": doc.get("total", 0),
        "start_date": doc.get("start_date", ""),
        "end_date": doc.get("end_date", ""),
        "rental_title": doc.get("rental_title", ""),
        "status": doc.get("status", "active"),
        "created_at": doc.get("created_at", ""),
    }


def _lending_out(doc: dict) -> dict:
    return {
        "id": doc["_id"],
        "request_id": doc["request_id"],
        "request_title": doc.get("request_title", ""),
        "lender_account": doc.get("lender_account", ""),
        "lender_name": doc.get("lender_name", ""),
        "lender_phone": doc.get("lender_phone", ""),
        "note": doc.get("note", ""),
        "days": doc.get("days", 0),
        "rental_fee": doc.get("rental_fee", 0),
        "commission": doc.get("commission", 0),
        "deposit": doc.get("deposit", 0),
        "total": doc.get("total", 0),
        "start_date": doc.get("start_date", ""),
        "end_date": doc.get("end_date", ""),
        "pickup_time": doc.get("pickup_time", ""),
        "location": doc.get("location", ""),
        "status": doc.get("status", "offered"),
        "created_at": doc.get("created_at", ""),
    }


# ── Rental Listings ──

@router.get("/rentals", response_model=list[RentalOut])
async def list_rentals(
    status: str | None = Query(None),
    q: str | None = Query(None),
    category: str | None = Query(None),
    condition: str | None = Query(None),
    sort: str = Query("newest"),
    owner_account: str | None = Query(None),
):
    docs = await get_rentals(
        status=status, q=q, category=category,
        condition=condition, sort=sort, owner_account=owner_account,
    )
    return [_rental_out(d) for d in docs]


@router.get("/rentals/{rental_id}", response_model=RentalOut)
async def get_rental(rental_id: str):
    doc = await get_rental_by_id(rental_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Rental not found")
    return _rental_out(doc)


@router.post("/rentals", response_model=RentalOut, status_code=201)
async def create_rental_endpoint(body: RentalCreate, user: dict = Depends(get_current_user)):
    doc = await create_rental(body.model_dump(), user["username"])
    return _rental_out(doc)


@router.patch("/rentals/{rental_id}", response_model=RentalOut)
async def update_rental_endpoint(
    rental_id: str, body: RentalUpdate, user: dict = Depends(get_current_user)
):
    doc = await get_rental_by_id(rental_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Rental not found")
    if doc["owner_account"] != user["username"]:
        raise HTTPException(status_code=403, detail="Not your rental")
    updated = await update_rental(rental_id, body.model_dump(exclude_none=True))
    return _rental_out(updated)


# ── Rental Requests ──

@router.get("/rental-requests", response_model=list[RentalRequestOut])
async def list_rental_requests(
    status: str | None = Query(None),
    q: str | None = Query(None),
    category: str | None = Query(None),
    condition: str | None = Query(None),
    sort: str = Query("newest"),
    requester_account: str | None = Query(None),
):
    docs = await get_rental_requests(
        status=status, q=q, category=category,
        condition=condition, sort=sort, requester_account=requester_account,
    )
    return [_request_out(d) for d in docs]


@router.post("/rental-requests", response_model=RentalRequestOut, status_code=201)
async def create_rental_request_endpoint(
    body: RentalRequestCreate, user: dict = Depends(get_current_user)
):
    doc = await create_rental_request(body.model_dump(), user["username"])
    return _request_out(doc)


@router.patch("/rental-requests/{request_id}", response_model=RentalRequestOut)
async def update_rental_request_endpoint(
    request_id: str, body: RentalRequestUpdate, user: dict = Depends(get_current_user)
):
    doc = await get_rental_request_by_id(request_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Rental request not found")
    if doc["requester_account"] != user["username"]:
        raise HTTPException(status_code=403, detail="Not your request")
    updated = await update_rental_request(request_id, body.model_dump(exclude_none=True))
    return _request_out(updated)


# ── Rental Orders ──

@router.post("/rental-orders", response_model=RentalOrderOut, status_code=201)
async def create_rental_order_endpoint(
    body: RentalOrderCreate, user: dict = Depends(get_current_user)
):
    rental = await get_rental_by_id(body.rental_id)
    if not rental:
        raise HTTPException(status_code=404, detail="Rental not found")
    if rental["owner_account"] == user["username"]:
        raise HTTPException(status_code=400, detail="Cannot book your own rental")
    try:
        doc = await create_rental_order(body.model_dump(), user["username"])
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _order_out(doc)


@router.get("/rental-orders", response_model=list[RentalOrderOut])
async def list_rental_orders(user: dict = Depends(get_current_user)):
    docs = await get_rental_orders(renter_account=user["username"])
    return [_order_out(d) for d in docs]


@router.patch("/rental-orders/{order_id}", response_model=RentalOrderOut)
async def update_rental_order_endpoint(
    order_id: str, body: RentalOrderUpdate, user: dict = Depends(get_current_user)
):
    updated = await update_rental_order(order_id, body.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Rental order not found")
    return _order_out(updated)


# ── Rental Lendings ──

@router.post("/rental-lendings", response_model=RentalLendingOut, status_code=201)
async def create_rental_lending_endpoint(
    body: RentalLendingCreate, user: dict = Depends(get_current_user)
):
    request_doc = await get_rental_request_by_id(body.request_id)
    if not request_doc:
        raise HTTPException(status_code=404, detail="Rental request not found")
    doc = await create_rental_lending(body.model_dump(), user["username"])
    return _lending_out(doc)


@router.get("/rental-lendings", response_model=list[RentalLendingOut])
async def list_rental_lendings(user: dict = Depends(get_current_user)):
    docs = await get_rental_lendings(lender_account=user["username"])
    return [_lending_out(d) for d in docs]

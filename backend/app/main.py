from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database import connect_db, close_db
from app.auth.router import router as auth_router
from app.products.router import router as products_router
from app.buy_orders.router import router as buy_orders_router
from app.rentals.router import router as rentals_router
from app.cart.router import router as cart_router
from app.orders.router import router as orders_router
from app.mystery_box.router import router as mystery_box_router
from app.comments.router import router as comments_router
from app.uploads.router import router as uploads_router

import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()


app = FastAPI(title="SecondLife API", version="1.0.0", lifespan=lifespan)

# CORS: allow localhost for dev + production origins from env var
_default_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
_extra = os.environ.get("CORS_ORIGINS", "")
if _extra:
    _default_origins += [o.strip() for o in _extra.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_default_origins,
    # Allow GitHub Codespaces forwarded frontend URLs like
    # https://<name>-3000.app.github.dev and githubpreview.dev.
    allow_origin_regex=r"https://.*-3000\.app\.github(\.dev|preview\.dev)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded images
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Routers
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])
app.include_router(products_router, prefix="/api/products", tags=["Products"])
app.include_router(buy_orders_router, prefix="/api/buy-orders", tags=["Buy Orders"])
app.include_router(rentals_router, prefix="/api", tags=["Rentals"])
app.include_router(cart_router, prefix="/api/cart", tags=["Cart"])
app.include_router(orders_router, prefix="/api/orders", tags=["Orders"])
app.include_router(mystery_box_router, prefix="/api/mystery-box", tags=["Mystery Box"])
app.include_router(comments_router, prefix="/api/products", tags=["Comments"])
app.include_router(uploads_router, prefix="/api/uploads", tags=["Uploads"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}

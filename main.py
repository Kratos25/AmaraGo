"""
AmaraGo — FastAPI application entry point.

Start:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from dotenv import load_dotenv

from routers import auth, users, categories, services, packages, coupons, addresses, bookings, providers, admin, cart, loyalty, wishlist, payments

load_dotenv()

# ── Rate Limiter ──────────────────────────────────────────────────────────────

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AmaraGo API",
    description="Backend for the AmaraGo beauty & wellness booking platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ──────────────────────────────────────────────────────────────────────

_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Guest-Id"],
)

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(categories.router)
app.include_router(services.router)
app.include_router(packages.router)
app.include_router(coupons.router)
app.include_router(addresses.router)
app.include_router(bookings.router)
app.include_router(providers.router)
app.include_router(admin.router)
app.include_router(cart.router)
app.include_router(loyalty.router)
app.include_router(wishlist.router)
app.include_router(payments.router)

# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "AmaraGo API"}
"""
AmaraGo — FastAPI application entry point.

Start:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import auth, users, categories, services, packages, coupons, addresses, bookings, providers, admin

load_dotenv()

# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="AmaraGo API",
    description="Backend for the AmaraGo beauty & wellness booking platform.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────

_raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
ALLOWED_ORIGINS: list[str] = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "ok", "service": "AmaraGo API"}

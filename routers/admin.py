"""
Admin dashboard router  —  GET /admin/dashboard
                           GET /admin/clients       (list all clients)
                           GET /admin/providers     (alias — see providers router)

Returns aggregated KPIs the admin dashboard page currently hard-codes.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from firebase_config import get_db
from dependencies.auth import CurrentUser, require_role
from schemas.user import UserResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Dashboard KPIs ────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    active_providers: int = 0
    verified_clients: int = 0
    total_bookings: int = 0
    completed_bookings: int = 0
    pending_bookings: int = 0
    total_revenue: float = 0.0
    pending_provider_approvals: int = 0


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()

    # Count providers
    all_providers = db.collection("provider_profiles").stream()
    active_providers = 0
    pending_approvals = 0
    for doc in all_providers:
        d = doc.to_dict()
        if d.get("is_approved"):
            active_providers += 1
        else:
            pending_approvals += 1

    # Count clients
    client_docs = (
        db.collection("users").where("role", "==", "client").stream()
    )
    verified_clients = sum(1 for _ in client_docs)

    # Booking stats
    booking_docs = db.collection("bookings").stream()
    total_bookings = 0
    completed = 0
    pending = 0
    revenue = 0.0
    for doc in booking_docs:
        total_bookings += 1
        d = doc.to_dict()
        s = d.get("status", "")
        if s == "completed":
            completed += 1
            revenue += d.get("total_price", 0)
        elif s == "pending":
            pending += 1

    return DashboardStats(
        active_providers=active_providers,
        verified_clients=verified_clients,
        total_bookings=total_bookings,
        completed_bookings=completed,
        pending_bookings=pending,
        total_revenue=round(revenue, 2),
        pending_provider_approvals=pending_approvals,
    )


# ── List all clients ──────────────────────────────────────────────────────────

@router.get("/clients", response_model=list[UserResponse])
async def list_clients(
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    docs = db.collection("users").where("role", "==", "client").stream()
    results = []
    for doc in docs:
        d = doc.to_dict()
        results.append(UserResponse(
            uid=doc.id,
            name=d.get("name", ""),
            email=d.get("email"),
            phone=d.get("phone"),
            role=d.get("role", "client"),
            profile_image=d.get("profile_image"),
            created_at=d.get("created_at"),
        ))
    return results

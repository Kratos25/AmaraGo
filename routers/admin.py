"""
Admin dashboard router  —  GET /admin/dashboard
                           GET /admin/clients       (list all clients)
                           GET /admin/clients/{uid} (client profile)
                           GET /admin/clients/{uid}/bookings
                           GET /admin/notifications
"""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any, List

from firebase_config import get_db
from dependencies.auth import CurrentUser, require_role
from schemas.user import UserResponse
from schemas.booking import BookingResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


# ── Dashboard KPIs ────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    active_providers: int = 0
    verified_clients: int = 0
    total_bookings: int = 0
    completed_bookings: int = 0
    pending_bookings: int = 0
    active_bookings: int = 0
    total_revenue: float = 0.0
    pending_provider_approvals: int = 0
    # Weekly breakdown (last 7 calendar days, oldest → newest)
    weekly_revenue: List[float] = []
    weekly_bookings: List[int] = []
    weekly_labels: List[str] = []
    # Platform health (0–100)
    booking_completion_rate: float = 0.0
    provider_fill_rate: float = 0.0


@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard(
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    now = datetime.now(timezone.utc)

    # ── Providers ────────────────────────────────────────────────────────────
    active_providers = 0
    pending_approvals = 0
    for doc in db.collection("provider_profiles").stream():
        d = doc.to_dict()
        if d.get("is_approved"):
            active_providers += 1
        else:
            pending_approvals += 1

    # ── Clients ──────────────────────────────────────────────────────────────
    verified_clients = sum(
        1 for _ in db.collection("users").where("role", "==", "client").stream()
    )

    # ── Bookings (single pass — weekly + health metrics) ─────────────────────
    weekly_revenue  = [0.0] * 7
    weekly_bookings = [0]   * 7
    weekly_labels   = [
        (now - timedelta(days=i)).strftime("%a") for i in range(6, -1, -1)
    ]

    total_bookings = 0
    completed      = 0
    pending        = 0
    active         = 0
    revenue        = 0.0
    assigned       = 0   # bookings with a provider assigned

    for doc in db.collection("bookings").stream():
        total_bookings += 1
        d = doc.to_dict()
        s = d.get("status", "")

        if s == "completed":
            completed += 1
            revenue += float(d.get("total_price", 0))
        elif s == "pending":
            pending += 1
        elif s in ("confirmed", "active"):
            active += 1

        if d.get("provider_id"):
            assigned += 1

        # Weekly grouping by created_at
        created_raw = d.get("created_at", "")
        if created_raw:
            try:
                created = datetime.fromisoformat(
                    str(created_raw).replace("Z", "+00:00")
                )
                days_ago = (now.date() - created.date()).days
                if 0 <= days_ago <= 6:
                    idx = 6 - days_ago
                    weekly_bookings[idx] += 1
                    if s == "completed":
                        weekly_revenue[idx] += float(d.get("total_price", 0))
            except (ValueError, TypeError, AttributeError):
                pass

    booking_completion_rate = (
        round(completed / total_bookings * 100, 1) if total_bookings else 0.0
    )
    provider_fill_rate = (
        round(assigned / total_bookings * 100, 1) if total_bookings else 0.0
    )

    return DashboardStats(
        active_providers=active_providers,
        verified_clients=verified_clients,
        total_bookings=total_bookings,
        completed_bookings=completed,
        pending_bookings=pending,
        active_bookings=active,
        total_revenue=round(revenue, 2),
        pending_provider_approvals=pending_approvals,
        weekly_revenue=[round(x, 2) for x in weekly_revenue],
        weekly_bookings=weekly_bookings,
        weekly_labels=weekly_labels,
        booking_completion_rate=booking_completion_rate,
        provider_fill_rate=provider_fill_rate,
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


# ── Single client profile ─────────────────────────────────────────────────────

@router.get("/clients/{client_uid}", response_model=UserResponse)
async def get_client(
    client_uid: str,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    doc = db.collection("users").document(client_uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Client not found.")
    d = doc.to_dict()
    if d.get("role") != "client":
        raise HTTPException(status_code=404, detail="Client not found.")
    return UserResponse(
        uid=doc.id,
        name=d.get("name", ""),
        email=d.get("email"),
        phone=d.get("phone"),
        role=d.get("role", "client"),
        profile_image=d.get("profile_image"),
        created_at=d.get("created_at"),
    )


# ── Client bookings ───────────────────────────────────────────────────────────

CONVENIENCE_FEE_DEFAULT = 99.0


def _booking_dict_to_response(doc) -> BookingResponse:
    d = doc.to_dict()
    return BookingResponse(
        id=doc.id,
        client_id=d.get("client_id", ""),
        provider_id=d.get("provider_id"),
        service_id=d.get("service_id"),
        package_id=d.get("package_id"),
        service_name=d.get("service_name"),
        date=d.get("date", ""),
        time=d.get("time", ""),
        address=d.get("address", ""),
        payment_method=d.get("payment_method", ""),
        coupon_code=d.get("coupon_code"),
        base_price=d.get("base_price", 0),
        discount_amount=d.get("discount_amount", 0),
        convenience_fee=d.get("convenience_fee", CONVENIENCE_FEE_DEFAULT),
        total_price=d.get("total_price", 0),
        status=d.get("status", "pending"),
        notes=d.get("notes"),
        created_at=d.get("created_at"),
        client_name=d.get("client_name"),
        provider_name=d.get("provider_name"),
        client_phone=d.get("client_phone"),
    )


@router.get("/clients/{client_uid}/bookings", response_model=list[BookingResponse])
async def get_client_bookings(
    client_uid: str,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    docs = (
        db.collection("bookings")
        .where("client_id", "==", client_uid)
        .order_by("created_at", direction="DESCENDING")
        .stream()
    )
    return [_booking_dict_to_response(doc) for doc in docs]


# ── Notifications ─────────────────────────────────────────────────────────────

class Notification(BaseModel):
    id: str
    type: str          # "new_booking" | "pending_approval"
    title: str
    message: str
    reference_id: str
    created_at: Any


@router.get("/notifications", response_model=list[Notification])
async def get_notifications(
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    notifications: list[Notification] = []

    # New / unassigned bookings (pending status = needs provider)
    # Note: order_by + where on different fields requires a composite index,
    # so we fetch and sort in Python instead.
    pending_bookings = (
        db.collection("bookings")
        .where("status", "==", "pending")
        .limit(20)
        .stream()
    )
    for doc in pending_bookings:
        d = doc.to_dict()
        notifications.append(Notification(
            id=f"booking_{doc.id}",
            type="new_booking",
            title="New Booking",
            message=f"{d.get('client_name', 'A client')} booked {d.get('service_name', 'a service')} for {d.get('date', '')}",
            reference_id=doc.id,
            created_at=d.get("created_at"),
        ))

    # Providers awaiting approval
    pending_providers = (
        db.collection("provider_profiles")
        .where("is_approved", "==", False)
        .stream()
    )
    for doc in pending_providers:
        user_doc = db.collection("users").document(doc.id).get()
        name = user_doc.to_dict().get("name", "A provider") if user_doc.exists else "A provider"
        created_at = user_doc.to_dict().get("created_at") if user_doc.exists else None
        notifications.append(Notification(
            id=f"provider_{doc.id}",
            type="pending_approval",
            title="Provider Approval Pending",
            message=f"{name} has applied to join as a service provider",
            reference_id=doc.id,
            created_at=created_at,
        ))

    # Sort newest-first in Python (avoids composite index requirement)
    notifications.sort(
        key=lambda n: (n.created_at.isoformat() if hasattr(n.created_at, "isoformat") else str(n.created_at or "")),
        reverse=True,
    )
    return notifications

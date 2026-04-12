"""
Admin dashboard router  —  GET /admin/dashboard
                           GET /admin/clients       (list all clients)
                           GET /admin/clients/{uid} (client profile)
                           GET /admin/clients/{uid}/bookings
                           GET /admin/notifications
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Any

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
    pending_bookings = (
        db.collection("bookings")
        .where("status", "==", "pending")
        .order_by("created_at", direction="DESCENDING")
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

    return notifications

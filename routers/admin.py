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
from typing import Any, List, Optional

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

    # HIGH-02: Read KPI totals from _stats/platform counter doc
    stats_doc = db.collection("_stats").document("platform").get()
    stats_data = stats_doc.to_dict() if stats_doc.exists else {}
    total_bookings = int(stats_data.get("total_bookings", 0))
    completed      = int(stats_data.get("completed_bookings", 0))
    pending        = int(stats_data.get("pending_bookings", 0))
    active         = int(stats_data.get("active_bookings", 0))
    revenue        = float(stats_data.get("total_revenue", 0.0))

    # HIGH-02: Weekly breakdown — only scan last 7 days
    weekly_revenue  = [0.0] * 7
    weekly_bookings = [0]   * 7
    weekly_labels   = [
        (now - timedelta(days=i)).strftime("%a") for i in range(6, -1, -1)
    ]
    weekly_assigned = 0
    weekly_total    = 0

    seven_days_ago_iso = (now - timedelta(days=6)).replace(
        hour=0, minute=0, second=0, microsecond=0
    ).isoformat()

    for doc in db.collection("bookings").where("created_at", ">=", seven_days_ago_iso).stream():
        d = doc.to_dict()
        weekly_total += 1
        s = d.get("status", "")
        if d.get("provider_id"):
            weekly_assigned += 1
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
        round(weekly_assigned / weekly_total * 100, 1) if weekly_total else 0.0
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


# ── Enriched client stats (with booking aggregates) ────────────────────────────

class ClientStats(BaseModel):
    uid: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    created_at: Optional[str] = None
    total_bookings: int = 0
    completed_bookings: int = 0
    cancelled_bookings: int = 0
    total_spend: float = 0.0
    avg_booking_value: float = 0.0
    favorite_service: Optional[str] = None
    last_booking_date: Optional[str] = None
    is_vip: bool = False


ClientStats.model_rebuild()


@router.get("/clients-stats", response_model=List[ClientStats])
async def list_clients_stats(
    _admin: CurrentUser = Depends(require_role("admin")),
):
    """Returns all clients enriched with real booking aggregates in ONE call."""
    db = get_db()

    # 1. Load all clients
    client_map: dict[str, dict] = {}
    for doc in db.collection("users").where("role", "==", "client").stream():
        client_map[doc.id] = doc.to_dict()

    # 2. Aggregate bookings per client in a single Firestore scan
    totals: dict[str, dict] = {}
    for booking_doc in db.collection("bookings").stream():
        d = booking_doc.to_dict()
        cid = d.get("client_id", "")
        if cid not in client_map:
            continue
        if cid not in totals:
            totals[cid] = {
                "total": 0, "completed": 0, "cancelled": 0,
                "spend": 0.0, "services": {}, "last_date": "",
            }
        t = totals[cid]
        t["total"] += 1
        status = d.get("status", "")
        if status == "completed":
            t["completed"] += 1
            t["spend"] += float(d.get("total_price", 0))
        if status == "cancelled":
            t["cancelled"] += 1
        # Track favourite service
        svc = d.get("service_name") or ""
        if svc:
            t["services"][svc] = t["services"].get(svc, 0) + 1
        # Latest booking date
        bdate = d.get("date", "")
        if bdate and bdate > t["last_date"]:
            t["last_date"] = bdate

    # 3. Build response
    VIP_THRESHOLD = 20000.0
    results: list[ClientStats] = []
    for uid, c in client_map.items():
        t = totals.get(uid, {})
        total = t.get("total", 0)
        completed = t.get("completed", 0)
        spend = t.get("spend", 0.0)
        avg = round(spend / completed, 2) if completed else 0.0
        services = t.get("services", {})
        fav = max(services, key=services.get, default=None) if services else None
        results.append(ClientStats(
            uid=uid,
            name=c.get("name", ""),
            email=c.get("email"),
            phone=c.get("phone"),
            profile_image=c.get("profile_image"),
            created_at=c.get("created_at").isoformat() if hasattr(c.get("created_at"), "isoformat") else (str(c.get("created_at")) if c.get("created_at") else None),
            total_bookings=total,
            completed_bookings=completed,
            cancelled_bookings=t.get("cancelled", 0),
            total_spend=spend,
            avg_booking_value=avg,
            favorite_service=fav,
            last_booking_date=t.get("last_date") or None,
            is_vip=spend >= VIP_THRESHOLD,
        ))

    # Sort by total_spend desc
    results.sort(key=lambda x: x.total_spend, reverse=True)
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
        .stream()
    )
    results = [_booking_dict_to_response(doc) for doc in docs]
    results.sort(key=lambda b: b.created_at or "", reverse=True)
    return results


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

    # HIGH-07: Read stored notifications for admin from the notifications collection
    stored_docs = (
        db.collection("notifications")
        .where("user_id", "==", "admin")
        .limit(50)
        .stream()
    )
    for doc in stored_docs:
        d = doc.to_dict()
        notifications.append(Notification(
            id=doc.id,
            type=d.get("type", "new_booking"),
            title=d.get("title", ""),
            message=d.get("message", ""),
            reference_id=d.get("reference_id", ""),
            created_at=d.get("created_at"),
        ))

    # Dynamic: pending provider approvals (these aren't written as stored notifications yet)
    existing_ids = {n.id for n in notifications}
    pending_providers = (
        db.collection("provider_profiles")
        .where("is_approved", "==", False)
        .stream()
    )
    for doc in pending_providers:
        notif_id = f"provider_{doc.id}"
        if notif_id in existing_ids:
            continue
        user_doc = db.collection("users").document(doc.id).get()
        name = user_doc.to_dict().get("name", "A provider") if user_doc.exists else "A provider"
        created_at = user_doc.to_dict().get("created_at") if user_doc.exists else None
        notifications.append(Notification(
            id=notif_id,
            type="pending_approval",
            title="Provider Approval Pending",
            message=f"{name} has applied to join as a service provider",
            reference_id=doc.id,
            created_at=created_at,
        ))

    # Sort newest-first in Python
    notifications.sort(
        key=lambda n: (n.created_at.isoformat() if hasattr(n.created_at, "isoformat") else str(n.created_at or "")),
        reverse=True,
    )
    return notifications


# ── Platform Config ───────────────────────────────────────────────────────────

_CONFIG_DOC = "_config/platform"
_CONFIG_DEFAULTS = {
    "convenience_fee": 99.0,
    "original_convenience_fee": 99.0,   # shown as strikethrough when fee is 0
    "commission_rate_default": 15.0,
}


class PlatformConfig(BaseModel):
    convenience_fee: float = 99.0
    original_convenience_fee: float = 99.0
    commission_rate_default: float = 15.0


class UpdatePlatformConfig(BaseModel):
    convenience_fee: float | None = None
    original_convenience_fee: float | None = None
    commission_rate_default: float | None = None


@router.get("/config", response_model=PlatformConfig)
async def get_platform_config(
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    doc = db.document(_CONFIG_DOC).get()
    data = {**_CONFIG_DEFAULTS, **(doc.to_dict() if doc.exists else {})}
    return PlatformConfig(**data)


@router.put("/config", response_model=PlatformConfig)
async def update_platform_config(
    body: UpdatePlatformConfig,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    updates: dict = {}
    if body.convenience_fee is not None:
        if body.convenience_fee < 0:
            raise HTTPException(status_code=422, detail="convenience_fee cannot be negative.")
        updates["convenience_fee"] = body.convenience_fee
    if body.original_convenience_fee is not None:
        if body.original_convenience_fee < 0:
            raise HTTPException(status_code=422, detail="original_convenience_fee cannot be negative.")
        updates["original_convenience_fee"] = body.original_convenience_fee
    if body.commission_rate_default is not None:
        if not (0 <= body.commission_rate_default <= 100):
            raise HTTPException(status_code=422, detail="commission_rate_default must be 0–100.")
        updates["commission_rate_default"] = body.commission_rate_default

    if updates:
        db.document(_CONFIG_DOC).set(updates, merge=True)

    doc = db.document(_CONFIG_DOC).get()
    data = {**_CONFIG_DEFAULTS, **(doc.to_dict() if doc.exists else {})}
    return PlatformConfig(**data)


# ── Public config (no auth — used by checkout page) ──────────────────────────

@router.get("/config/public")
async def get_public_config():
    """Returns only the fields the client frontend needs (no auth required)."""
    db = get_db()
    doc = db.document(_CONFIG_DOC).get()
    data = {**_CONFIG_DEFAULTS, **(doc.to_dict() if doc.exists else {})}
    return {
        "convenience_fee": data["convenience_fee"],
        "original_convenience_fee": data["original_convenience_fee"],
    }

""""Bookings router  —  POST   /bookings/multi              (client — single booking for all cart items)
                    POST   /bookings                    (client — legacy single item)
                    GET    /bookings                    (client: own | admin: all)
                    GET    /bookings/{id}
                    PUT    /bookings/{id}/assign         (admin: assign provider)
                    PUT    /bookings/{id}/status         (admin or provider)
                    DELETE /bookings/{id}                (client cancel — only if pending)
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from google.api_core.exceptions import FailedPrecondition
from google.cloud import firestore as gc_firestore
from pydantic import BaseModel

from firebase_admin.firestore import Increment
from firebase_config import get_db
from dependencies.auth import CurrentUser, get_current_user, require_role
from schemas.booking import (
    AssignProviderRequest,
    BookingItem,
    BookingResponse,
    CreateBookingRequest,
    CreateMultiBookingRequest,
    ReviewDetail,
    SubmitReviewRequest,
    UpdateBookingRequest,
    UpdateBookingStatusRequest,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])

_CONFIG_DOC = "_config/platform"
_DEFAULT_CONVENIENCE_FEE = 99.0


def _get_convenience_fee(db) -> float:
    """Read convenience_fee from Firestore config; fall back to 99 if not set."""
    try:
        doc = db.document(_CONFIG_DOC).get()
        if doc.exists:
            return float(doc.to_dict().get("convenience_fee", _DEFAULT_CONVENIENCE_FEE))
    except Exception:
        pass
    return _DEFAULT_CONVENIENCE_FEE


# ── Paginated response model ───────────────────────────────────────────────────

class PaginatedBookings(BaseModel):
    items: list[BookingResponse]
    next_cursor: Optional[str] = None


# ── Platform stats helper (HIGH-02) ───────────────────────────────────────────

def _update_platform_stats(
    db,
    old_status: str,
    new_status: str,
    revenue_delta: float = 0.0,
) -> None:
    """Atomically update _stats/platform counter doc for a booking status transition."""
    updates: dict = {}
    if old_status == "pending":
        updates["pending_bookings"] = Increment(-1)
    elif old_status in ("confirmed", "active"):
        updates["active_bookings"] = Increment(-1)

    if new_status == "pending":
        updates["pending_bookings"] = Increment(1)
    elif new_status in ("confirmed", "active"):
        updates["active_bookings"] = Increment(1)
    elif new_status == "completed":
        updates["completed_bookings"] = Increment(1)
        if revenue_delta > 0:
            updates["total_revenue"] = Increment(revenue_delta)
    elif new_status == "cancelled":
        updates["cancelled_bookings"] = Increment(1)

    if updates:
        db.collection("_stats").document("platform").set(updates, merge=True)


# ── Notification writer (HIGH-07) ─────────────────────────────────────────────

def _write_notification(
    db,
    user_id: str,
    notif_type: str,
    title: str,
    message: str,
    reference_id: str,
) -> None:
    """Persist a notification document to the notifications collection."""
    try:
        db.collection("notifications").document().set({
            "user_id": user_id,
            "type": notif_type,
            "title": title,
            "message": message,
            "reference_id": reference_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_read": False,
        })
    except Exception:
        pass  # Notification failure must never break the primary operation


# ── City extraction ───────────────────────────────────────────────────────────

def _extract_city(location: str) -> str:
    """Extract city from 'Area, City' or plain 'City' — lowercased."""
    if not location:
        return ""
    parts = location.rsplit(",", 1)
    return parts[-1].strip().lower()


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Great-circle distance in kilometres between two lat/lng points."""
    import math
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ── Notify eligible providers in the booking city ────────────────────────────

def _notify_eligible_providers(
    db,
    booking_id: str,
    booking_city: str,
    service_names: list[str],
    client_name: str,
    client_id: str,
    date: str,
    booking_lat: float | None = None,
    booking_lng: float | None = None,
) -> list[str]:
    """Find approved providers who serve the booking location and offer at least
    one of `service_names`, notify each, record UIDs in `offered_to`.

    Matching strategy (in priority order):
      1. Radius  — if booking has lat/lng AND provider has lat/lng:
                   provider's `service_radius_km` determines the circle.
      2. City    — fallback string match on the last segment of the
                   location field (e.g. "Bandra, Mumbai" → "mumbai").

    If no eligible providers are found the client is notified immediately.
    """
    try:
        prov_docs = (
            db.collection("provider_profiles")
            .where("is_approved", "==", True)
            .stream()
        )

        use_geo = booking_lat is not None and booking_lng is not None
        target_services = {s.strip().lower() for s in service_names if s}

        eligible: list[str] = []
        for prov in prov_docs:
            prov_data = prov.to_dict()

            # ── Service filter (always applied) ──────────────────────────────
            prov_services = {
                s.strip().lower()
                for s in prov_data.get("services_offered", [])
                if s
            }
            if not prov_services.intersection(target_services):
                continue

            # ── Location filter ───────────────────────────────────────────────
            prov_lat = prov_data.get("latitude")
            prov_lng = prov_data.get("longitude")

            if use_geo and prov_lat is not None and prov_lng is not None:
                radius_km = float(prov_data.get("service_radius_km", 15.0))
                dist = _haversine_km(booking_lat, booking_lng, prov_lat, prov_lng)
                if dist > radius_km:
                    continue
            else:
                # Fallback: city-string match
                prov_city = _extract_city(prov_data.get("location", ""))
                if prov_city != booking_city.lower():
                    continue

            eligible.append(prov.id)
            display_name = (
                " & ".join(service_names) if len(service_names) <= 2
                else f"{service_names[0]} + {len(service_names) - 1} more"
            )
            _write_notification(
                db, prov.id, "job_offer",
                "New Job Available 🛎️",
                f"{display_name} for {client_name} on {date} — tap to accept or decline",
                booking_id,
            )

        if eligible:
            db.collection("bookings").document(booking_id).update(
                {"offered_to": eligible}
            )
        else:
            db.collection("bookings").document(booking_id).update(
                {"no_providers_in_area": True}
            )
            _write_notification(
                db, client_id, "no_providers",
                "We're on it! 🔍",
                "No provider is available in your area right now. Our team is working on it and will assign one for you soon.",
                booking_id,
            )

        return eligible
    except Exception:
        return []  # Never block the booking creation


# ── Booking reference ID (AG0001 … AG9999 … AG10000 …) ────────────────────

def _generate_booking_ref(db) -> str:
    """Atomically increment a counter and return a human-friendly booking ref."""
    counter_ref = db.collection("_counters").document("bookings")

    @gc_firestore.transactional
    def _txn(transaction):
        snap = counter_ref.get(transaction=transaction)
        n = (snap.to_dict() or {}).get("count", 0) + 1
        transaction.set(counter_ref, {"count": n})
        return n

    transaction = db.transaction()
    n = _txn(transaction)
    # AG0001 … AG9999, then AG10000 (pad to at least 4 digits)
    return f"AG{n:04d}"


# ── helpers ───────────────────────────────────────────────────────────────────

def _resolve_address(db, address_id: Optional[str], address_text: Optional[str], client_uid: str) -> str:
    if address_id:
        doc = db.collection("addresses").document(address_id).get()
        if doc.exists and doc.to_dict().get("client_id") == client_uid:
            return doc.to_dict()["address"]
    if address_text:
        return address_text
    raise HTTPException(status_code=400, detail="Provide either address_id or address_text.")


def _get_service_price(db, service_id: Optional[str], package_id: Optional[str]) -> tuple[float, str]:
    """Return (base_price, service_name)."""
    if service_id:
        doc = db.collection("services").document(service_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Service not found.")
        d = doc.to_dict()
        price = d.get("discounted_price") or d.get("base_price", 0)
        return float(price), d.get("name", "")
    if package_id:
        doc = db.collection("packages").document(package_id).get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Package not found.")
        d = doc.to_dict()
        return float(d.get("price", 0)), d.get("name", "")
    raise HTTPException(status_code=400, detail="Provide either service_id or package_id.")


def _apply_coupon(db, code: Optional[str], base_price: float, client_id: Optional[str] = None) -> float:
    """Return discount amount (0 if code is invalid or expired)."""
    if not code:
        return 0.0
    docs = db.collection("coupons").where("code", "==", code.upper()).get()
    if not docs:
        return 0.0
    c = docs[0].to_dict()
    if not c.get("active"):
        return 0.0
    if c.get("used_count", 0) >= c.get("usage_limit", 1):
        return 0.0
    if base_price < c.get("min_order", 0):
        return 0.0
    # ── Date range validation ────────────────────────────────────────────────
    today = datetime.now(timezone.utc).date().isoformat()
    valid_from = c.get("valid_from", "")
    valid_to = c.get("valid_to", "")
    if valid_from and today < valid_from:
        return 0.0
    if valid_to and today > valid_to:
        return 0.0
    # ── applicable_for check ────────────────────────────────────────────────
    applicable_for = c.get("applicable_for", "all")
    if applicable_for == "new_users" and client_id:
        existing = db.collection("bookings").where("client_id", "==", client_id).limit(1).get()
        if existing:  # already has a booking → not a new user
            return 0.0
    elif applicable_for == "returning" and client_id:
        existing = db.collection("bookings").where("client_id", "==", client_id).limit(1).get()
        if not existing:  # no prior bookings → not a returning user
            return 0.0
    if c["type"] == "percentage":
        discount = round(base_price * c["value"] / 100, 2)
        if c.get("max_discount"):
            discount = min(discount, c["max_discount"])
    else:
        discount = min(c["value"], base_price)
    return discount


def _doc_to_booking(doc) -> BookingResponse:
    d = doc.to_dict()
    raw_items = d.get("items")
    items = [BookingItem(**i) for i in raw_items] if raw_items else None
    return BookingResponse(
        id=doc.id,
        booking_ref=d.get("booking_ref"),
        items=items,
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
        convenience_fee=d.get("convenience_fee", _DEFAULT_CONVENIENCE_FEE),
        total_price=d.get("total_price", 0),
        status=d.get("status", "pending"),
        notes=d.get("notes"),
        created_at=d.get("created_at"),
        client_name=d.get("client_name"),
        provider_name=d.get("provider_name"),
        client_phone=d.get("client_phone"),
        offered_to=d.get("offered_to", []),
        rejected_by=d.get("rejected_by", []),
        no_providers_in_area=d.get("no_providers_in_area", False),
        latitude=d.get("latitude"),
        longitude=d.get("longitude"),
        client_review=ReviewDetail(**d["client_review"]) if d.get("client_review") else None,
        provider_review=ReviewDetail(**d["provider_review"]) if d.get("provider_review") else None,
    )


# ── Create multi-item booking (single booking for full cart) ─────────────────

@router.post("/multi", response_model=BookingResponse, status_code=201)
async def create_multi_booking(
    body: CreateMultiBookingRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create ONE booking containing all cart items.  Returns a human-friendly AG#### booking ref."""
    if current_user.role not in ("client", "admin"):
        raise HTTPException(status_code=403, detail="Only clients can create bookings.")

    db = get_db()

    address = _resolve_address(db, body.address_id, body.address_text, current_user.uid)

    # Build item list with resolved prices
    resolved_items: list[dict] = []
    base_total = 0.0
    service_ids: list[str] = []
    package_ids: list[str] = []

    for cart_item in body.items:
        try:
            server_price, server_name = _get_service_price(db, cart_item.service_id, cart_item.package_id)
        except HTTPException:
            server_price = cart_item.unit_price
            server_name  = cart_item.name

        line_total = round(server_price * cart_item.quantity, 2)
        base_total += line_total
        resolved_items.append({
            "service_id":  cart_item.service_id,
            "package_id":  cart_item.package_id,
            "name":        server_name or cart_item.name,
            "unit_price":  server_price,
            "quantity":    cart_item.quantity,
        })
        if cart_item.service_id:
            service_ids.append(cart_item.service_id)
        if cart_item.package_id:
            package_ids.append(cart_item.package_id)

    discount = _apply_coupon(db, body.coupon_code, base_total, current_user.uid)
    convenience_fee = _get_convenience_fee(db)
    total    = round(base_total - discount + convenience_fee, 2)

    # Build human-readable summary name
    names = [i["name"] for i in resolved_items]
    if len(names) == 1:
        summary_name = names[0]
    elif len(names) == 2:
        summary_name = f"{names[0]} & {names[1]}"
    else:
        summary_name = f"{names[0]} + {len(names) - 1} more"

    user_doc  = db.collection("users").document(current_user.uid).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}

    booking_ref = _generate_booking_ref(db)
    now = datetime.now(timezone.utc).isoformat()

    ref = db.collection("bookings").document()
    ref.set({
        "booking_ref":    booking_ref,
        "items":          resolved_items,
        "client_id":      current_user.uid,
        "client_name":    user_data.get("name", ""),
        "client_phone":   user_data.get("phone", ""),
        "provider_id":    None,
        "provider_name":  None,
        "service_id":     service_ids[0] if len(service_ids) == 1 else None,
        "package_id":     package_ids[0] if len(package_ids) == 1 else None,
        "service_name":   summary_name,
        "date":           body.date,
        "time":           body.time,
        "address":        address,
        "payment_method": body.payment_method,
        "coupon_code":    body.coupon_code,
        "base_price":     base_total,
        "discount_amount": discount,
        "convenience_fee": convenience_fee,
        "total_price":    total,
        "status":         "pending",
        "notes":          body.notes,
        "created_at":     now,
        "offered_to":     [],
        "rejected_by":    [],
        "latitude":       body.latitude,
        "longitude":      body.longitude,
    })

    # Mark coupon used (once per booking)
    if body.coupon_code:
        docs = db.collection("coupons").where("code", "==", body.coupon_code.upper()).get()
        if docs:
            docs[0].reference.update({"used_count": Increment(1)})

    # Increment booking counts on each service/package
    for sid in service_ids:
        db.collection("services").document(sid).update({"total_bookings": Increment(1)})
    for pid in package_ids:
        db.collection("packages").document(pid).update({"total_bookings": Increment(1)})

    # HIGH-02: increment platform stats
    db.collection("_stats").document("platform").set(
        {"total_bookings": Increment(1), "pending_bookings": Increment(1)}, merge=True
    )
    # HIGH-07: notify admin of new booking
    _write_notification(
        db, "admin", "new_booking", "New Booking",
        f"{user_data.get('name', 'A client')} booked {summary_name} for {body.date}",
        ref.id,
    )

    # Notify eligible providers in the same city
    booking_city = _extract_city(address)
    _notify_eligible_providers(
        db, ref.id, booking_city, names,
        user_data.get("name", "A client"),
        current_user.uid,
        body.date,
        booking_lat=body.latitude,
        booking_lng=body.longitude,
    )

    return _doc_to_booking(ref.get())


# ── Create booking ────────────────────────────────────────────────────────────

@router.post("", response_model=BookingResponse, status_code=201)
async def create_booking(
    body: CreateBookingRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    if current_user.role not in ("client", "admin"):
        raise HTTPException(status_code=403, detail="Only clients can create bookings.")

    db = get_db()

    address = _resolve_address(db, body.address_id, body.address_text, current_user.uid)
    base_price, service_name = _get_service_price(db, body.service_id, body.package_id)
    discount = _apply_coupon(db, body.coupon_code, base_price, current_user.uid)
    convenience_fee = _get_convenience_fee(db)
    total = round(base_price - discount + convenience_fee, 2)

    # Fetch client name/phone for display
    user_doc = db.collection("users").document(current_user.uid).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}

    booking_ref = _generate_booking_ref(db)
    now = datetime.now(timezone.utc).isoformat()
    ref = db.collection("bookings").document()
    ref.set({
        "booking_ref": booking_ref,
        "client_id": current_user.uid,
        "client_name": user_data.get("name", ""),
        "client_phone": user_data.get("phone", ""),
        "provider_id": None,
        "provider_name": None,
        "service_id": body.service_id,
        "package_id": body.package_id,
        "service_name": service_name,
        "date": body.date,
        "time": body.time,
        "address": address,
        "payment_method": body.payment_method,
        "coupon_code": body.coupon_code,
        "base_price": base_price,
        "discount_amount": discount,
        "convenience_fee": convenience_fee,
        "total_price": total,
        "status": "pending",
        "notes": body.notes,
        "created_at": now,
        "offered_to": [],
        "rejected_by": [],
        "latitude": body.latitude,
        "longitude": body.longitude,
    })

    # Mark coupon used
    if body.coupon_code:
        docs = db.collection("coupons").where("code", "==", body.coupon_code.upper()).get()
        if docs:
            docs[0].reference.update({"used_count": Increment(1)})

    # Increment service/package booking count
    if body.service_id:
        db.collection("services").document(body.service_id).update(
            {"total_bookings": Increment(1)}
        )
    if body.package_id:
        db.collection("packages").document(body.package_id).update(
            {"total_bookings": Increment(1)}
        )

    # HIGH-02: increment platform stats
    db.collection("_stats").document("platform").set(
        {"total_bookings": Increment(1), "pending_bookings": Increment(1)}, merge=True
    )
    # HIGH-07: notify admin of new booking
    _write_notification(
        db, "admin", "new_booking", "New Booking",
        f"{user_data.get('name', 'A client')} booked {service_name} for {body.date}",
        ref.id,
    )

    # Notify eligible providers in the same city
    booking_city = _extract_city(address)
    _notify_eligible_providers(
        db, ref.id, booking_city, [service_name],
        user_data.get("name", "A client"),
        current_user.uid,
        body.date,
        booking_lat=body.latitude,
        booking_lng=body.longitude,
    )

    return _doc_to_booking(ref.get())


# ── List bookings ─────────────────────────────────────────────────────────────

@router.get("", response_model=PaginatedBookings)
async def list_bookings(
    status: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user),
):
    db = get_db()
    col = db.collection("bookings")

    if current_user.role == "admin":
        q = col.where("status", "==", status) if status else col
    elif current_user.role == "service_provider":
        q = col.where("provider_id", "==", current_user.uid)
        if status:
            q = q.where("status", "==", status)
    else:
        q = col.where("client_id", "==", current_user.uid)
        if status:
            q = q.where("status", "==", status)

    q = q.order_by("created_at", direction=gc_firestore.Query.DESCENDING).limit(limit + 1)
    if cursor:
        cursor_doc = col.document(cursor).get()
        if cursor_doc.exists:
            q = q.start_after(cursor_doc)

    try:
        docs = list(q.stream())
    except FailedPrecondition:
        # Index not yet ready — fall back to unordered query
        if current_user.role == "admin":
            fallback = col.where("status", "==", status) if status else col
        elif current_user.role == "service_provider":
            fallback = col.where("provider_id", "==", current_user.uid)
        else:
            fallback = col.where("client_id", "==", current_user.uid)
        try:
            docs = list(fallback.limit(limit + 1).stream())
        except FailedPrecondition:
            docs = []

    has_next = len(docs) > limit
    page_docs = docs[:limit]
    items = [_doc_to_booking(d) for d in page_docs]
    next_cursor = page_docs[-1].id if (has_next and page_docs) else None

    return PaginatedBookings(items=items, next_cursor=next_cursor)


# ── Get booking detail ────────────────────────────────────────────────────────

@router.get("/{booking_id}", response_model=BookingResponse)
async def get_booking(
    booking_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    db = get_db()
    doc = db.collection("bookings").document(booking_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found.")
    d = doc.to_dict()
    # Authorisation: client sees own, provider sees assigned, admin sees all
    if current_user.role == "client" and d.get("client_id") != current_user.uid:
        raise HTTPException(status_code=403, detail="Access denied.")
    if current_user.role == "service_provider" and d.get("provider_id") != current_user.uid:
        raise HTTPException(status_code=403, detail="Access denied.")
    return _doc_to_booking(doc)


# ── Assign provider (admin) ───────────────────────────────────────────────────

@router.put("/{booking_id}/assign", response_model=BookingResponse)
async def assign_provider(
    booking_id: str,
    body: AssignProviderRequest,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("bookings").document(booking_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found.")
    d = doc.to_dict()

    # Fetch provider name
    prov_doc = db.collection("users").document(body.provider_id).get()
    if not prov_doc.exists:
        raise HTTPException(status_code=404, detail="Provider not found.")
    prov_name = prov_doc.to_dict().get("name", "")

    # HIGH-05: Prevent double-booking — check provider has no confirmed/active booking at same slot
    booking_date = d.get("date")
    booking_time = d.get("time")
    if booking_date and booking_time:
        conflicts = (
            db.collection("bookings")
            .where("provider_id", "==", body.provider_id)
            .where("date", "==", booking_date)
            .where("time", "==", booking_time)
            .where("status", "in", ["confirmed", "active"])
            .limit(1)
            .get()
        )
        if conflicts and conflicts[0].id != booking_id:
            raise HTTPException(
                status_code=409,
                detail=f"Provider already has a booking at {booking_date} {booking_time}.",
            )

    ref.update({
        "provider_id": body.provider_id,
        "provider_name": prov_name,
        "status": "confirmed",
    })

    # HIGH-02: Update platform stats — pending → confirmed (active bucket)
    _update_platform_stats(db, d.get("status", "pending"), "confirmed")

    # HIGH-07: Notify provider of new job assignment
    _write_notification(
        db, body.provider_id, "booking_assigned", "New Job Assigned",
        f"You have been assigned: {d.get('service_name', 'a service')} for {d.get('client_name', 'a client')} on {booking_date}",
        booking_id,
    )

    return _doc_to_booking(ref.get())


# ── Update status ─────────────────────────────────────────────────────────────

@router.put("/{booking_id}/status", response_model=BookingResponse)
async def update_booking_status(
    booking_id: str,
    body: UpdateBookingStatusRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    db = get_db()
    ref = db.collection("bookings").document(booking_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found.")
    d = doc.to_dict()

    # Permission checks
    if current_user.role == "client":
        if d.get("client_id") != current_user.uid:
            raise HTTPException(status_code=403, detail="Access denied.")
        if body.status != "cancelled":
            raise HTTPException(status_code=403, detail="Clients can only cancel bookings.")
        if d.get("status") not in ("pending", "confirmed"):
            raise HTTPException(status_code=400, detail="Cannot cancel a booking in progress or completed.")
    elif current_user.role == "service_provider":
        if d.get("provider_id") != current_user.uid:
            raise HTTPException(status_code=403, detail="Access denied.")
        if body.status not in ("active", "completed"):
            raise HTTPException(status_code=403, detail="Providers can only mark jobs active or completed.")
        # HIGH-08: Provider cannot mark a future booking as completed
        if body.status == "completed":
            booking_date_str = d.get("date", "")
            if booking_date_str:
                try:
                    booking_date = datetime.strptime(booking_date_str, "%Y-%m-%d").date()
                    if booking_date > datetime.now(timezone.utc).date():
                        raise HTTPException(
                            status_code=400,
                            detail="Cannot mark a future booking as completed.",
                        )
                except ValueError:
                    pass

    old_status = d.get("status", "pending")
    ref.update({"status": body.status})

    # HIGH-02: Update platform stats counter
    _update_platform_stats(
        db, old_status, body.status,
        revenue_delta=float(d.get("total_price", 0)) if body.status == "completed" else 0.0,
    )

    # On completion: create earnings record
    if body.status == "completed" and d.get("provider_id"):
        provider_id = d["provider_id"]
        prov_profile = db.collection("provider_profiles").document(provider_id).get()
        commission_rate = 15.0
        if prov_profile.exists:
            commission_rate = prov_profile.to_dict().get("commission_rate", 15.0)

        amount = d.get("total_price", 0)
        commission = round(amount * commission_rate / 100, 2)
        net = round(amount - commission, 2)

        db.collection("earnings").document().set({
            "provider_id": provider_id,
            "booking_id": booking_id,
            "service_name": d.get("service_name", ""),
            "client_name": d.get("client_name", ""),
            "amount": amount,
            "commission": commission,
            "net_amount": net,
            "date": datetime.now(timezone.utc).isoformat(),
            "status": "paid",
        })

        # Update provider total jobs
        db.collection("provider_profiles").document(provider_id).update(
            {"total_jobs": Increment(1)}
        )

    # ── Award loyalty points to client on completion ───────────────────────────
    if body.status == "completed":
        POINTS_PER_RUPEE = 0.5
        total_spent = d.get("total_price", 0)
        points_earned = round(total_spent * POINTS_PER_RUPEE)
        client_id = d.get("client_id", "")

        if points_earned > 0 and client_id:
            from schemas.user import calculate_tier

            # Increment loyalty_points on the user document
            db.collection("users").document(client_id).update(
                {"loyalty_points": Increment(points_earned)}
            )

            # Recalculate tier
            updated_user = db.collection("users").document(client_id).get().to_dict() or {}
            new_points = updated_user.get("loyalty_points", 0)
            new_tier = calculate_tier(new_points)
            db.collection("users").document(client_id).update({"tier": new_tier})

            # Log transaction
            db.collection("loyalty_transactions").document().set({
                "client_id": client_id,
                "booking_id": booking_id,
                "points_awarded": points_earned,
                "amount_spent": total_spent,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "description": f"Earned {points_earned} pts for booking #{booking_id[:8]}",
            })

        # HIGH-07: Notify client that service is completed
        _write_notification(
            db, client_id, "booking_completed", "Service Completed! ✅",
            f"Your {d.get('service_name', 'service')} booking has been completed. Rate your experience!",
            booking_id,
        )

    # HIGH-07: Notify provider when their booking is cancelled
    if body.status == "cancelled" and d.get("provider_id"):
        _write_notification(
            db, d["provider_id"], "booking_cancelled", "Booking Cancelled",
            f"{d.get('client_name', 'Client')}'s {d.get('service_name', 'service')} booking on {d.get('date', '')} was cancelled.",
            booking_id,
        )

    return _doc_to_booking(ref.get())


# ── Edit booking (client — pending only) ─────────────────────────────────────

@router.put("/{booking_id}", response_model=BookingResponse)
async def edit_booking(
    booking_id: str,
    body: UpdateBookingRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Allow the booking client to change date/time/address/notes while status is still pending."""
    db = get_db()
    ref = db.collection("bookings").document(booking_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found.")
    d = doc.to_dict()

    if d.get("client_id") != current_user.uid and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")
    if d.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Only pending bookings can be edited.")

    updates: dict = {}
    if body.date is not None:
        updates["date"] = body.date
    if body.time is not None:
        updates["time"] = body.time
    if body.notes is not None:
        updates["notes"] = body.notes
    if body.address_text is not None:
        updates["address"] = body.address_text

    if updates:
        ref.update(updates)
    return _doc_to_booking(ref.get())


# ── Cancel (client convenience shortcut) ─────────────────────────────────────

@router.delete("/{booking_id}", status_code=204)
async def cancel_booking(
    booking_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    db = get_db()
    ref = db.collection("bookings").document(booking_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found.")
    d = doc.to_dict()
    if d.get("client_id") != current_user.uid and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied.")
    if d.get("status") not in ("pending", "confirmed"):
        raise HTTPException(status_code=400, detail="Cannot cancel a booking that is active or completed.")
    ref.update({"status": "cancelled"})
    # HIGH-02: Update platform stats
    _update_platform_stats(db, d.get("status", "pending"), "cancelled")


# ── Provider accept job offer ─────────────────────────────────────────────────

@router.post("/{booking_id}/accept", response_model=BookingResponse)
async def accept_job_offer(
    booking_id: str,
    current_user: CurrentUser = Depends(require_role("service_provider")),
):
    """Provider self-assigns to a pending booking that was offered to them."""
    db = get_db()
    ref = db.collection("bookings").document(booking_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found.")
    d = doc.to_dict()

    if d.get("status") != "pending":
        raise HTTPException(status_code=409, detail="Booking is no longer available.")
    if current_user.uid not in d.get("offered_to", []):
        raise HTTPException(status_code=403, detail="This booking was not offered to you.")
    if current_user.uid in d.get("rejected_by", []):
        raise HTTPException(status_code=409, detail="You already rejected this booking.")

    # Slot conflict check
    booking_date = d.get("date")
    booking_time = d.get("time")
    if booking_date and booking_time:
        conflicts = (
            db.collection("bookings")
            .where("provider_id", "==", current_user.uid)
            .where("date", "==", booking_date)
            .where("time", "==", booking_time)
            .where("status", "in", ["confirmed", "active"])
            .limit(1)
            .get()
        )
        if conflicts:
            raise HTTPException(status_code=409, detail="You already have a booking at this time slot.")

    prov_doc = db.collection("users").document(current_user.uid).get()
    prov_name = (prov_doc.to_dict() or {}).get("name", "")
    ref.update({
        "provider_id":   current_user.uid,
        "provider_name": prov_name,
        "status":        "confirmed",
    })
    _update_platform_stats(db, "pending", "confirmed")
    _write_notification(
        db, d.get("client_id"), "booking_confirmed",
        "Provider Assigned!",
        f"A provider has accepted your booking for {d.get('date')}.",
        booking_id,
    )
    return _doc_to_booking(ref.get())


# ── Provider reject job offer ─────────────────────────────────────────────────

@router.post("/{booking_id}/reject", response_model=BookingResponse)
async def reject_job_offer(
    booking_id: str,
    current_user: CurrentUser = Depends(require_role("service_provider")),
):
    """Provider declines a pending booking that was offered to them."""
    db = get_db()
    ref = db.collection("bookings").document(booking_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found.")
    d = doc.to_dict()

    if current_user.uid not in d.get("offered_to", []):
        raise HTTPException(status_code=403, detail="This booking was not offered to you.")

    from google.cloud.firestore import ArrayUnion
    ref.update({"rejected_by": ArrayUnion([current_user.uid])})
    return _doc_to_booking(ref.get())


# ── Client reviews provider + service ────────────────────────────────────────────

@router.post("/{booking_id}/review", response_model=BookingResponse)
async def submit_provider_review(
    booking_id: str,
    body: SubmitReviewRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Client submits a 1-5 star review for the provider / service."""
    db = get_db()
    ref = db.collection("bookings").document(booking_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found.")
    d = doc.to_dict()

    if d.get("client_id") != current_user.uid:
        raise HTTPException(status_code=403, detail="Only the client of this booking can submit a review.")
    if d.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Booking is not yet completed.")
    if d.get("client_review"):
        raise HTTPException(status_code=409, detail="You have already reviewed this booking.")

    review_data = {
        "rating":     body.rating,
        "comment":    body.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    ref.update({"client_review": review_data})

    # HIGH-03: Incremental running average for provider rating (no O(n) scan)
    provider_id = d.get("provider_id")
    if provider_id:
        prov_ref = db.collection("provider_profiles").document(provider_id)
        prov_data = prov_ref.get().to_dict() or {}
        old_count = int(prov_data.get("rating_count", 0))
        old_sum = float(prov_data.get("rating_sum", 0.0))
        new_count = old_count + 1
        new_sum = old_sum + body.rating
        prov_ref.update({
            "rating": round(new_sum / new_count, 2),
            "rating_count": new_count,
            "rating_sum": new_sum,
        })
        # HIGH-07: Notify provider of new rating
        stars = "★" * body.rating
        _write_notification(
            db, provider_id, "new_rating", "New Rating Received",
            f"{d.get('client_name', 'A client')} rated your service {stars}" +
            (f': "{body.comment}"' if body.comment else ""),
            booking_id,
        )

    # HIGH-03: Incremental running average for service rating
    service_id = d.get("service_id")
    if service_id:
        svc_ref = db.collection("services").document(service_id)
        svc_data = svc_ref.get().to_dict() or {}
        old_count = int(svc_data.get("rating_count", 0))
        old_sum = float(svc_data.get("rating_sum", 0.0))
        new_count = old_count + 1
        new_sum = old_sum + body.rating
        svc_ref.update({
            "rating": round(new_sum / new_count, 2),
            "rating_count": new_count,
            "rating_sum": new_sum,
        })

    return _doc_to_booking(ref.get())


# ── Provider rates client ──────────────────────────────────────────────────────────

@router.post("/{booking_id}/rate-client", response_model=BookingResponse)
async def rate_client(
    booking_id: str,
    body: SubmitReviewRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Provider submits a 1-5 star rating for the client after job completion."""
    db = get_db()
    ref = db.collection("bookings").document(booking_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found.")
    d = doc.to_dict()

    if d.get("provider_id") != current_user.uid:
        raise HTTPException(status_code=403, detail="Only the assigned provider can rate the client.")
    if d.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Booking is not yet completed.")
    if d.get("provider_review"):
        raise HTTPException(status_code=409, detail="You have already rated this client.")

    ref.update({
        "provider_review": {
            "rating":     body.rating,
            "comment":    body.comment,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    })
    return _doc_to_booking(ref.get())
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
from google.cloud import firestore as gc_firestore

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

CONVENIENCE_FEE = 99.0


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


def _apply_coupon(db, code: Optional[str], base_price: float) -> float:
    """Return discount amount (0 if code is invalid)."""
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
        convenience_fee=d.get("convenience_fee", CONVENIENCE_FEE),
        total_price=d.get("total_price", 0),
        status=d.get("status", "pending"),
        notes=d.get("notes"),
        created_at=d.get("created_at"),
        client_name=d.get("client_name"),
        provider_name=d.get("provider_name"),
        client_phone=d.get("client_phone"),
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

    discount = _apply_coupon(db, body.coupon_code, base_total)
    total    = round(base_total - discount + CONVENIENCE_FEE, 2)

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
        "convenience_fee": CONVENIENCE_FEE,
        "total_price":    total,
        "status":         "pending",
        "notes":          body.notes,
        "created_at":     now,
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
    discount = _apply_coupon(db, body.coupon_code, base_price)
    total = round(base_price - discount + CONVENIENCE_FEE, 2)

    # Fetch client name/phone for display
    user_doc = db.collection("users").document(current_user.uid).get()
    user_data = user_doc.to_dict() if user_doc.exists else {}

    now = datetime.now(timezone.utc).isoformat()
    ref = db.collection("bookings").document()
    ref.set({
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
        "convenience_fee": CONVENIENCE_FEE,
        "total_price": total,
        "status": "pending",
        "notes": body.notes,
        "created_at": now,
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

    return _doc_to_booking(ref.get())


# ── List bookings ─────────────────────────────────────────────────────────────

@router.get("", response_model=list[BookingResponse])
async def list_bookings(
    status: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user),
):
    db = get_db()
    query = db.collection("bookings")

    if current_user.role == "admin":
        if status:
            query = query.where("status", "==", status)
    elif current_user.role == "service_provider":
        query = query.where("provider_id", "==", current_user.uid)
        if status:
            query = query.where("status", "==", status)
    else:
        # client
        query = query.where("client_id", "==", current_user.uid)
        if status:
            query = query.where("status", "==", status)

    docs = query.stream()
    bookings = [_doc_to_booking(d) for d in docs]
    bookings.sort(key=lambda b: b.created_at or "", reverse=True)
    return bookings


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
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Booking not found.")

    # Fetch provider name
    prov_doc = db.collection("users").document(body.provider_id).get()
    if not prov_doc.exists:
        raise HTTPException(status_code=404, detail="Provider not found.")
    prov_name = prov_doc.to_dict().get("name", "")

    ref.update({
        "provider_id": body.provider_id,
        "provider_name": prov_name,
        "status": "confirmed",
    })
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

    ref.update({"status": body.status})

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

    # ── Recalculate provider rating ───────────────────────────────────────────────
    provider_id = d.get("provider_id")
    if provider_id:
        prov_bookings = db.collection("bookings").where("provider_id", "==", provider_id).stream()
        prov_ratings = [
            bk.to_dict()["client_review"]["rating"]
            for bk in prov_bookings
            if bk.to_dict().get("client_review")
        ]
        if prov_ratings:
            db.collection("provider_profiles").document(provider_id).update(
                {"rating": round(sum(prov_ratings) / len(prov_ratings), 2)}
            )

    # ── Recalculate service rating ────────────────────────────────────────────────
    service_id = d.get("service_id")
    if service_id:
        svc_bookings = db.collection("bookings").where("service_id", "==", service_id).stream()
        svc_ratings = [
            bk.to_dict()["client_review"]["rating"]
            for bk in svc_bookings
            if bk.to_dict().get("client_review")
        ]
        if svc_ratings:
            db.collection("services").document(service_id).update(
                {"rating": round(sum(svc_ratings) / len(svc_ratings), 2)}
            )

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
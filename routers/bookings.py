"""
Bookings router  —  POST   /bookings                    (client)
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

from firebase_admin.firestore import Increment
from firebase_config import get_db
from dependencies.auth import CurrentUser, get_current_user, require_role
from schemas.booking import (
    AssignProviderRequest,
    BookingResponse,
    CreateBookingRequest,
    UpdateBookingStatusRequest,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])

CONVENIENCE_FEE = 99.0


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
        convenience_fee=d.get("convenience_fee", CONVENIENCE_FEE),
        total_price=d.get("total_price", 0),
        status=d.get("status", "pending"),
        notes=d.get("notes"),
        created_at=d.get("created_at"),
        client_name=d.get("client_name"),
        provider_name=d.get("provider_name"),
        client_phone=d.get("client_phone"),
    )


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

    docs = query.order_by("created_at", direction="DESCENDING").stream()
    return [_doc_to_booking(d) for d in docs]


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

"""
Payments router  —  POST /payments/create-order   (authenticated client)
                    POST /payments/verify          (authenticated client)
                    POST /payments/webhook         (Razorpay webhook — unauthenticated, HMAC verified)

Razorpay integration for UPI / card / wallet / netbanking.

Environment variables required:
  RAZORPAY_KEY_ID      — Razorpay API key ID
  RAZORPAY_KEY_SECRET  — Razorpay API key secret
  RAZORPAY_WEBHOOK_SECRET — Webhook signature secret (set in Razorpay dashboard)
"""

from __future__ import annotations

import hashlib
import hmac
import os
from datetime import datetime, timezone

import razorpay
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional

from firebase_config import get_db
from firebase_admin.firestore import Increment
from dependencies.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/payments", tags=["Payments"])

_KEY_ID     = os.getenv("RAZORPAY_KEY_ID", "")
_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
_WEBHOOK_SECRET = os.getenv("RAZORPAY_WEBHOOK_SECRET", "")


def _get_client() -> razorpay.Client:
    if not _KEY_ID or not _KEY_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Payment gateway not configured. Contact support.",
        )
    return razorpay.Client(auth=(_KEY_ID, _KEY_SECRET))


# ── Schemas ───────────────────────────────────────────────────────────────────

class CreateOrderRequest(BaseModel):
    booking_id: str
    currency: str = "INR"
    notes: Optional[dict] = None


class CreateOrderResponse(BaseModel):
    razorpay_order_id: str
    amount_paise: int
    currency: str
    key_id: str


class VerifyPaymentRequest(BaseModel):
    booking_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ── POST /payments/create-order ───────────────────────────────────────────────

@router.post("/create-order", response_model=CreateOrderResponse, status_code=201)
async def create_order(
    body: CreateOrderRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Create a Razorpay order for a pending booking."""
    db = get_db()

    # Validate booking belongs to this client
    ref = db.collection("bookings").document(body.booking_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found.")
    booking = doc.to_dict()
    if booking.get("client_id") != current_user.uid:
        raise HTTPException(status_code=403, detail="Access denied.")
    if booking.get("status") != "pending":
        raise HTTPException(status_code=400, detail="Only pending bookings can be paid.")

    # Compute amount from booking — never trust client-supplied amounts
    amount_paise = int(float(booking.get("total_price", 0)) * 100)
    if amount_paise <= 0:
        raise HTTPException(status_code=400, detail="Invalid booking amount.")

    client = _get_client()
    try:
        order = client.order.create({
            "amount": amount_paise,
            "currency": body.currency,
            "receipt": body.booking_id[:40],
            "notes": body.notes or {"booking_id": body.booking_id},
        })
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Razorpay error: {exc}")

    # Store order ID on booking document
    ref.update({
        "razorpay_order_id": order["id"],
        "payment_status": "order_created",
    })

    return CreateOrderResponse(
        razorpay_order_id=order["id"],
        amount_paise=amount_paise,
        currency=body.currency,
        key_id=_KEY_ID,
    )


# ── POST /payments/verify ─────────────────────────────────────────────────────

@router.post("/verify")
async def verify_payment(
    body: VerifyPaymentRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Verify Razorpay payment signature and mark booking as paid."""
    db = get_db()

    ref = db.collection("bookings").document(body.booking_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Booking not found.")
    booking = doc.to_dict()
    if booking.get("client_id") != current_user.uid:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Verify HMAC-SHA256 signature
    expected_sig = hmac.new(
        _KEY_SECRET.encode(),
        f"{body.razorpay_order_id}|{body.razorpay_payment_id}".encode(),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_sig, body.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment signature verification failed.")

    # Update booking to paid
    ref.update({
        "razorpay_payment_id": body.razorpay_payment_id,
        "payment_status": "paid",
        "payment_verified_at": datetime.now(timezone.utc).isoformat(),
    })

    return {"success": True, "message": "Payment verified. Booking confirmed."}


# ── POST /payments/webhook ────────────────────────────────────────────────────

@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: Optional[str] = Header(None),
):
    """Handle Razorpay webhook events. Verifies HMAC signature before processing."""
    body_bytes = await request.body()

    if not _WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook secret not configured.")

    # Verify webhook signature
    expected = hmac.new(
        _WEBHOOK_SECRET.encode(),
        body_bytes,
        hashlib.sha256,
    ).hexdigest()

    if not x_razorpay_signature or not hmac.compare_digest(expected, x_razorpay_signature):
        raise HTTPException(status_code=400, detail="Invalid webhook signature.")

    import json
    payload = json.loads(body_bytes)
    event = payload.get("event", "")

    if event == "payment.captured":
        payment = payload.get("payload", {}).get("payment", {}).get("entity", {})
        notes   = payment.get("notes", {})
        booking_id = notes.get("booking_id", "")

        if booking_id:
            db = get_db()
            ref = db.collection("bookings").document(booking_id)
            if ref.get().exists:
                ref.update({
                    "payment_status": "paid",
                    "razorpay_payment_id": payment.get("id"),
                    "payment_verified_at": datetime.now(timezone.utc).isoformat(),
                })

    return {"received": True}

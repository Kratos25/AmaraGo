"""Providers router  —  GET  /providers/me                   (own profile)
                     PUT  /providers/me                   (update profile)
                     PUT  /providers/me/online            (toggle online)
                     POST /providers/me/upload            (upload file → returns URL)
                     GET  /providers/me/jobs              (assigned jobs)
                     GET  /providers/me/earnings          (earnings summary)
                     GET  /providers/me/notifications     (provider notifications)
                     GET  /providers                      (admin: list all with filters)
                     GET  /providers/{uid}                (admin: single provider)
                     PUT  /providers/{uid}/approval       (admin: approve / reject)
"""

from __future__ import annotations

import io
import datetime
import mimetypes
import os
import urllib.parse
from typing import Any, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
import requests as http_requests

from firebase_config import get_bucket, get_db
from dependencies.auth import CurrentUser, get_current_user, require_role
from schemas.provider import (
    ApprovalRequest,
    EarningsSummary,
    EarningTransaction,
    ProviderDocuments,
    ProviderProfileResponse,
    ToggleOnlineRequest,
    UpdateProviderProfileRequest,
)
from pydantic import BaseModel
from schemas.booking import BookingResponse

router = APIRouter(prefix="/providers", tags=["Providers"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _build_profile(uid: str, user_data: dict, provider_data: dict) -> ProviderProfileResponse:
    docs_raw = provider_data.get("documents")
    documents = ProviderDocuments(**docs_raw) if isinstance(docs_raw, dict) else None
    return ProviderProfileResponse(
        uid=uid,
        name=user_data.get("name", ""),
        email=user_data.get("email"),
        phone=user_data.get("phone"),
        profile_image=user_data.get("profile_image"),
        bio=provider_data.get("bio", ""),
        experience_years=provider_data.get("experience_years", 0),
        services_offered=provider_data.get("services_offered", []),
        location=provider_data.get("location", ""),
        certifications=provider_data.get("certifications", []),
        portfolio=provider_data.get("portfolio", []),
        rating=provider_data.get("rating", 0.0),
        total_jobs=provider_data.get("total_jobs", 0),
        is_online=provider_data.get("is_online", False),
        is_approved=provider_data.get("is_approved", False),
        commission_rate=provider_data.get("commission_rate", 15.0),
        created_at=user_data.get("created_at"),
        documents=documents,
    )


def _doc_to_booking(doc) -> BookingResponse:
    from schemas.booking import BookingResponse as BR
    d = doc.to_dict()
    return BR(
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
        convenience_fee=d.get("convenience_fee", 99),
        total_price=d.get("total_price", 0),
        status=d.get("status", "pending"),
        notes=d.get("notes"),
        created_at=d.get("created_at"),
        client_name=d.get("client_name"),
        provider_name=d.get("provider_name"),
        client_phone=d.get("client_phone"),
    )


# ── Own profile ───────────────────────────────────────────────────────────────

@router.get("/me", response_model=ProviderProfileResponse)
async def get_my_profile(
    current_user: CurrentUser = Depends(require_role("service_provider", "pending_sp")),
):
    db = get_db()
    user_doc = db.collection("users").document(current_user.uid).get()
    prov_doc = db.collection("provider_profiles").document(current_user.uid).get()
    if not user_doc.exists or not prov_doc.exists:
        raise HTTPException(status_code=404, detail="Provider profile not found.")
    return _build_profile(current_user.uid, user_doc.to_dict(), prov_doc.to_dict())


@router.put("/me", response_model=ProviderProfileResponse)
async def update_my_profile(
    body: UpdateProviderProfileRequest,
    current_user: CurrentUser = Depends(require_role("service_provider")),
):
    db = get_db()
    all_updates = body.model_dump(exclude_none=True)
    if not all_updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    # Fields that live in the `users` collection
    USER_FIELDS = {"name", "phone", "profile_image"}
    user_updates = {k: v for k, v in all_updates.items() if k in USER_FIELDS}
    prov_updates = {k: v for k, v in all_updates.items() if k not in USER_FIELDS}

    # Serialize nested models for provider_profiles
    if "certifications" in prov_updates:
        prov_updates["certifications"] = [
            c.model_dump() if hasattr(c, "model_dump") else c
            for c in prov_updates["certifications"]
        ]
    if "portfolio" in prov_updates:
        prov_updates["portfolio"] = [
            p.model_dump() if hasattr(p, "model_dump") else p
            for p in prov_updates["portfolio"]
        ]
    if "documents" in prov_updates:
        d = prov_updates["documents"]
        prov_updates["documents"] = d.model_dump() if hasattr(d, "model_dump") else d

    if user_updates:
        db.collection("users").document(current_user.uid).update(user_updates)
    if prov_updates:
        db.collection("provider_profiles").document(current_user.uid).update(prov_updates)

    user_doc = db.collection("users").document(current_user.uid).get()
    prov_doc = db.collection("provider_profiles").document(current_user.uid).get()
    return _build_profile(current_user.uid, user_doc.to_dict(), prov_doc.to_dict())


# ── File upload (bypasses Storage Rules via Admin SDK) ────────────────────────

ALLOWED_MIME = {
    "image/jpeg", "image/png", "image/webp", "image/gif",
    "application/pdf",
}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB
_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "")


@router.post("/me/upload")
async def upload_provider_file(
    path: str = Query(..., description="Storage path suffix, e.g. 'profile.jpg' or 'docs/aadhar'"),
    file: UploadFile = File(...),
    current_user: CurrentUser = Depends(require_role("service_provider")),
):
    """Upload a file for the current provider via the Firebase Storage REST API.

    Returns {"url": "<download URL>"}
    The file is stored at:  providers/{uid}/{path}
    """
    # ── Validate content type ────────────────────────────────────────────────
    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or ""
    if content_type not in ALLOWED_MIME:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {content_type}")

    # ── Read & size-check ────────────────────────────────────────────────────
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Max 5 MB.")

    # ── Upload via Firebase Storage REST API (Admin credentials) ─────────────
    storage_path = f"providers/{current_user.uid}/{path}"
    encoded_path = urllib.parse.quote(storage_path, safe="")
    bucket        = _STORAGE_BUCKET

    upload_url = (
        f"https://firebasestorage.googleapis.com/v0/b/{bucket}/o"
        f"?uploadType=media&name={encoded_path}"
    )

    try:
        import firebase_admin.app_check
        import google.auth.transport.requests as gtr
        import google.oauth2.service_account as sa_module

        # Get the service account credentials from the initialised app
        app   = firebase_admin.get_app()
        cred  = app.credential.get_credential()
        cred.refresh(gtr.Request())
        token = cred.token

        resp = http_requests.post(
            upload_url,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type":  content_type,
            },
            data=data,
            timeout=60,
        )
        if resp.status_code not in (200, 201):
            raise HTTPException(
                status_code=500,
                detail=f"Storage upload failed: {resp.status_code} {resp.text[:300]}",
            )

        # Build a permanent download URL from the response token
        resp_json    = resp.json()
        download_token = resp_json.get("downloadTokens", "")
        encoded_name   = urllib.parse.quote(resp_json.get("name", storage_path), safe="")
        download_url   = (
            f"https://firebasestorage.googleapis.com/v0/b/{bucket}/o/"
            f"{encoded_name}?alt=media&token={download_token}"
        )
        return {"url": download_url}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}") from exc


# ── Online toggle ─────────────────────────────────────────────────────────────

@router.put("/me/online", response_model=ProviderProfileResponse)
async def toggle_online(
    body: ToggleOnlineRequest,
    current_user: CurrentUser = Depends(require_role("service_provider")),
):
    db = get_db()
    db.collection("provider_profiles").document(current_user.uid).update(
        {"is_online": body.is_online}
    )
    user_doc = db.collection("users").document(current_user.uid).get()
    prov_doc = db.collection("provider_profiles").document(current_user.uid).get()
    if not user_doc.exists or not prov_doc.exists:
        raise HTTPException(status_code=404, detail="Provider profile not found.")
    return _build_profile(current_user.uid, user_doc.to_dict(), prov_doc.to_dict())


# ── Provider's jobs ───────────────────────────────────────────────────────────

@router.get("/me/jobs", response_model=list[BookingResponse])
async def get_my_jobs(
    status: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(require_role("service_provider")),
):
    db = get_db()
    query = db.collection("bookings").where("provider_id", "==", current_user.uid)
    if status:
        query = query.where("status", "==", status)
    # Do NOT chain order_by here — Firestore requires a composite index for
    # (provider_id, date) which may not exist. Sort in Python instead.
    docs = query.stream()
    bookings = [_doc_to_booking(d) for d in docs]
    bookings.sort(key=lambda b: b.date, reverse=True)
    return bookings


# ── Provider's earnings ───────────────────────────────────────────────────────

@router.get("/me/earnings", response_model=EarningsSummary)
async def get_my_earnings(
    current_user: CurrentUser = Depends(require_role("service_provider")),
):
    from datetime import datetime, timezone, timedelta

    db = get_db()
    prov_doc = db.collection("provider_profiles").document(current_user.uid).get()
    commission_rate = 15.0
    total_jobs = 0
    if prov_doc.exists:
        d = prov_doc.to_dict()
        commission_rate = d.get("commission_rate", 15.0)
        total_jobs = d.get("total_jobs", 0)

    earning_docs = (
        db.collection("earnings")
        .where("provider_id", "==", current_user.uid)
        # No order_by — avoids composite index requirement; sort in Python below
        .stream()
    )

    transactions: list[EarningTransaction] = []
    total_earned = 0.0
    for doc in earning_docs:
        e = doc.to_dict()
        net = e.get("net_amount", 0)
        total_earned += net
        transactions.append(EarningTransaction(
            id=doc.id,
            service_name=e.get("service_name", ""),
            client_name=e.get("client_name", ""),
            amount=e.get("amount", 0),
            commission=e.get("commission", 0),
            net_amount=net,
            date=e.get("date", ""),
            booking_id=e.get("booking_id", ""),
        ))

    # Sort newest-first in Python
    transactions.sort(key=lambda t: t.date, reverse=True)

    # ── Date-range aggregations ────────────────────────────────────────────
    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=6)   # last 7 days rolling
    month_start = today.replace(day=1)       # current calendar month

    this_week = 0.0
    this_month = 0.0
    for tx in transactions:
        try:
            tx_date = datetime.strptime(tx.date[:10], "%Y-%m-%d").date()
            if tx_date >= month_start:
                this_month += tx.net_amount
            if tx_date >= week_start:
                this_week += tx.net_amount
        except (ValueError, TypeError):
            pass

    return EarningsSummary(
        total_earned=round(total_earned, 2),
        pending_payout=0.0,
        total_jobs=total_jobs,
        commission_rate=commission_rate,
        this_week=round(this_week, 2),
        this_month=round(this_month, 2),
        transactions=transactions,
    )


# ── Provider notifications ────────────────────────────────────────────────────


class ProviderNotification(BaseModel):
    id: str
    type: str       # "new_booking" | "new_rating" | "booking_cancelled"
    title: str
    message: str
    reference_id: str
    created_at: Any


@router.get("/me/notifications", response_model=list[ProviderNotification])
async def get_my_notifications(
    current_user: CurrentUser = Depends(require_role("service_provider", "pending_sp")),
):
    """
    Returns recent notifications for the authenticated provider:
    - New bookings assigned in the last 30 days
    - Ratings posted by clients in the last 30 days
    - Bookings cancelled by client
    """
    from datetime import timedelta
    db = get_db()
    notifications: list[ProviderNotification] = []

    cutoff = (datetime.datetime.now(datetime.timezone.utc) - timedelta(days=30)).isoformat()

    # Load bookings assigned to this provider
    bookings = (
        db.collection("bookings")
        .where("provider_id", "==", current_user.uid)
        .stream()
    )

    for doc in bookings:
        d = doc.to_dict()
        created_at = d.get("created_at") or ""
        if isinstance(created_at, datetime.datetime):
            created_at = created_at.isoformat()

        # Skip old entries
        if str(created_at) < cutoff:
            continue

        status = d.get("status", "")
        client_name = d.get("client_name") or "A client"
        service_name = d.get("service_name") or "a service"
        date = d.get("date", "")

        # New booking assigned
        notifications.append(ProviderNotification(
            id=f"booking_{doc.id}",
            type="new_booking",
            title="New Job Assigned",
            message=f"{client_name} booked {service_name} on {date}",
            reference_id=doc.id,
            created_at=created_at,
        ))

        # Rating received
        review = d.get("client_review")
        if review:
            review_at = review.get("created_at") or created_at
            if isinstance(review_at, datetime.datetime):
                review_at = review_at.isoformat()
            stars = "★" * int(review.get("rating", 5))
            comment = review.get("comment") or ""
            notifications.append(ProviderNotification(
                id=f"rating_{doc.id}",
                type="new_rating",
                title="New Rating Received",
                message=f"{client_name} rated you {stars}" + (f': "{comment}"' if comment else ""),
                reference_id=doc.id,
                created_at=str(review_at),
            ))

        # Booking cancelled
        if status == "cancelled":
            notifications.append(ProviderNotification(
                id=f"cancel_{doc.id}",
                type="booking_cancelled",
                title="Booking Cancelled",
                message=f"{client_name}'s {service_name} booking was cancelled",
                reference_id=doc.id,
                created_at=created_at,
            ))

    # Sort newest-first
    notifications.sort(
        key=lambda n: str(n.created_at or ""),
        reverse=True,
    )
    return notifications[:30]


# ── Admin: list all providers ─────────────────────────────────────────────────

@router.get("", response_model=list[ProviderProfileResponse])
async def list_providers(
    approved: Optional[bool] = Query(None),
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    query = db.collection("provider_profiles")
    if approved is not None:
        query = query.where("is_approved", "==", approved)
    prov_docs = query.stream()

    results: list[ProviderProfileResponse] = []
    for prov_doc in prov_docs:
        uid = prov_doc.id
        user_doc = db.collection("users").document(uid).get()
        if user_doc.exists:
            results.append(_build_profile(uid, user_doc.to_dict(), prov_doc.to_dict()))
    return results


@router.get("/{uid}", response_model=ProviderProfileResponse)
async def get_provider(
    uid: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Accessible by admin, client, or the provider themselves to view full profile."""
    db = get_db()
    user_doc = db.collection("users").document(uid).get()
    prov_doc = db.collection("provider_profiles").document(uid).get()
    if not user_doc.exists or not prov_doc.exists:
        raise HTTPException(status_code=404, detail="Provider not found.")
    return _build_profile(uid, user_doc.to_dict(), prov_doc.to_dict())


# ── Admin: approve / reject ───────────────────────────────────────────────────

@router.put("/{uid}/approval", response_model=dict)
async def set_provider_approval(
    uid: str,
    body: ApprovalRequest,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("provider_profiles").document(uid)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Provider not found.")
    ref.update({"is_approved": body.approved})

    # Sync the user's role: approved → service_provider, rejected → client
    user_ref = db.collection("users").document(uid)
    new_role = "service_provider" if body.approved else "client"
    if user_ref.get().exists:
        user_ref.update({"role": new_role})

    return {
        "uid": uid,
        "is_approved": body.approved,
        "message": "Provider approved." if body.approved else "Provider rejected.",
    }

"""
Providers router  —  GET  /providers/me                   (own profile)
                     PUT  /providers/me                   (update profile)
                     PUT  /providers/me/online            (toggle online)
                     GET  /providers/me/jobs              (assigned jobs)
                     GET  /providers/me/earnings          (earnings summary)
                     GET  /providers                      (admin: list all with filters)
                     GET  /providers/{uid}                (admin: single provider)
                     PUT  /providers/{uid}/approval       (admin: approve / reject)
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from firebase_config import get_db
from dependencies.auth import CurrentUser, get_current_user, require_role
from schemas.provider import (
    ApprovalRequest,
    EarningsSummary,
    EarningTransaction,
    ProviderProfileResponse,
    ToggleOnlineRequest,
    UpdateProviderProfileRequest,
)
from schemas.booking import BookingResponse

router = APIRouter(prefix="/providers", tags=["Providers"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _build_profile(uid: str, user_data: dict, provider_data: dict) -> ProviderProfileResponse:
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
    current_user: CurrentUser = Depends(require_role("service_provider")),
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
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    # Serialize nested models
    if "certifications" in updates:
        updates["certifications"] = [c.model_dump() if hasattr(c, "model_dump") else c for c in updates["certifications"]]
    if "portfolio" in updates:
        updates["portfolio"] = [p.model_dump() if hasattr(p, "model_dump") else p for p in updates["portfolio"]]

    db.collection("provider_profiles").document(current_user.uid).update(updates)

    user_doc = db.collection("users").document(current_user.uid).get()
    prov_doc = db.collection("provider_profiles").document(current_user.uid).get()
    return _build_profile(current_user.uid, user_doc.to_dict(), prov_doc.to_dict())


# ── Online toggle ─────────────────────────────────────────────────────────────

@router.put("/me/online", response_model=dict)
async def toggle_online(
    body: ToggleOnlineRequest,
    current_user: CurrentUser = Depends(require_role("service_provider")),
):
    db = get_db()
    db.collection("provider_profiles").document(current_user.uid).update(
        {"is_online": body.is_online}
    )
    return {"is_online": body.is_online}


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
    docs = query.order_by("date", direction="DESCENDING").stream()
    return [_doc_to_booking(d) for d in docs]


# ── Provider's earnings ───────────────────────────────────────────────────────

@router.get("/me/earnings", response_model=EarningsSummary)
async def get_my_earnings(
    current_user: CurrentUser = Depends(require_role("service_provider")),
):
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
        .order_by("date", direction="DESCENDING")
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

    return EarningsSummary(
        total_earned=round(total_earned, 2),
        pending_payout=0.0,  # extend when payout cycle is implemented
        total_jobs=total_jobs,
        commission_rate=commission_rate,
        this_week=0.0,   # TODO: filter by date range
        this_month=0.0,
        transactions=transactions,
    )


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
    _admin: CurrentUser = Depends(require_role("admin")),
):
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
    return {
        "uid": uid,
        "is_approved": body.approved,
        "message": "Provider approved." if body.approved else "Provider rejected.",
    }

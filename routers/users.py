"""
Users router  —  GET  /users/me           (returns full ClientProfileResponse for clients)
                 PUT  /users/me
                 GET  /users/{uid}         (admin only)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from firebase_config import get_db
from dependencies.auth import CurrentUser, get_current_user, require_role
from schemas.user import (
    ClientProfileResponse,
    UpdateUserRequest,
    UserResponse,
    TIER_BENEFITS,
    calculate_tier,
    next_tier_info,
)
from schemas.address import AddressResponse

router = APIRouter(prefix="/users", tags=["Users"])


def _doc_to_address(doc) -> AddressResponse:
    d = doc.to_dict()
    return AddressResponse(
        id=doc.id,
        client_id=d.get("client_id", ""),
        label=d.get("label", ""),
        address=d.get("address", ""),
        icon=d.get("icon", "📍"),
        is_default=d.get("is_default", False),
    )


def _build_user_response(uid: str, data: dict) -> UserResponse:
    return UserResponse(
        uid=uid,
        name=data.get("name", ""),
        email=data.get("email"),
        phone=data.get("phone"),
        role=data.get("role", "client"),
        profile_image=data.get("profile_image"),
        created_at=data.get("created_at"),
    )


def _build_client_profile(uid: str, data: dict, db) -> ClientProfileResponse:
    points = data.get("loyalty_points", 0)
    tier = calculate_tier(points)
    nti = next_tier_info(points)
    tier_discount = TIER_BENEFITS.get(tier, {}).get("discount_pct", 0)

    # Count bookings
    bookings_snap = (
        db.collection("bookings")
        .where("client_id", "==", uid)
        .where("status", "==", "completed")
        .stream()
    )
    bookings_count = sum(1 for _ in bookings_snap)

    # Fetch saved addresses
    addr_docs = (
        db.collection("addresses")
        .where("client_id", "==", uid)
        .stream()
    )
    addresses = [_doc_to_address(d) for d in addr_docs]

    return ClientProfileResponse(
        uid=uid,
        name=data.get("name", ""),
        email=data.get("email"),
        phone=data.get("phone"),
        role=data.get("role", "client"),
        profile_image=data.get("profile_image"),
        created_at=data.get("created_at"),
        points=points,
        tier=tier,
        tier_discount_pct=tier_discount,
        next_tier=nti["next_tier"],
        points_needed_for_next_tier=nti["points_needed"],
        tier_progress=nti["progress"],
        bookings_count=bookings_count,
        saved_addresses=addresses,
    )


@router.get("/me")
async def get_me(current_user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    doc = db.collection("users").document(current_user.uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found.")
    data = doc.to_dict()

    if data.get("role", "client") == "client":
        return _build_client_profile(current_user.uid, data, db)
    return _build_user_response(current_user.uid, data)


@router.put("/me", response_model=UserResponse)
async def update_me(
    body: UpdateUserRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    db = get_db()
    ref = db.collection("users").document(current_user.uid)
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    ref.update(updates)
    updated = ref.get().to_dict()
    return _build_user_response(current_user.uid, updated)


@router.get("/{uid}", response_model=UserResponse)
async def get_user_by_id(
    uid: str,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found.")
    return _build_user_response(uid, doc.to_dict())
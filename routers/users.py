"""
Users router  —  GET  /users/me
                 PUT  /users/me
                 GET  /users/{uid}     (admin only)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from firebase_config import get_db
from dependencies.auth import CurrentUser, get_current_user, require_role
from schemas.user import UpdateUserRequest, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


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


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    doc = db.collection("users").document(current_user.uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found.")
    return _build_user_response(current_user.uid, doc.to_dict())


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

"""
Wishlist router  —  GET    /wishlist              (authenticated client)
                    POST   /wishlist/{service_id}  (add item)
                    DELETE /wishlist/{service_id}  (remove item)
                    POST   /wishlist/sync          (merge guest localStorage wishlist on login)

Wishlist is stored as an array field `wishlist` on the user's Firestore document.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

from firebase_config import get_db
from dependencies.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/wishlist", tags=["Wishlist"])


class WishlistResponse(BaseModel):
    wishlist: List[str]


class SyncWishlistRequest(BaseModel):
    service_ids: List[str]


def _get_wishlist(db, uid: str) -> list[str]:
    doc = db.collection("users").document(uid).get()
    if not doc.exists:
        return []
    return doc.to_dict().get("wishlist", [])


# ── GET /wishlist ─────────────────────────────────────────────────────────────

@router.get("", response_model=WishlistResponse)
async def get_wishlist(
    current_user: CurrentUser = Depends(get_current_user),
):
    db = get_db()
    return WishlistResponse(wishlist=_get_wishlist(db, current_user.uid))


# ── POST /wishlist/{service_id} ───────────────────────────────────────────────

@router.post("/{service_id}", response_model=WishlistResponse, status_code=201)
async def add_to_wishlist(
    service_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    db = get_db()

    # Validate service exists
    svc = db.collection("services").document(service_id).get()
    if not svc.exists:
        raise HTTPException(status_code=404, detail="Service not found.")

    wishlist = _get_wishlist(db, current_user.uid)
    if service_id not in wishlist:
        wishlist.append(service_id)
        db.collection("users").document(current_user.uid).update({"wishlist": wishlist})

    return WishlistResponse(wishlist=wishlist)


# ── DELETE /wishlist/{service_id} ─────────────────────────────────────────────

@router.delete("/{service_id}", response_model=WishlistResponse)
async def remove_from_wishlist(
    service_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    db = get_db()
    wishlist = _get_wishlist(db, current_user.uid)

    if service_id in wishlist:
        wishlist.remove(service_id)
        db.collection("users").document(current_user.uid).update({"wishlist": wishlist})

    return WishlistResponse(wishlist=wishlist)


# ── POST /wishlist/sync ───────────────────────────────────────────────────────

@router.post("/sync", response_model=WishlistResponse)
async def sync_wishlist(
    body: SyncWishlistRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """Merge a list of guest localStorage service IDs into the user's server wishlist.
    Deduplicates and validates each service ID exists before adding."""
    db = get_db()
    server_wishlist = _get_wishlist(db, current_user.uid)
    merged = list(server_wishlist)

    for sid in body.service_ids:
        if sid not in merged:
            svc = db.collection("services").document(sid).get()
            if svc.exists:
                merged.append(sid)

    if merged != server_wishlist:
        db.collection("users").document(current_user.uid).update({"wishlist": merged})

    return WishlistResponse(wishlist=merged)

"""
Addresses router  —  GET    /addresses          (own addresses)
                     POST   /addresses
                     PUT    /addresses/{id}
                     DELETE /addresses/{id}
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from firebase_config import get_db
from dependencies.auth import CurrentUser, get_current_user
from schemas.address import AddressResponse, CreateAddressRequest, UpdateAddressRequest

router = APIRouter(prefix="/addresses", tags=["Addresses"])


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


@router.get("", response_model=list[AddressResponse])
async def list_addresses(current_user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    docs = (
        db.collection("addresses")
        .where("client_id", "==", current_user.uid)
        .stream()
    )
    return [_doc_to_address(d) for d in docs]


@router.post("", response_model=AddressResponse, status_code=201)
async def create_address(
    body: CreateAddressRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    db = get_db()

    # If new address is default, clear existing defaults
    if body.is_default:
        existing = (
            db.collection("addresses")
            .where("client_id", "==", current_user.uid)
            .where("is_default", "==", True)
            .stream()
        )
        for d in existing:
            d.reference.update({"is_default": False})

    ref = db.collection("addresses").document()
    ref.set({
        "client_id": current_user.uid,
        "label": body.label,
        "address": body.address,
        "icon": body.icon,
        "is_default": body.is_default,
    })
    return _doc_to_address(ref.get())


@router.put("/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: str,
    body: UpdateAddressRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    db = get_db()
    ref = db.collection("addresses").document(address_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Address not found.")
    if doc.to_dict().get("client_id") != current_user.uid:
        raise HTTPException(status_code=403, detail="Not your address.")

    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")

    # Handle default flag
    if updates.get("is_default"):
        existing = (
            db.collection("addresses")
            .where("client_id", "==", current_user.uid)
            .where("is_default", "==", True)
            .stream()
        )
        for d in existing:
            if d.id != address_id:
                d.reference.update({"is_default": False})

    ref.update(updates)
    return _doc_to_address(ref.get())


@router.delete("/{address_id}", status_code=204)
async def delete_address(
    address_id: str,
    current_user: CurrentUser = Depends(get_current_user),
):
    db = get_db()
    ref = db.collection("addresses").document(address_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Address not found.")
    if doc.to_dict().get("client_id") != current_user.uid:
        raise HTTPException(status_code=403, detail="Not your address.")
    ref.delete()

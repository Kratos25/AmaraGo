"""
Packages router  —  GET    /packages
                    GET    /packages/{id}
                    POST   /packages     (admin)
                    PUT    /packages/{id} (admin)
                    DELETE /packages/{id} (admin)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from firebase_config import get_db
from dependencies.auth import CurrentUser, require_role
from schemas.service import CreatePackageRequest, PackageResponse, UpdatePackageRequest

router = APIRouter(prefix="/packages", tags=["Packages"])


def _doc_to_package(doc) -> PackageResponse:
    d = doc.to_dict()
    original = d.get("original_price", 0)
    price = d.get("price", 0)
    return PackageResponse(
        id=doc.id,
        name=d["name"],
        tagline=d.get("tagline", ""),
        services=d.get("services", []),
        duration=d.get("duration", ""),
        original_price=original,
        price=price,
        savings=round(original - price, 2),
        active=d.get("active", True),
        badge=d.get("badge"),
        rating=d.get("rating", 0.0),
        total_bookings=d.get("total_bookings", 0),
    )


@router.get("", response_model=list[PackageResponse])
async def list_packages():
    db = get_db()
    docs = db.collection("packages").where("active", "==", True).stream()
    return [_doc_to_package(d) for d in docs]


@router.get("/{package_id}", response_model=PackageResponse)
async def get_package(
    package_id: str,
):
    db = get_db()
    doc = db.collection("packages").document(package_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Package not found.")
    return _doc_to_package(doc)


@router.post("", response_model=PackageResponse, status_code=201)
async def create_package(
    body: CreatePackageRequest,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("packages").document()
    ref.set({
        "name": body.name,
        "tagline": body.tagline,
        "services": body.services,
        "duration": body.duration,
        "original_price": body.original_price,
        "price": body.price,
        "active": body.active,
        "badge": body.badge,
        "rating": 0.0,
        "total_bookings": 0,
    })
    return _doc_to_package(ref.get())


@router.put("/{package_id}", response_model=PackageResponse)
async def update_package(
    package_id: str,
    body: UpdatePackageRequest,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("packages").document(package_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Package not found.")
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    ref.update(updates)
    return _doc_to_package(ref.get())


@router.delete("/{package_id}", status_code=204)
async def delete_package(
    package_id: str,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("packages").document(package_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Package not found.")
    ref.delete()

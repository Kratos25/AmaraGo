"""
Services router  —  GET    /services             (any authenticated user)
                    GET    /services/{id}
                    POST   /services              (admin)
                    PUT    /services/{id}         (admin)
                    DELETE /services/{id}         (admin)

Query params for GET /services:
  - category_id: filter by category
  - search:      partial name match (client-side filter)
  - popular:     "true" to return popular only
  - active:      "true" / "false" (admin; defaults to true for clients)
"""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from firebase_config import get_db
from dependencies.auth import CurrentUser, require_role
from schemas.service import (
    CreateServiceRequest,
    ServiceResponse,
    UpdateServiceRequest,
)

router = APIRouter(prefix="/services", tags=["Services"])


def _doc_to_service(doc) -> ServiceResponse:
    d = doc.to_dict()
    return ServiceResponse(
        id=doc.id,
        name=d["name"],
        category_id=d.get("category_id", ""),
        duration=d.get("duration", ""),
        base_price=d.get("base_price", 0),
        discounted_price=d.get("discounted_price"),
        description=d.get("description", ""),
        active=d.get("active", True),
        popular=d.get("popular", False),
        rating=d.get("rating", 0.0),
        total_bookings=d.get("total_bookings", 0),
    )


@router.get("", response_model=list[ServiceResponse])
async def list_services(
    category_id: Optional[str] = Query(None),
    popular: Optional[bool] = Query(None),
    active: Optional[bool] = Query(None),
):
    db = get_db()
    query = db.collection("services")

    # Public endpoint — always return active services only
    if active is False:
        query = query.where("active", "==", False)
    else:
        query = query.where("active", "==", True)

    if category_id:
        query = query.where("category_id", "==", category_id)
    if popular is not None:
        query = query.where("popular", "==", popular)

    docs = query.stream()
    return [_doc_to_service(d) for d in docs]


@router.get("/{service_id}", response_model=ServiceResponse)
async def get_service(
    service_id: str,
):
    db = get_db()
    doc = db.collection("services").document(service_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Service not found.")
    return _doc_to_service(doc)


@router.post("", response_model=ServiceResponse, status_code=201)
async def create_service(
    body: CreateServiceRequest,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("services").document()
    ref.set({
        "name": body.name,
        "category_id": body.category_id,
        "duration": body.duration,
        "base_price": body.base_price,
        "discounted_price": body.discounted_price,
        "description": body.description,
        "active": body.active,
        "popular": body.popular,
        "rating": 0.0,
        "total_bookings": 0,
    })
    # Update category service count
    cat_ref = db.collection("categories").document(body.category_id)
    if cat_ref.get().exists:
        from google.cloud.firestore import Increment
        cat_ref.update({"service_count": Increment(1)})

    return _doc_to_service(ref.get())


@router.put("/{service_id}", response_model=ServiceResponse)
async def update_service(
    service_id: str,
    body: UpdateServiceRequest,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("services").document(service_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Service not found.")
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    ref.update(updates)
    return _doc_to_service(ref.get())


@router.delete("/{service_id}", status_code=204)
async def delete_service(
    service_id: str,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("services").document(service_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Service not found.")
    data = doc.to_dict()
    ref.delete()
    # Decrement category service count
    cat_ref = db.collection("categories").document(data.get("category_id", ""))
    if cat_ref.get().exists:
        from google.cloud.firestore import Increment
        cat_ref.update({"service_count": Increment(-1)})

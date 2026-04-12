"""
Categories router  —  GET    /categories
                       POST   /categories        (admin)
                       PUT    /categories/{id}   (admin)
                       DELETE /categories/{id}   (admin)
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from firebase_config import get_db
from dependencies.auth import CurrentUser, require_role
from schemas.service import (
    CategoryResponse,
    CreateCategoryRequest,
    UpdateCategoryRequest,
)

router = APIRouter(prefix="/categories", tags=["Categories"])


def _doc_to_category(doc) -> CategoryResponse:
    d = doc.to_dict()
    return CategoryResponse(
        id=doc.id,
        name=d["name"],
        icon=d.get("icon", ""),
        description=d.get("description", ""),
        active=d.get("active", True),
        service_count=d.get("service_count", 0),
    )


@router.get("", response_model=list[CategoryResponse])
async def list_categories():
    db = get_db()
    docs = db.collection("categories").order_by("name").stream()
    return [_doc_to_category(d) for d in docs]


@router.get("/active", response_model=list[CategoryResponse])
async def list_active_categories():
    """Return only active categories — used by the Add Service form."""
    db = get_db()
    docs = (
        db.collection("categories")
        .where("active", "==", True)
        .order_by("name")
        .stream()
    )
    return [_doc_to_category(d) for d in docs]


@router.post("", response_model=CategoryResponse, status_code=201)
async def create_category(
    body: CreateCategoryRequest,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("categories").document()
    ref.set({
        "name": body.name,
        "icon": body.icon,
        "description": body.description,
        "active": body.active,
        "service_count": 0,
    })
    doc = ref.get()
    return _doc_to_category(doc)


@router.put("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: str,
    body: UpdateCategoryRequest,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("categories").document(category_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Category not found.")
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    ref.update(updates)
    return _doc_to_category(ref.get())


@router.delete("/{category_id}", status_code=204)
async def delete_category(
    category_id: str,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("categories").document(category_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Category not found.")
    ref.delete()

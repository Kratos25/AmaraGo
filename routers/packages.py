"""
Packages router  —  GET    /packages
                    GET    /packages/{id}
                    POST   /packages     (admin)
                    PUT    /packages/{id} (admin)
                    DELETE /packages/{id} (admin)
"""

from __future__ import annotations

import io
import mimetypes
import os
import urllib.parse
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile

from firebase_config import get_db
from dependencies.auth import CurrentUser, require_role
from schemas.service import CreatePackageRequest, PackageResponse, UpdatePackageRequest

router = APIRouter(prefix="/packages", tags=["Packages"])

ALLOWED_IMAGE_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_BYTES = 5 * 1024 * 1024
_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "")


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
        image_url=d.get("image_url"),
    )


@router.get("", response_model=list[PackageResponse])
async def list_packages(
    all: Optional[bool] = Query(None, alias="all"),
    active: Optional[bool] = Query(None),
):
    db = get_db()
    query = db.collection("packages")
    if not all:
        if active is False:
            query = query.where("active", "==", False)
        else:
            query = query.where("active", "==", True)
    docs = query.stream()
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
        "image_url": None,
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


@router.post("/{package_id}/thumbnail")
async def upload_package_thumbnail(
    package_id: str,
    file: UploadFile = File(...),
    _admin: CurrentUser = Depends(require_role("admin")),
):
    """Upload and set a thumbnail image for a package. Resizes to 800×600 WebP."""
    from PIL import Image as PILImage

    content_type = file.content_type or mimetypes.guess_type(file.filename or "")[0] or ""
    if content_type not in ALLOWED_IMAGE_MIME:
        raise HTTPException(status_code=415, detail=f"Unsupported type: {content_type}. Use JPEG, PNG, or WebP.")

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="File too large. Max 5 MB.")

    img = PILImage.open(io.BytesIO(data)).convert("RGB")
    img.thumbnail((800, 600), PILImage.LANCZOS)
    buf = io.BytesIO()
    img.save(buf, format="WEBP", quality=85)
    buf.seek(0)
    webp_data = buf.read()

    storage_path = f"thumbnails/packages/{package_id}.webp"

    try:
        from firebase_admin import storage as fb_storage
        bucket = fb_storage.bucket(_STORAGE_BUCKET)
        blob = bucket.blob(storage_path)
        blob.upload_from_string(webp_data, content_type="image/webp")
        # Attach a stable download token so the URL works without signing
        token = str(uuid.uuid4())
        blob.metadata = {"firebaseStorageDownloadTokens": token}
        blob.patch()
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {exc}")

    name_enc = urllib.parse.quote(storage_path, safe="")
    url = f"https://firebasestorage.googleapis.com/v0/b/{_STORAGE_BUCKET}/o/{name_enc}?alt=media&token={token}"

    db = get_db()
    db.collection("packages").document(package_id).update({"image_url": url})
    return {"url": url}

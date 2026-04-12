"""
Coupons router  —  GET    /coupons                  (admin)
                   POST   /coupons                  (admin)
                   PUT    /coupons/{id}             (admin)
                   DELETE /coupons/{id}             (admin)
                   POST   /coupons/validate         (any authenticated user)
"""

from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status

from firebase_config import get_db
from dependencies.auth import CurrentUser, get_current_user, require_role
from schemas.coupon import (
    CouponResponse,
    CreateCouponRequest,
    UpdateCouponRequest,
    ValidateCouponRequest,
    ValidateCouponResponse,
)

router = APIRouter(prefix="/coupons", tags=["Coupons"])

CONVENIENCE_FEE = 99.0


def _doc_to_coupon(doc) -> CouponResponse:
    d = doc.to_dict()
    return CouponResponse(
        id=doc.id,
        code=d["code"],
        description=d.get("description", ""),
        type=d["type"],
        value=d["value"],
        min_order=d.get("min_order", 0),
        max_discount=d.get("max_discount"),
        usage_limit=d.get("usage_limit", 1),
        used_count=d.get("used_count", 0),
        valid_from=d.get("valid_from", ""),
        valid_to=d.get("valid_to", ""),
        applicable_for=d.get("applicable_for", "all"),
        auto_apply=d.get("auto_apply", False),
        active=d.get("active", True),
    )


@router.get("", response_model=list[CouponResponse])
async def list_coupons(
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    docs = db.collection("coupons").stream()
    return [_doc_to_coupon(d) for d in docs]


@router.get("/active", response_model=list[CouponResponse])
async def list_active_coupons():
    """Return all currently active coupons visible to clients (for promo banners)."""
    db = get_db()
    today = date.today().isoformat()
    docs = (
        db.collection("coupons")
        .where("active", "==", True)
        .stream()
    )
    results = []
    for doc in docs:
        c = doc.to_dict()
        if c.get("valid_from", "0000-01-01") <= today <= c.get("valid_to", "9999-12-31"):
            results.append(_doc_to_coupon(doc))
    return results


@router.post("", response_model=CouponResponse, status_code=201)
async def create_coupon(
    body: CreateCouponRequest,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    # Ensure code is unique
    existing = db.collection("coupons").where("code", "==", body.code).get()
    if existing:
        raise HTTPException(status_code=409, detail="Coupon code already exists.")

    ref = db.collection("coupons").document()
    ref.set({
        "code": body.code,
        "description": body.description,
        "type": body.type,
        "value": body.value,
        "min_order": body.min_order,
        "max_discount": body.max_discount,
        "usage_limit": body.usage_limit,
        "used_count": 0,
        "valid_from": body.valid_from,
        "valid_to": body.valid_to,
        "applicable_for": body.applicable_for,
        "auto_apply": body.auto_apply,
        "active": body.active,
    })
    return _doc_to_coupon(ref.get())


@router.put("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: str,
    body: UpdateCouponRequest,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("coupons").document(coupon_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Coupon not found.")
    updates = body.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update.")
    ref.update(updates)
    return _doc_to_coupon(ref.get())


@router.delete("/{coupon_id}", status_code=204)
async def delete_coupon(
    coupon_id: str,
    _admin: CurrentUser = Depends(require_role("admin")),
):
    db = get_db()
    ref = db.collection("coupons").document(coupon_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Coupon not found.")
    ref.delete()


@router.post("/validate", response_model=ValidateCouponResponse)
async def validate_coupon(
    body: ValidateCouponRequest,
    _user: CurrentUser = Depends(get_current_user),
):
    """Validate a coupon code and return the discount amount."""
    db = get_db()
    docs = db.collection("coupons").where("code", "==", body.code.upper()).get()

    if not docs:
        return ValidateCouponResponse(valid=False, message="Invalid coupon code.")

    coupon_doc = docs[0]
    c = coupon_doc.to_dict()

    if not c.get("active", False):
        return ValidateCouponResponse(valid=False, message="This coupon is no longer active.")

    today = date.today().isoformat()
    if c.get("valid_to", "9999-12-31") < today:
        return ValidateCouponResponse(valid=False, message="Coupon has expired.")
    if c.get("valid_from", "0000-01-01") > today:
        return ValidateCouponResponse(valid=False, message="Coupon is not yet active.")

    if c.get("used_count", 0) >= c.get("usage_limit", 1):
        return ValidateCouponResponse(valid=False, message="Coupon usage limit reached.")

    if body.order_amount < c.get("min_order", 0):
        return ValidateCouponResponse(
            valid=False,
            message=f"Minimum order amount is ₹{c['min_order']:.0f}.",
        )

    # Calculate discount
    if c["type"] == "percentage":
        discount = round(body.order_amount * c["value"] / 100, 2)
        if c.get("max_discount"):
            discount = min(discount, c["max_discount"])
    else:  # flat
        discount = min(c["value"], body.order_amount)

    return ValidateCouponResponse(
        valid=True,
        discount_amount=discount,
        message=f"Coupon applied! You save ₹{discount:.0f}.",
        coupon=_doc_to_coupon(coupon_doc),
    )

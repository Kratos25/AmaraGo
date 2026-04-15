"""
Cart router  —  supports both authenticated users (uid) and guests (guest_id cookie/header).

GET    /cart                  — fetch cart items
POST   /cart                  — add item
PUT    /cart/{item_id}        — update quantity
DELETE /cart/{item_id}        — remove item
DELETE /cart                  — clear entire cart
POST   /cart/merge            — merge guest cart into user cart after login

Cart document structure in Firestore:
  carts/{cart_owner_id}/items/{item_id}

cart_owner_id = uid (logged-in) or guest_{guest_token} (anonymous)
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from firebase_admin import auth as firebase_auth
from firebase_config import get_db
from dependencies.auth import CurrentUser, get_current_user

router = APIRouter(prefix="/cart", tags=["Cart"])

_optional_bearer = HTTPBearer(auto_error=False)


# ── Helpers ────────────────────────────────────────────────────────────────────

def _resolve_owner(
    creds: Optional[HTTPAuthorizationCredentials],
    x_guest_id: Optional[str],
) -> str:
    """Return cart owner id: uid if token valid, else guest_<token>."""
    if creds:
        try:
            decoded = firebase_auth.verify_id_token(creds.credentials)
            db = get_db()
            user_doc = db.collection("users").document(decoded["uid"]).get()
            if user_doc.exists:
                return decoded["uid"]
        except Exception:
            pass
    if x_guest_id:
        return f"guest_{x_guest_id}"
    raise HTTPException(status_code=400, detail="Provide Authorization header or X-Guest-Id header.")


def _item_ref(db, owner_id: str, item_id: str):
    return db.collection("carts").document(owner_id).collection("items").document(item_id)


def _items_collection(db, owner_id: str):
    return db.collection("carts").document(owner_id).collection("items")


# ── Schemas ────────────────────────────────────────────────────────────────────

class CartItem(BaseModel):
    id: str
    service_id: Optional[str] = None
    package_id: Optional[str] = None
    name: str
    price: float
    duration: Optional[str] = None
    quantity: int = 1
    image_url: Optional[str] = None
    added_at: Optional[str] = None


class AddToCartRequest(BaseModel):
    service_id: Optional[str] = None
    package_id: Optional[str] = None
    name: str
    price: float
    duration: Optional[str] = None
    quantity: int = 1
    image_url: Optional[str] = None


class UpdateCartItemRequest(BaseModel):
    quantity: int


class CartSummary(BaseModel):
    items: list[CartItem]
    subtotal: float
    item_count: int


class MergeCartRequest(BaseModel):
    guest_id: str   # the guest token (without "guest_" prefix)


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("", response_model=CartSummary)
async def get_cart(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    x_guest_id: Optional[str] = Header(None),
):
    owner_id = _resolve_owner(creds, x_guest_id)
    db = get_db()
    docs = _items_collection(db, owner_id).stream()
    items = []
    for doc in docs:
        d = doc.to_dict()
        items.append(CartItem(
            id=doc.id,
            service_id=d.get("service_id"),
            package_id=d.get("package_id"),
            name=d.get("name", ""),
            price=d.get("price", 0),
            duration=d.get("duration"),
            quantity=d.get("quantity", 1),
            image_url=d.get("image_url"),
            added_at=d.get("added_at"),
        ))
    subtotal = round(sum(i.price * i.quantity for i in items), 2)
    return CartSummary(items=items, subtotal=subtotal, item_count=sum(i.quantity for i in items))


@router.post("", response_model=CartItem, status_code=201)
async def add_to_cart(
    body: AddToCartRequest,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    x_guest_id: Optional[str] = Header(None),
):
    if not body.service_id and not body.package_id:
        raise HTTPException(status_code=400, detail="Provide service_id or package_id.")

    owner_id = _resolve_owner(creds, x_guest_id)
    db = get_db()
    col = _items_collection(db, owner_id)

    # Check if item already exists — if so, increment quantity
    key = body.service_id or body.package_id
    field = "service_id" if body.service_id else "package_id"
    existing = col.where(field, "==", key).limit(1).get()

    if existing:
        doc = existing[0]
        new_qty = doc.to_dict().get("quantity", 1) + body.quantity
        doc.reference.update({"quantity": new_qty})
        d = doc.reference.get().to_dict()
        return CartItem(id=doc.id, quantity=new_qty, **{k: d.get(k) for k in
            ["service_id","package_id","name","price","duration","image_url","added_at"]})

    ref = col.document()
    data = {
        "service_id": body.service_id,
        "package_id": body.package_id,
        "name": body.name,
        "price": body.price,
        "duration": body.duration,
        "quantity": body.quantity,
        "image_url": body.image_url,
        "added_at": datetime.now(timezone.utc).isoformat(),
    }
    ref.set(data)
    return CartItem(id=ref.id, **data)


@router.put("/{item_id}", response_model=CartItem)
async def update_cart_item(
    item_id: str,
    body: UpdateCartItemRequest,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    x_guest_id: Optional[str] = Header(None),
):
    if body.quantity < 1:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1.")
    owner_id = _resolve_owner(creds, x_guest_id)
    db = get_db()
    ref = _item_ref(db, owner_id, item_id)
    doc = ref.get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Cart item not found.")
    ref.update({"quantity": body.quantity})
    d = ref.get().to_dict()
    return CartItem(id=item_id, **{k: d.get(k) for k in
        ["service_id","package_id","name","price","duration","quantity","image_url","added_at"]})


@router.delete("/{item_id}", status_code=204)
async def remove_cart_item(
    item_id: str,
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    x_guest_id: Optional[str] = Header(None),
):
    owner_id = _resolve_owner(creds, x_guest_id)
    db = get_db()
    ref = _item_ref(db, owner_id, item_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="Cart item not found.")
    ref.delete()


@router.delete("", status_code=204)
async def clear_cart(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_optional_bearer),
    x_guest_id: Optional[str] = Header(None),
):
    owner_id = _resolve_owner(creds, x_guest_id)
    db = get_db()
    docs = _items_collection(db, owner_id).stream()
    for doc in docs:
        doc.reference.delete()


@router.post("/merge", status_code=200)
async def merge_guest_cart(
    body: MergeCartRequest,
    current_user: CurrentUser = Depends(get_current_user),
):
    """
    After login, call this to merge guest_<guest_id> cart into the user's cart.
    Guest cart items are moved over; if item already exists in user cart, quantities are summed.
    The guest cart is cleared after merge.
    """
    db = get_db()
    guest_owner = f"guest_{body.guest_id}"
    user_owner = current_user.uid

    guest_items = list(_items_collection(db, guest_owner).stream())
    if not guest_items:
        return {"merged": 0}

    merged = 0
    for gdoc in guest_items:
        gdata = gdoc.to_dict()
        key = gdata.get("service_id") or gdata.get("package_id")
        field = "service_id" if gdata.get("service_id") else "package_id"

        existing = _items_collection(db, user_owner).where(field, "==", key).limit(1).get()
        if existing:
            existing[0].reference.update(
                {"quantity": existing[0].to_dict().get("quantity", 1) + gdata.get("quantity", 1)}
            )
        else:
            _items_collection(db, user_owner).document().set(gdata)

        gdoc.reference.delete()
        merged += 1

    return {"merged": merged}
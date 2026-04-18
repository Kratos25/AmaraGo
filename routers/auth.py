"""
Auth router  —  POST /auth/register/client
                POST /auth/register/provider
                GET  /auth/me

The frontend handles Firebase sign-in (email/password or Google).
After a successful Firebase sign-in the frontend calls one of the register
endpoints once to persist the user profile in Firestore.
Subsequent calls to GET /auth/me just return the stored profile.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, status

from firebase_admin import auth as firebase_auth
from firebase_config import get_db
from dependencies.auth import CurrentUser, get_current_user
from schemas.auth import RegisterClientRequest, RegisterProviderRequest, RegisterResponse
from schemas.user import UserResponse

from fastapi import Depends
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["Auth"])


# ── helpers ───────────────────────────────────────────────────────────────────

def _verify_id_token(token: str) -> str:
    """Return uid after verifying token; raise 401 on failure."""
    try:
        decoded = firebase_auth.verify_id_token(token)
        return decoded["uid"]
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Firebase ID token.",
        )


# ── Register: Client ─────────────────────────────────────────────────────────

@router.post("/register/client", response_model=RegisterResponse, status_code=201)
async def register_client(body: RegisterClientRequest):
    """
    Create a client profile in Firestore.
    The Firebase account must already exist (created on the frontend).
    """
    uid = _verify_id_token(body.id_token)

    if uid != body.firebase_uid:
        raise HTTPException(status_code=400, detail="UID mismatch.")

    db = get_db()
    ref = db.collection("users").document(uid)

    if ref.get().exists:
        # Already registered — just return their role
        data = ref.get().to_dict()
        return RegisterResponse(uid=uid, role=data.get("role", "client"), message="Already registered.")

    ref.set({
        "uid": uid,
        "name": body.name,
        "email": body.email,
        "phone": body.phone,
        "role": "client",
        "profile_image": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    return RegisterResponse(uid=uid, role="client", message="Client registered successfully.")


# ── Register: Provider ───────────────────────────────────────────────────────

@router.post("/register/provider", response_model=RegisterResponse, status_code=201)
async def register_provider(body: RegisterProviderRequest):
    """
    Create a service-provider profile in Firestore.
    Account status is 'pending' until an admin approves it.
    """
    uid = _verify_id_token(body.id_token)

    if uid != body.firebase_uid:
        raise HTTPException(status_code=400, detail="UID mismatch.")

    db = get_db()
    user_ref = db.collection("users").document(uid)
    provider_ref = db.collection("provider_profiles").document(uid)

    # Check the provider profile (not the user doc) to detect duplicates.
    # A user may already exist as a client and be upgrading to a provider.
    existing_provider = provider_ref.get()
    if existing_provider.exists:
        prov_data = existing_provider.to_dict()
        is_approved = prov_data.get("is_approved", False)
        return RegisterResponse(uid=uid, role="pending_sp", message="Already registered.", is_approved=is_approved)

    now = datetime.now(timezone.utc).isoformat()

    existing_user = user_ref.get()
    if existing_user.exists:
        # Upgrade existing client (or any role) to pending_sp
        user_ref.update({"role": "pending_sp"})
    else:
        # Brand-new user — create their user document
        user_ref.set({
            "uid": uid,
            "name": body.name,
            "email": body.email,
            "phone": body.phone,
            "role": "pending_sp",
            "profile_image": None,
            "created_at": now,
        })

    provider_ref.set({
        "uid": uid,
        "bio": body.bio,
        "experience_years": body.experience_years,
        "services_offered": body.services_offered,
        "location": body.location,
        "certifications": [],
        "portfolio": [],
        "rating": 0.0,
        "total_jobs": 0,
        "is_online": False,
        "is_approved": False,
        "commission_rate": 15.0,
        "created_at": now,
    })

    return RegisterResponse(uid=uid, role="pending_sp", message="Provider registered. Awaiting admin approval.", is_approved=False)


# ── Me (get current user) ─────────────────────────────────────────────────────

@router.get("/me", response_model=UserResponse)
async def me(current_user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    doc = db.collection("users").document(current_user.uid).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="User not found.")
    data = doc.to_dict()
    return UserResponse(
        uid=current_user.uid,
        name=data.get("name", ""),
        email=data.get("email"),
        phone=data.get("phone"),
        role=data.get("role", "client"),
        profile_image=data.get("profile_image"),
        created_at=data.get("created_at"),
    )
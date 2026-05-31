"""
FastAPI dependency that verifies the Firebase Bearer token sent by the
frontend and returns a typed CurrentUser object.

Usage in a route:
    @router.get("/me")
    async def me(current_user: CurrentUser = Depends(get_current_user)):
        ...

    @router.delete("/something")
    async def admin_only(current_user: CurrentUser = Depends(require_role("admin"))):
        ...
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

import os

from firebase_admin import auth as firebase_auth
from firebase_config import get_db

_ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "").lower().strip()

_bearer_scheme = HTTPBearer(auto_error=True)
_bearer_scheme_optional = HTTPBearer(auto_error=False)


@dataclass
class CurrentUser:
    uid: str
    email: str | None
    role: str  # "client" | "service_provider" | "admin"
    name: str | None = None


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> CurrentUser:
    """Verify the Firebase ID token and return the authenticated user."""
    token = creds.credentials
    try:
        decoded = firebase_auth.verify_id_token(token)
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired.",
        )
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token.",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials.",
        )

    uid = decoded["uid"]
    db = get_db()
    user_doc = db.collection("users").document(uid).get()

    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User profile not found. Please complete registration.",
        )

    data = user_doc.to_dict()
    email_val: str = (data.get("email") or decoded.get("email") or "").lower().strip()
    # If this email is designated as the super-admin via env var, always grant admin role
    role = "admin" if (_ADMIN_EMAIL and email_val == _ADMIN_EMAIL) else data.get("role", "client")
    return CurrentUser(
        uid=uid,
        email=email_val or None,
        role=role,
        name=data.get("name") or data.get("displayName"),
    )


def require_role(*roles: str) -> Callable:
    """Return a dependency that asserts the current user has one of the given roles."""

    async def _check(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {', '.join(roles)}.",
            )
        return current_user

    return _check


async def get_optional_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(_bearer_scheme_optional),
) -> Optional[CurrentUser]:
    """Like get_current_user but returns None instead of 401 when no token is supplied.
    Used for endpoints that are public but may offer elevated access to authenticated users.
    """
    if creds is None:
        return None
    try:
        decoded = firebase_auth.verify_id_token(creds.credentials)
    except Exception:
        return None

    uid = decoded["uid"]
    db = get_db()
    user_doc = db.collection("users").document(uid).get()
    if not user_doc.exists:
        return None

    data = user_doc.to_dict()
    email_val: str = (data.get("email") or decoded.get("email") or "").lower().strip()
    role = "admin" if (_ADMIN_EMAIL and email_val == _ADMIN_EMAIL) else data.get("role", "client")
    return CurrentUser(
        uid=uid,
        email=email_val or None,
        role=role,
        name=data.get("name") or data.get("displayName"),
    )

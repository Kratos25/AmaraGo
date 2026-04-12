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
from typing import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from firebase_admin import auth as firebase_auth
from firebase_config import get_db

_bearer_scheme = HTTPBearer(auto_error=True)


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
    return CurrentUser(
        uid=uid,
        email=data.get("email") or decoded.get("email"),
        role=data.get("role", "client"),
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

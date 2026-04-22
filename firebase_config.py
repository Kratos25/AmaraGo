"""
Firebase Admin SDK initialisation.

Credential resolution order:
  1. FIREBASE_SERVICE_ACCOUNT_PATH  — path to a JSON key file (local dev default)
  2. FIREBASE_SERVICE_ACCOUNT_JSON  — entire JSON contents as an env var string (Cloud Run)
"""

from __future__ import annotations

import json
import os
import firebase_admin
from firebase_admin import auth, credentials, firestore, storage
from dotenv import load_dotenv

load_dotenv()

_SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./amara_go_service_account.json")
_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "")


def _init_app() -> None:
    if firebase_admin._apps:
        return

    if os.path.isfile(_SERVICE_ACCOUNT_PATH):
        # Local dev — use the JSON file directly
        cred = credentials.Certificate(_SERVICE_ACCOUNT_PATH)
    else:
        # Cloud Run — JSON passed as an env var string
        sa_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
        if not sa_json:
            raise RuntimeError(
                "Firebase credentials not found. Set FIREBASE_SERVICE_ACCOUNT_PATH (local) or "
                "FIREBASE_SERVICE_ACCOUNT_JSON (Cloud Run)."
            )
        cred = credentials.Certificate(json.loads(sa_json))

    opts = {"storageBucket": _STORAGE_BUCKET} if _STORAGE_BUCKET else {}
    firebase_admin.initialize_app(cred, opts)


_init_app()

# ── Public helpers ────────────────────────────────────────────────────────────

def get_auth() -> auth.Client:
    """Return the Firebase Auth client."""
    return auth


def get_db() -> firestore.Client:
    """Return a Firestore client (call per request; client is thread-safe)."""
    return firestore.client()


def get_bucket():
    """Return the default Firebase Storage bucket."""
    return storage.bucket()

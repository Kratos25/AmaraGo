"""
Firebase Admin SDK initialisation.

Reads credentials from either:
  - FIREBASE_SERVICE_ACCOUNT_PATH  (path to a JSON key file)
On first import the default app is initialised exactly once.
"""

from __future__ import annotations

import os
import firebase_admin
from firebase_admin import auth, credentials, firestore, storage
from dotenv import load_dotenv

load_dotenv()

_SERVICE_ACCOUNT_PATH = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "./serviceAccountKey.json")
_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "")


def _init_app() -> None:
    if firebase_admin._apps:
        return
    cred = credentials.Certificate(_SERVICE_ACCOUNT_PATH)
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

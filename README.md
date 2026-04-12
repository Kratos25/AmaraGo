# ─────────────────────────────────────────────────────────────
# AmaraGo Backend
# ─────────────────────────────────────────────────────────────
# Python 3.11+
# FastAPI + Firebase Admin SDK
#
# Directory layout:
#   backend/
#   ├── main.py
#   ├── firebase_config.py
#   ├── dependencies/
#   │   └── auth.py
#   ├── routers/
#   │   ├── auth.py
#   │   ├── users.py
#   │   ├── categories.py
#   │   ├── services.py
#   │   ├── packages.py
#   │   ├── coupons.py
#   │   ├── addresses.py
#   │   ├── bookings.py
#   │   ├── providers.py
#   │   └── admin.py
#   └── schemas/
#       ├── auth.py
#       ├── user.py
#       ├── service.py
#       ├── booking.py
#       ├── provider.py
#       └── address.py
#
# Setup:
#   1. python -m venv .venv && source .venv/bin/activate
#   2. pip install -r requirements.txt
#   3. cp .env.example .env  →  fill in FIREBASE_SERVICE_ACCOUNT_PATH
#   4. uvicorn main:app --reload
# ─────────────────────────────────────────────────────────────

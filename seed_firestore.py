"""
Seed script — populates Firestore with the categories, services, packages and
one example admin user found in shared.tsx.

Run once after pointing FIREBASE_SERVICE_ACCOUNT_PATH at your key file:

    python seed_firestore.py

It is safe to run multiple times — existing documents are overwritten with
the same data (set with merge=False replaces the document).
"""

from __future__ import annotations

import sys
from firebase_config import get_db  # initialises Firebase as a side-effect

db = get_db()


# ── Categories ────────────────────────────────────────────────────────────────

CATEGORIES = [
    {"id": "cat1", "name": "Hair Care",     "icon": "✂️",  "description": "Cuts, styling, spa & coloring",    "active": True,  "service_count": 0},
    {"id": "cat2", "name": "Skin Care",     "icon": "🧴",  "description": "Facials, cleanup & treatments",    "active": True,  "service_count": 0},
    {"id": "cat3", "name": "Makeup",        "icon": "💄",  "description": "Party, bridal & HD makeup",        "active": True,  "service_count": 0},
    {"id": "cat4", "name": "Nail Art",      "icon": "💅",  "description": "Nail art, gel & extensions",       "active": True,  "service_count": 0},
    {"id": "cat5", "name": "Spa & Massage", "icon": "🧖‍♀️", "description": "Body treatments & relaxation",    "active": True,  "service_count": 0},
    {"id": "cat6", "name": "Waxing",        "icon": "🪒",  "description": "Full body & bikini waxing",        "active": True,  "service_count": 0},
    {"id": "cat7", "name": "Bridal",        "icon": "👰",  "description": "Complete bridal packages",         "active": True,  "service_count": 0},
    {"id": "cat8", "name": "Eyebrows",      "icon": "👁️",  "description": "Shaping & threading",             "active": False, "service_count": 0},
]

# ── Services ──────────────────────────────────────────────────────────────────

SERVICES = [
    {"id": "s1",  "name": "Classic Haircut + Blow Dry",  "category_id": "cat1", "duration": "60 min",  "base_price": 1200, "discounted_price": 899,  "description": "Precision cut with professional blow dry finish.",     "active": True,  "popular": True,  "rating": 4.8, "total_bookings": 1240},
    {"id": "s2",  "name": "Hair Spa Treatment",           "category_id": "cat1", "duration": "75 min",  "base_price": 1500, "discounted_price": 1099, "description": "Deep conditioning and scalp massage.",                 "active": True,  "popular": False, "rating": 4.6, "total_bookings": 876},
    {"id": "s3",  "name": "Keratin Treatment",            "category_id": "cat1", "duration": "180 min", "base_price": 5000, "discounted_price": None, "description": "Smoothing treatment for frizz-free hair.",            "active": True,  "popular": False, "rating": 4.7, "total_bookings": 312},
    {"id": "s4",  "name": "HydraFacial Signature",        "category_id": "cat2", "duration": "75 min",  "base_price": 4500, "discounted_price": 3299, "description": "Deep cleanse, exfoliate and hydrate.",                 "active": True,  "popular": True,  "rating": 4.9, "total_bookings": 956},
    {"id": "s5",  "name": "Gold Facial",                  "category_id": "cat2", "duration": "60 min",  "base_price": 2000, "discounted_price": 1599, "description": "24K gold-infused brightening facial.",                "active": True,  "popular": True,  "rating": 4.8, "total_bookings": 1450},
    {"id": "s6",  "name": "Party Makeup",                 "category_id": "cat3", "duration": "90 min",  "base_price": 2500, "discounted_price": 1999, "description": "Full glam look for any occasion.",                    "active": True,  "popular": True,  "rating": 4.8, "total_bookings": 1120},
    {"id": "s7",  "name": "Bridal Makeup",                "category_id": "cat3", "duration": "180 min", "base_price": 6000, "discounted_price": 4999, "description": "Head-to-toe bridal transformation.",                  "active": True,  "popular": True,  "rating": 4.9, "total_bookings": 432},
    {"id": "s8",  "name": "Gel Nail Extension",           "category_id": "cat4", "duration": "120 min", "base_price": 2800, "discounted_price": 2099, "description": "Long-lasting gel nail extensions.",                   "active": True,  "popular": False, "rating": 4.7, "total_bookings": 562},
    {"id": "s9",  "name": "Nail Art Design",              "category_id": "cat4", "duration": "45 min",  "base_price": 700,  "discounted_price": None, "description": "Custom nail art and designs.",                        "active": True,  "popular": False, "rating": 4.6, "total_bookings": 890},
    {"id": "s10", "name": "Aroma Body Massage",           "category_id": "cat5", "duration": "90 min",  "base_price": 2500, "discounted_price": 1999, "description": "Relaxing aromatherapy full body massage.",            "active": True,  "popular": False, "rating": 4.8, "total_bookings": 678},
    {"id": "s11", "name": "Full Body Waxing",             "category_id": "cat6", "duration": "60 min",  "base_price": 1200, "discounted_price": 999,  "description": "Complete full body waxing service.",                  "active": True,  "popular": False, "rating": 4.5, "total_bookings": 987},
    {"id": "s12", "name": "Eyebrow Threading",            "category_id": "cat8", "duration": "15 min",  "base_price": 150,  "discounted_price": None, "description": "Precise eyebrow shaping and threading.",              "active": False, "popular": False, "rating": 4.4, "total_bookings": 2100},
]

# ── Packages ──────────────────────────────────────────────────────────────────

PACKAGES = [
    {"id": "pkg1", "name": "Bridal Glow Package",  "tagline": "Everything you need to shine on your big day",  "services": ["Bridal Makeup", "Hair Spa", "Gold Facial", "Nail Art", "Body Massage"], "duration": "5 hours",   "original_price": 15000, "price": 12999, "active": True,  "badge": "🔥 Best Seller", "rating": 4.9, "total_bookings": 148},
    {"id": "pkg2", "name": "Luxury Spa Day",        "tagline": "A complete day of pampering and relaxation",    "services": ["Aroma Body Massage", "HydraFacial", "Body Polishing"],               "duration": "4 hours",   "original_price": 10500, "price": 8499,  "active": True,  "badge": "✨ Premium",    "rating": 4.8, "total_bookings": 89},
    {"id": "pkg3", "name": "Party Ready Package",   "tagline": "Look stunning for any event",                   "services": ["Party Makeup", "Hair Styling", "Nail Art"],                           "duration": "3 hours",   "original_price": 5200,  "price": 3999,  "active": True,  "badge": None,             "rating": 4.7, "total_bookings": 234},
    {"id": "pkg4", "name": "Monthly Glow Kit",      "tagline": "Your monthly self-care ritual",                 "services": ["Gold Facial", "Hair Spa", "Full Body Waxing"],                        "duration": "3.5 hours", "original_price": 4700,  "price": 3499,  "active": False, "badge": None,             "rating": 4.6, "total_bookings": 312},
]

# ── Welcome coupon ────────────────────────────────────────────────────────────

COUPONS = [
    {
        "id": "cpn1",
        "code": "WELCOME20",
        "description": "20% off your first booking",
        "type": "percentage",
        "value": 20,
        "min_order": 500,
        "max_discount": 500,
        "usage_limit": 1000,
        "used_count": 0,
        "valid_from": "2024-01-01",
        "valid_to": "2027-12-31",
        "applicable_for": "new_users",
        "auto_apply": False,
        "active": True,
    }
]

# ── Seed functions ────────────────────────────────────────────────────────────

def seed_collection(collection: str, items: list[dict], id_field: str = "id") -> None:
    col = db.collection(collection)
    for item in items:
        doc_id = item.get(id_field)
        data = {k: v for k, v in item.items() if k != id_field}
        if doc_id:
            col.document(doc_id).set(data)
        else:
            col.document().set(data)
        print(f"  ✓ {collection}/{doc_id or '(auto)'}: {item.get('name', '')}")


def main() -> None:
    print("\n── Seeding Firestore ──────────────────────────────────────────────")
    print("\n[1/4] Categories")
    seed_collection("categories", CATEGORIES)

    print("\n[2/4] Services")
    seed_collection("services", SERVICES)

    # Update category service_count
    cat_counts: dict[str, int] = {}
    for s in SERVICES:
        if s.get("active"):
            cat_counts[s["category_id"]] = cat_counts.get(s["category_id"], 0) + 1
    for cat_id, count in cat_counts.items():
        db.collection("categories").document(cat_id).update({"service_count": count})
        print(f"  ✓ categories/{cat_id}: service_count={count}")

    print("\n[3/4] Packages")
    seed_collection("packages", PACKAGES)

    print("\n[4/4] Coupons")
    seed_collection("coupons", COUPONS)

    print("\n── Seeding complete ✓ ─────────────────────────────────────────────\n")


if __name__ == "__main__":
    main()

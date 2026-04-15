"""Pydantic schemas for User endpoints."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

from schemas.address import AddressResponse


# ── Loyalty helpers ────────────────────────────────────────────────────────────

TIER_THRESHOLDS = [
    ("Silver",   0),
    ("Gold",     2000),
    ("Platinum", 4000),
    ("Diamond",  6000),
]

TIER_BENEFITS = {
    "Silver":   {"discount_pct": 0,  "label": "Welcome tier"},
    "Gold":     {"discount_pct": 5,  "label": "5% off every booking"},
    "Platinum": {"discount_pct": 10, "label": "10% off every booking"},
    "Diamond":  {"discount_pct": 15, "label": "15% off every booking"},
}


def calculate_tier(points: int) -> str:
    tier = "Silver"
    for name, threshold in TIER_THRESHOLDS:
        if points >= threshold:
            tier = name
    return tier


def next_tier_info(points: int) -> dict:
    """Return next_tier name, points_needed, and progress 0-100."""
    for i, (name, threshold) in enumerate(TIER_THRESHOLDS):
        if points < threshold:
            prev_threshold = TIER_THRESHOLDS[i - 1][1] if i > 0 else 0
            span = threshold - prev_threshold
            earned = points - prev_threshold
            return {
                "next_tier": name,
                "points_needed": threshold - points,
                "progress": round((earned / span) * 100),
            }
    # Already at Diamond
    return {"next_tier": None, "points_needed": 0, "progress": 100}


# ── Schemas ────────────────────────────────────────────────────────────────────

class UserResponse(BaseModel):
    uid: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str  # client | service_provider | admin
    profile_image: Optional[str] = None
    created_at: Optional[datetime] = None


class ClientProfileResponse(UserResponse):
    """Extended profile returned to clients — includes loyalty & addresses."""
    points: int = 0
    tier: str = "Silver"
    tier_discount_pct: int = 0
    next_tier: Optional[str] = None
    points_needed_for_next_tier: int = 0
    tier_progress: int = 0          # 0-100
    bookings_count: int = 0
    saved_addresses: list[AddressResponse] = []


class UpdateUserRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=7, max_length=20)
    profile_image: Optional[str] = None
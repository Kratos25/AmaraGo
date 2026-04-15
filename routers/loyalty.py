"""
Loyalty router  —  GET  /loyalty/me          (current user's points & tier)
                   GET  /loyalty/history      (points transaction history)

Points are awarded automatically by the bookings router on completion.
Rule: ₹1 spent = 0.5 point  (i.e. total_price * 0.5, rounded)
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Depends

from firebase_config import get_db
from dependencies.auth import CurrentUser, get_current_user
from schemas.user import (
    TIER_BENEFITS,
    calculate_tier,
    next_tier_info,
)
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/loyalty", tags=["Loyalty"])

POINTS_PER_RUPEE = 0.5  # ₹1 = 0.5 points


class LoyaltyResponse(BaseModel):
    points: int
    tier: str
    tier_discount_pct: int
    next_tier: Optional[str]
    points_needed_for_next_tier: int
    tier_progress: int   # 0-100


class PointTransaction(BaseModel):
    id: str
    booking_id: str
    points_awarded: int
    amount_spent: float
    created_at: Optional[datetime] = None
    description: str


@router.get("/me", response_model=LoyaltyResponse)
async def get_my_loyalty(current_user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    doc = db.collection("users").document(current_user.uid).get()
    data = doc.to_dict() if doc.exists else {}
    points = data.get("loyalty_points", 0)
    tier = calculate_tier(points)
    nti = next_tier_info(points)
    return LoyaltyResponse(
        points=points,
        tier=tier,
        tier_discount_pct=TIER_BENEFITS.get(tier, {}).get("discount_pct", 0),
        next_tier=nti["next_tier"],
        points_needed_for_next_tier=nti["points_needed"],
        tier_progress=nti["progress"],
    )


@router.get("/history", response_model=list[PointTransaction])
async def get_points_history(current_user: CurrentUser = Depends(get_current_user)):
    db = get_db()
    docs = (
        db.collection("loyalty_transactions")
        .where("client_id", "==", current_user.uid)
        .order_by("created_at", direction="DESCENDING")
        .limit(50)
        .stream()
    )
    results = []
    for doc in docs:
        d = doc.to_dict()
        results.append(PointTransaction(
            id=doc.id,
            booking_id=d.get("booking_id", ""),
            points_awarded=d.get("points_awarded", 0),
            amount_spent=d.get("amount_spent", 0),
            created_at=d.get("created_at"),
            description=d.get("description", "Booking reward"),
        ))
    return results
"""Pydantic schemas for Bookings."""
from __future__ import annotations
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class ReviewDetail(BaseModel):
    rating: int
    comment: Optional[str] = None
    created_at: Optional[datetime] = None


class SubmitReviewRequest(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)


BookingStatus = Literal["pending", "confirmed", "active", "completed", "cancelled"]


# ── Multi-item booking ─────────────────────────────────────────────────────────

class BookingItem(BaseModel):
    service_id: Optional[str] = None
    package_id: Optional[str] = None
    name: str
    unit_price: float
    quantity: int = 1


class CreateMultiBookingRequest(BaseModel):
    items: list[BookingItem] = Field(..., min_length=1)
    date: str = Field(..., description="YYYY-MM-DD")
    time: str = Field(..., description="e.g. '10:00 AM'")
    address_id: Optional[str] = None
    address_text: Optional[str] = Field(None, max_length=500)
    payment_method: Literal["upi", "card", "wallet", "cash"]
    coupon_code: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=500)


class CreateBookingRequest(BaseModel):
    service_id: Optional[str] = None
    package_id: Optional[str] = None
    date: str = Field(..., description="YYYY-MM-DD")
    time: str = Field(..., description="e.g. '10:00 AM'")
    address_id: Optional[str] = None   # saved address id
    address_text: Optional[str] = Field(None, max_length=500)  # or typed text
    payment_method: Literal["upi", "card", "wallet", "cash"]
    coupon_code: Optional[str] = None
    notes: Optional[str] = Field(None, max_length=500)


class AssignProviderRequest(BaseModel):
    provider_id: str


class UpdateBookingRequest(BaseModel):
    """Client can edit date/time/notes/address while booking is still pending."""
    date: Optional[str] = Field(None, description="YYYY-MM-DD")
    time: Optional[str] = None
    address_text: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=500)


class UpdateBookingStatusRequest(BaseModel):
    status: BookingStatus


class BookingResponse(BaseModel):
    id: str
    booking_ref: Optional[str] = None          # e.g. "AG0042"
    items: Optional[list[BookingItem]] = None  # multi-item bookings
    client_id: str
    provider_id: Optional[str] = None
    service_id: Optional[str] = None
    package_id: Optional[str] = None
    service_name: Optional[str] = None
    date: str
    time: str
    address: str
    payment_method: str
    coupon_code: Optional[str] = None
    base_price: float
    discount_amount: float = 0.0
    convenience_fee: float = 99.0
    total_price: float
    status: BookingStatus
    notes: Optional[str] = None
    created_at: Optional[datetime] = None
    # Denormalised display fields
    client_name: Optional[str] = None
    provider_name: Optional[str] = None
    client_phone: Optional[str] = None
    # Reviews (set after job completion)
    client_review: Optional[ReviewDetail] = None
    provider_review: Optional[ReviewDetail] = None

"""Pydantic schemas for Provider profiles, jobs and earnings."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Certification(BaseModel):
    name: str = Field(..., max_length=200)
    issuer: str = Field(default="", max_length=200)
    year: str = Field(default="", max_length=4)


class PortfolioItem(BaseModel):
    image_url: str
    caption: str = Field(default="", max_length=200)


# ── Provider profile ──────────────────────────────────────────────────────────

class ProviderProfileBase(BaseModel):
    bio: str = Field(default="", max_length=1000)
    experience_years: int = Field(default=0, ge=0, le=50)
    services_offered: list[str] = Field(default_factory=list)
    location: str = Field(default="", max_length=300)
    certifications: list[Certification] = Field(default_factory=list)
    portfolio: list[PortfolioItem] = Field(default_factory=list)


class UpdateProviderProfileRequest(BaseModel):
    bio: Optional[str] = Field(None, max_length=1000)
    experience_years: Optional[int] = Field(None, ge=0, le=50)
    services_offered: Optional[list[str]] = None
    location: Optional[str] = Field(None, max_length=300)
    certifications: Optional[list[Certification]] = None
    portfolio: Optional[list[PortfolioItem]] = None


class ProviderProfileResponse(ProviderProfileBase):
    uid: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None
    rating: float = 0.0
    total_jobs: int = 0
    is_online: bool = False
    is_approved: bool = False
    commission_rate: float = 15.0
    created_at: Optional[datetime] = None


# ── Online toggle ─────────────────────────────────────────────────────────────

class ToggleOnlineRequest(BaseModel):
    is_online: bool


# ── Admin: approve / reject ───────────────────────────────────────────────────

class ApprovalRequest(BaseModel):
    approved: bool
    reason: Optional[str] = Field(None, max_length=500)


# ── Earnings ──────────────────────────────────────────────────────────────────

class EarningTransaction(BaseModel):
    id: str
    service_name: str
    client_name: str
    amount: float
    commission: float
    net_amount: float
    date: str
    booking_id: str


class EarningsSummary(BaseModel):
    total_earned: float = 0.0
    pending_payout: float = 0.0
    total_jobs: int = 0
    commission_rate: float = 15.0
    this_week: float = 0.0
    this_month: float = 0.0
    transactions: list[EarningTransaction] = Field(default_factory=list)

"""Pydantic schemas for Coupons."""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field


class CouponBase(BaseModel):
    code: str = Field(..., min_length=2, max_length=30, pattern=r'^[A-Z0-9_]+$')
    description: str = Field(..., max_length=300)
    type: Literal["percentage", "flat"]
    value: float = Field(..., gt=0)
    min_order: float = Field(..., ge=0)
    max_discount: Optional[float] = None
    usage_limit: int = Field(..., gt=0)
    valid_from: str  # ISO date string YYYY-MM-DD
    valid_to: str
    applicable_for: Literal["all", "new_users", "returning"] = "all"
    auto_apply: bool = False
    active: bool = True


class CreateCouponRequest(CouponBase):
    pass


class UpdateCouponRequest(BaseModel):
    description: Optional[str] = None
    value: Optional[float] = Field(None, gt=0)
    min_order: Optional[float] = Field(None, ge=0)
    max_discount: Optional[float] = None
    usage_limit: Optional[int] = Field(None, gt=0)
    valid_from: Optional[str] = None
    valid_to: Optional[str] = None
    applicable_for: Optional[Literal["all", "new_users", "returning"]] = None
    auto_apply: Optional[bool] = None
    active: Optional[bool] = None


class CouponResponse(CouponBase):
    id: str
    used_count: int = 0


class ValidateCouponRequest(BaseModel):
    code: str
    order_amount: float = Field(..., gt=0)


class ValidateCouponResponse(BaseModel):
    valid: bool
    discount_amount: float = 0.0
    message: str
    coupon: Optional[CouponResponse] = None

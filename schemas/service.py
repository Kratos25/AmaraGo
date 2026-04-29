"""Pydantic schemas for Categories, Services, and Packages."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    icon: str = Field(..., max_length=10)
    description: str = Field(default="", max_length=500)
    active: bool = True


class CreateCategoryRequest(CategoryBase):
    pass


class UpdateCategoryRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    icon: Optional[str] = Field(None, max_length=10)
    description: Optional[str] = Field(None, max_length=500)
    active: Optional[bool] = None


class CategoryResponse(CategoryBase):
    id: str
    service_count: int = 0


# ── Service ───────────────────────────────────────────────────────────────────

class ServiceBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    category_id: str
    duration: str = Field(..., max_length=50)  # e.g. "60 min"
    base_price: float = Field(..., gt=0)
    discounted_price: Optional[float] = Field(None, gt=0)
    description: str = Field(default="", max_length=1000)
    active: bool = True
    popular: bool = False
    image_url: Optional[str] = None


class CreateServiceRequest(ServiceBase):
    pass


class UpdateServiceRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    category_id: Optional[str] = None
    duration: Optional[str] = None
    base_price: Optional[float] = Field(None, gt=0)
    discounted_price: Optional[float] = Field(None, gt=0)
    description: Optional[str] = None
    active: Optional[bool] = None
    popular: Optional[bool] = None


class ServiceResponse(ServiceBase):
    id: str
    rating: float = 0.0
    total_bookings: int = 0


# ── Package ───────────────────────────────────────────────────────────────────

class PackageBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    tagline: str = Field(default="", max_length=300)
    services: list[str] = Field(default_factory=list)  # service names
    duration: str = Field(..., max_length=50)
    original_price: float = Field(..., gt=0)
    price: float = Field(..., gt=0)
    active: bool = True
    badge: Optional[str] = Field(None, max_length=50)
    image_url: Optional[str] = None


class CreatePackageRequest(PackageBase):
    pass


class UpdatePackageRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=200)
    tagline: Optional[str] = None
    services: Optional[list[str]] = None
    duration: Optional[str] = None
    original_price: Optional[float] = Field(None, gt=0)
    price: Optional[float] = Field(None, gt=0)
    active: Optional[bool] = None
    badge: Optional[str] = None


class PackageResponse(PackageBase):
    id: str
    savings: float = 0.0
    rating: float = 0.0
    total_bookings: int = 0

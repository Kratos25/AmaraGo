"""Pydantic schemas for saved addresses."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, Field


class AddressBase(BaseModel):
    label: str = Field(..., min_length=1, max_length=50)  # "Home", "Office"
    address: str = Field(..., min_length=5, max_length=500)
    icon: str = Field(default="📍", max_length=10)
    is_default: bool = False
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CreateAddressRequest(AddressBase):
    pass


class UpdateAddressRequest(BaseModel):
    label: Optional[str] = Field(None, min_length=1, max_length=50)
    address: Optional[str] = Field(None, min_length=5, max_length=500)
    icon: Optional[str] = None
    is_default: Optional[bool] = None


class AddressResponse(AddressBase):
    id: str
    client_id: str

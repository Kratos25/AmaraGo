"""Pydantic schemas for Auth endpoints."""
from __future__ import annotations
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class RegisterClientRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(default=None, max_length=20)
    firebase_uid: str
    id_token: str  # ID token to verify the Firebase account


class RegisterProviderRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=7, max_length=20)
    firebase_uid: str
    id_token: str
    # Provider-specific fields
    bio: str = Field(default="", max_length=1000)
    experience_years: int = Field(default=0, ge=0, le=50)
    services_offered: list[str] = Field(default_factory=list)
    location: str = Field(default="", max_length=200)


class RegisterResponse(BaseModel):
    uid: str
    role: str
    message: str
    is_approved: Optional[bool] = None

"""Pydantic schemas for User endpoints."""
from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserResponse(BaseModel):
    uid: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str  # client | service_provider | admin
    profile_image: Optional[str] = None
    created_at: Optional[datetime] = None


class UpdateUserRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    phone: Optional[str] = Field(None, min_length=7, max_length=20)
    profile_image: Optional[str] = None

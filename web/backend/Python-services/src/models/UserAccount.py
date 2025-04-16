"""
UserAccount model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class UserAccount(BaseModel):
    """UserAccount model - Base user representation in system"""
    userId: int = Field(..., description="Unique identifier for the user")
    name: str = Field(..., description="User's full name")
    email: str = Field(..., description="User's email address")
    password: str = Field(..., description="User's hashed password")
    role: str = Field(..., description="User role (Admin, Teacher, Parent, Student)")
    avatar: Optional[str] = Field(None, description="User's avatar URL")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['USER_ACCOUNT'] 
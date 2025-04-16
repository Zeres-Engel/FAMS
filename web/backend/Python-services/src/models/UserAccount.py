"""
UserAccount model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class UserAccount(BaseModel):
    """UserAccount model - Base user representation in system"""
    userId: str = Field(..., description="Unique identifier for the user")
    email: str = Field(..., description="User's email address")
    password: str = Field(..., description="User's hashed password")
    role: str = Field(..., description="User role (admin, teacher, parent, student)")
    avatar: Optional[str] = Field(None, description="User's avatar URL")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['USER_ACCOUNT'] 
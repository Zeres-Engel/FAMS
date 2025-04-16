"""
Parent model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class Parent(BaseModel):
    """Parent model representing student guardians"""
    parentId: int = Field(..., description="Unique identifier for the parent")
    userId: int = Field(..., description="Reference to UserAccount")
    fullName: str = Field(..., description="Parent's full name")
    career: Optional[str] = Field(None, description="Parent's career/occupation")
    phone: Optional[str] = Field(None, description="Parent's phone number")
    gender: bool = Field(..., description="Parent's gender (True for Male, False for Female)")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['PARENT'] 
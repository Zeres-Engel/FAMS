"""
ParentStudent relationship model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class ParentStudent(BaseModel):
    """ParentStudent model representing relationships between parents and students"""
    parentId: int = Field(..., description="Reference to Parent")
    studentId: int = Field(..., description="Reference to Student")
    relationship: str = Field(default="Other", description="Type of relationship (Father, Mother, Guardian, Other)")
    isEmergencyContact: bool = Field(default=False, description="Whether this parent is an emergency contact")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['PARENT_STUDENT'] 
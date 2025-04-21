"""
Class model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class Class(BaseModel):
    """Class model representing a group of students"""
    classId: int = Field(..., description="Unique identifier for the class")
    homeroomTeacherId: Optional[int] = Field(None, description="Reference to Teacher who is homeroom teacher")
    className: str = Field(..., description="Name of the class")
    grade: Optional[int] = Field(None, description="Grade level of the class")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CLASS'] 
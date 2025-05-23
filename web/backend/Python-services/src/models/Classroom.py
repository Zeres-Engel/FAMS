"""
Classroom model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class Classroom(BaseModel):
    """Classroom model representing physical classrooms in the school"""
    classroomId: int = Field(..., description="Unique identifier for the classroom")
    roomNumber: str = Field(..., description="Room number or identifier")
    building: Optional[str] = Field(None, description="Building where the classroom is located")
    capacity: Optional[int] = Field(None, description="Maximum capacity of the classroom")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CLASSROOM'] 
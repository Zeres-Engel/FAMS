"""
Curriculum model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class Curriculum(BaseModel):
    """Curriculum model representing course curricula for different grades"""
    curriculumId: int = Field(..., description="Unique identifier for the curriculum")
    curriculumName: str = Field(..., description="Name of the curriculum")
    description: Optional[str] = Field(None, description="Description of the curriculum")
    grade: Optional[int] = Field(None, description="Grade level of the curriculum")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CURRICULUM'] 
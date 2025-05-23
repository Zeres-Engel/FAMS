"""
CurriculumSubject model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class CurriculumSubject(BaseModel):
    """CurriculumSubject model representing subjects in a curriculum"""
    curriculumId: int = Field(..., description="Reference to Curriculum")
    subjectId: int = Field(..., description="Reference to Subject")
    sessions: int = Field(default=2, description="Number of sessions per week")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CURRICULUM_SUBJECT']
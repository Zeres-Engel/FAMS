"""
Semester model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class Semester(BaseModel):
    """Semester model representing academic semesters"""
    semesterId: int = Field(..., description="Unique identifier for the semester")
    semesterName: str = Field(..., description="Name of the semester")
    startDate: datetime = Field(..., description="Start date of the semester")
    endDate: datetime = Field(..., description="End date of the semester")
    curriculumId: int = Field(..., description="Reference to Curriculum")
    batchId: int = Field(..., description="Reference to Batch")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['SEMESTER'] 
"""
Semester-related models for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from src.constants import COLLECTIONS


class Semester(BaseModel):
    """Semester model"""
    semesterId: str = Field(..., description="Unique identifier for the semester")
    semesterName: str = Field(..., description="Name of the semester")
    startDate: datetime = Field(..., description="Start date of the semester")
    endDate: datetime = Field(..., description="End date of the semester")
    batchId: Optional[int] = Field(None, description="Batch ID")
    curriculumId: Optional[str] = Field(None, description="Curriculum ID")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['SEMESTER']


class SemesterSchedule(BaseModel):
    """Semester schedule model"""
    semesterScheduleId: str = Field(..., description="Unique identifier for the semester schedule")
    semesterId: str = Field(..., description="Reference to Semester")
    startDate: datetime = Field(..., description="Start date of the semester schedule")
    endDate: datetime = Field(..., description="End date of the semester schedule")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['SEMESTER_SCHEDULE'] 
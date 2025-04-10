"""
Class-related models for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from src.constants import COLLECTIONS


class Class(BaseModel):
    """Class model"""
    classId: str = Field(..., description="Unique identifier for the class")
    className: str = Field(..., description="Name of the class")
    grade: str = Field(..., description="Grade level")
    academicYear: str = Field(..., description="Academic year")
    semesterId: str = Field(..., description="Reference to Semester")
    curriculumId: str = Field(..., description="Reference to Curriculum")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CLASS']


class Classroom(BaseModel):
    """Classroom model"""
    classroomId: str = Field(..., description="Unique identifier for the classroom")
    classroomName: str = Field(..., description="Name of the classroom")
    capacity: int = Field(..., description="Maximum capacity of the classroom")
    location: str = Field(..., description="Location of the classroom")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CLASSROOM']
    
    @classmethod
    def from_csv_row(cls, row, classroom_id):
        """Create a Classroom instance from a CSV row"""
        return cls(
            classroomId=classroom_id,
            classroomName=row.get("Name", f"Room {classroom_id}"),
            capacity=int(row.get("Capacity", 30)),
            location=row.get("Location", "Main Building")
        )


class ClassSchedule(BaseModel):
    """Class schedule model"""
    classScheduleId: str = Field(..., description="Unique identifier for the class schedule")
    classId: str = Field(..., description="Reference to Class")
    subjectId: str = Field(..., description="Reference to Subject")
    teacherId: str = Field(..., description="Reference to Teacher")
    classroomId: str = Field(..., description="Reference to Classroom")
    dayOfWeek: int = Field(..., description="Day of week (0-6)")
    startTime: str = Field(..., description="Start time in HH:MM format")
    endTime: str = Field(..., description="End time in HH:MM format")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CLASS_SCHEDULE'] 
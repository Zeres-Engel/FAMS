"""
Curriculum-related models for FAMS
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from src.constants import COLLECTIONS


class Subject(BaseModel):
    """Subject model"""
    subjectId: str
    subjectName: str
    subjectCode: Optional[str] = None
    type: str = "Môn học chính"
    credits: int = 1
    description: Optional[str] = None
    collection: str = "subjects"

    @classmethod
    def from_csv(cls, row: dict, index: int):
        """Create Subject from CSV row"""
        return cls(
            subjectId=str(index + 1),
            subjectName=row["SubjectName"],
            subjectCode=f"SUB{index+1:03d}",
            type=row.get("Type", "Môn học chính").strip(),
            credits=int(row.get("Sessions", 1)),
            description=row.get("Description", "")
        )

    @classmethod
    def from_curriculum_row(cls, row: dict, index: int):
        """Create Subject from curriculum CSV row"""
        subject_name = row.get("SubjectName", "").strip()
        return cls(
            subjectId=str(index + 1),
            subjectName=subject_name,
            subjectCode=f"SUB{index+1:03d}",
            type=row.get("Type", "Môn học chính").strip(),
            credits=int(row.get("Sessions", 1)),
            description=row.get("Description", "")
        )


class Curriculum(BaseModel):
    """Curriculum model"""
    curriculumId: str
    grade: int
    year: int
    description: Optional[str] = None
    collection: str = "curriculums"


class CurriculumSubject(BaseModel):
    """Curriculum Subject model"""
    curriculumSubjectId: str
    curriculumId: str
    subjectId: str
    semester: int = 1
    sessions: int = 2
    credits: int = 1
    collection: str = "curriculum_subjects"


class Semester(BaseModel):
    """Semester model"""
    semesterId: str
    semesterName: str
    startDate: datetime
    endDate: datetime
    batchId: str
    collection: str = "semesters"


class Slot(BaseModel):
    """Slot model for schedule time slots"""
    slotId: str = Field(..., description="Unique identifier for the slot")
    slotName: str = Field(..., description="Name of the slot")
    startTime: str = Field(..., description="Start time in HH:MM format")
    endTime: str = Field(..., description="End time in HH:MM format")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['SLOT']
    
    @classmethod
    def from_csv_row(cls, row, slot_id):
        """Create a Slot instance from a CSV row"""
        return cls(
            slotId=slot_id,
            slotName=f"Slot {row.get('SlotNumber', slot_id)}",
            startTime=row.get("StartTime", "00:00"),
            endTime=row.get("EndTime", "00:00")
        ) 
"""
ClassSchedule model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class ClassSchedule(BaseModel):
    """ClassSchedule model representing scheduled class sessions"""
    scheduleId: int = Field(..., description="Unique identifier for the schedule")
    semesterId: int = Field(..., description="Reference to Semester")
    classId: int = Field(..., description="Reference to Class")
    subjectId: int = Field(..., description="Reference to Subject")
    teacherId: int = Field(..., description="Reference to Teacher")
    classroomId: int = Field(..., description="Reference to Classroom")
    slotId: int = Field(..., description="Reference to ScheduleFormat")
    topic: Optional[str] = Field(None, description="Topic of the class session")
    sessionDate: Optional[datetime] = Field(None, description="Date of the session")
    sessionWeek: Optional[str] = Field(None, description="Week of the session")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CLASS_SCHEDULE'] 
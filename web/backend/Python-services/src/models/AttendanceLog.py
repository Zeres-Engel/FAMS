"""
AttendanceLog model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class AttendanceLog(BaseModel):
    """AttendanceLog model representing attendance records"""
    attendanceId: int = Field(..., description="Unique identifier for the attendance record")
    scheduleId: int = Field(..., description="Reference to ClassSchedule")
    userId: int = Field(..., description="Reference to UserAccount")
    checkInFace: Optional[bytes] = Field(None, description="Face image used for check-in")
    checkIn: Optional[datetime] = Field(None, description="Time of check-in")
    status: str = Field(default="Absent", description="Attendance status (Present, Late, Absent)")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['ATTENDANCE_LOG'] 
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
    userId: str = Field(..., description="Reference to UserAccount")
    checkInFace: Optional[bytes] = Field(None, description="Face image used for check-in")
    checkIn: Optional[datetime] = Field(None, description="Time of check-in")
    note: Optional[str] = Field("", description="Additional notes for this attendance")
    status: str = Field(default="Absent", description="Attendance status (Present, Late, Absent, Not Now)")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['ATTENDANCE_LOG'] 
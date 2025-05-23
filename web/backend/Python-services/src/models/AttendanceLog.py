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
    semesterNumber: Optional[int] = Field(None, description="Semester number for easier filtering")
    userRole: Optional[str] = Field(None, description="Role of the user (teacher, student)")
    teacherId: Optional[int] = Field(None, description="Teacher ID for the class session")
    teacherName: Optional[str] = Field(None, description="Teacher name for display")
    subjectId: Optional[int] = Field(None, description="Subject ID for the class session")
    subjectName: Optional[str] = Field(None, description="Subject name for display")
    classId: Optional[int] = Field(None, description="Class ID for the session")
    className: Optional[str] = Field(None, description="Class name for display")
    studentId: Optional[int] = Field(None, description="Student ID (if applicable)")
    studentName: Optional[str] = Field(None, description="Student name (if applicable)")
    classroomId: Optional[int] = Field(None, description="Classroom ID where the session takes place")
    classroomName: Optional[str] = Field(None, description="Classroom name for display")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['ATTENDANCE_LOG'] 
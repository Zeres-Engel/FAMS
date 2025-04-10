"""
Attendance-related models for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from src.constants import COLLECTIONS


class AttendanceLog(BaseModel):
    """Attendance log model"""
    attendanceLogId: str = Field(..., description="Unique identifier for the attendance log")
    studentId: str = Field(..., description="Reference to Student")
    classId: str = Field(..., description="Reference to Class")
    date: datetime = Field(..., description="Date of attendance")
    status: str = Field(..., description="Attendance status (present, absent, late)")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    collection: str = COLLECTIONS['ATTENDANCE_LOG']


class RFID(BaseModel):
    """RFID model for student identification"""
    rfidId: str = Field(..., description="Unique identifier for the RFID")
    studentId: str = Field(..., description="Reference to Student")
    rfidNumber: str = Field(..., description="RFID card number")
    isActive: bool = Field(default=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    collection: str = COLLECTIONS['RFID'] 
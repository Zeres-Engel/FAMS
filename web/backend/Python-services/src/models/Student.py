"""
Student model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class Student(BaseModel):
    """Student model representing students in the system"""
    studentId: int = Field(..., description="Unique identifier for the student")
    userId: str = Field(..., description="Reference to UserAccount")
    fullName: str = Field(..., description="Student's full name")
    email: str = Field(None, description="Student's email address")
    dateOfBirth: Optional[datetime] = Field(None, description="Student's date of birth")
    classId: Optional[int] = Field(None, description="Reference to Class")
    batchId: Optional[int] = Field(None, description="Reference to Batch")
    gender: Optional[bool] = Field(None, description="Student's gender (True for Male, False for Female)")
    address: Optional[str] = Field(None, description="Student's address")
    phone: Optional[str] = Field(None, description="Student's phone number")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['STUDENT']

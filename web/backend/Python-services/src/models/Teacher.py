"""
Teacher model for FAMS
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class Teacher(BaseModel):
    """Teacher model representing educators in the system"""
    teacherId: int = Field(..., description="Unique identifier for the teacher")
    userId: str = Field(..., description="Reference to UserAccount")
    fullName: str = Field(..., description="Teacher's full name")
    email: str = Field(..., description="Teacher's email address")
    dateOfBirth: Optional[datetime] = Field(None, description="Teacher's date of birth")
    address: Optional[str] = Field(None, description="Teacher's address")
    phone: Optional[str] = Field(None, description="Teacher's phone number")
    gender: bool = Field(..., description="Teacher's gender (True for Male, False for Female)")
    major: Optional[str] = Field(None, description="Teacher's area of expertise")
    weeklyCapacity: int = Field(default=10, description="Weekly teaching capacity in hours")
    classIds: Optional[List[int]] = Field(default=[], description="IDs of classes the teacher has taught")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['TEACHER'] 
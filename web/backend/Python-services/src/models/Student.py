from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class Student(BaseModel):
    studentId: int = Field(..., description="Unique identifier for the student")
    userId: int = Field(..., description="Reference to UserAccount")
    fullName: str = Field(..., description="Student's full name")
    dateOfBirth: Optional[datetime] = Field(None, description="Student's date of birth")
    classId: Optional[int] = Field(None, description="Reference to Class")
    gender: Optional[bool] = Field(None, description="Student's gender")
    address: Optional[str] = Field(None, description="Student's address")
    phone: Optional[str] = Field(None, description="Student's phone number")
    
    class Config:
        collection = "Student"
    
    @classmethod
    def from_dict(cls, data):
        return cls(**data)

"""
Subject model for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from ..constants import COLLECTIONS


class Subject(BaseModel):
    """Subject model representing courses taught in the school"""
    subjectId: int = Field(..., description="Unique identifier for the subject")
    subjectName: str = Field(..., description="Name of the subject")
    description: Optional[str] = Field(None, description="Description of the subject")
    subjectType: str = Field(..., description="Type of subject (Chinh, TuChon, NgoaiKhoa)")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['SUBJECT'] 
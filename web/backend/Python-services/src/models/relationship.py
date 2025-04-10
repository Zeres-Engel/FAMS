"""
Relationship models for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from src.constants import COLLECTIONS


class ParentStudent(BaseModel):
    """Parent-Student relationship model"""
    parentStudentId: str = Field(..., description="Unique identifier for the parent-student relationship")
    parentId: str = Field(..., description="Reference to Parent")
    studentId: str = Field(..., description="Reference to Student")
    relationship: str = Field(..., description="Relationship between parent and student")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['PARENT_STUDENT']


class TeacherClassAssignment(BaseModel):
    """Teacher-Class Assignment model"""
    teacherClassAssignmentId: str = Field(..., description="Unique identifier for the teacher-class assignment")
    teacherId: str = Field(..., description="Reference to Teacher")
    classId: str = Field(..., description="Reference to Class")
    subjectId: str = Field(..., description="Reference to Subject")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['TEACHER_CLASS_ASSIGNMENT'] 
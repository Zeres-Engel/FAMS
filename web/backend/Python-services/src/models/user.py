"""
User-related models for FAMS
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from src.constants import COLLECTIONS


class UserAccount(BaseModel):
    """User account model for all users in the system"""
    userId: str = Field(..., description="Unique identifier for the user")
    username: str = Field(..., description="Username for login")
    password: str = Field(..., description="Hashed password")
    role: str = Field(..., description="User role (admin, teacher, student, parent)")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['USER_ACCOUNT']


class Teacher(BaseModel):
    """Teacher model"""
    teacherId: str = Field(..., description="Unique identifier for the teacher")
    userId: str = Field(..., description="Reference to UserAccount")
    firstName: str = Field(..., description="Teacher's first name")
    lastName: str = Field(..., description="Teacher's last name")
    email: str = Field(..., description="Teacher's email")
    phone: Optional[str] = Field(None, description="Teacher's phone number")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['TEACHER']


class Student(BaseModel):
    """Student model"""
    studentId: str = Field(..., description="Unique identifier for the student")
    userId: str = Field(..., description="Reference to UserAccount")
    firstName: str = Field(..., description="Student's first name")
    lastName: str = Field(..., description="Student's last name")
    email: str = Field(..., description="Student's email")
    phone: Optional[str] = Field(None, description="Student's phone number")
    dateOfBirth: datetime = Field(..., description="Student's date of birth")
    gender: str = Field(..., description="Student's gender")
    address: Optional[str] = Field(None, description="Student's address")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['STUDENT']


class Parent(BaseModel):
    """Parent model"""
    parentId: str = Field(..., description="Unique identifier for the parent")
    userId: str = Field(..., description="Reference to UserAccount")
    firstName: str = Field(..., description="Parent's first name")
    lastName: str = Field(..., description="Parent's last name")
    email: str = Field(..., description="Parent's email")
    phone: str = Field(..., description="Parent's phone number")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['PARENT'] 
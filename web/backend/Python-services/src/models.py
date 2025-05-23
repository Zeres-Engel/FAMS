"""
Data models for FAMS
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from .constants import COLLECTIONS


class UserAccount(BaseModel):
    userId: str = Field(..., description="Unique identifier for the user")
    username: str = Field(..., description="Username for login")
    password: str = Field(..., description="Hashed password")
    role: str = Field(..., description="User role (admin, teacher, student, parent)")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['USER_ACCOUNT']


class Teacher(BaseModel):
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


class Class(BaseModel):
    classId: str = Field(..., description="Unique identifier for the class")
    className: str = Field(..., description="Name of the class")
    grade: str = Field(..., description="Grade level")
    academicYear: str = Field(..., description="Academic year")
    semesterId: str = Field(..., description="Reference to Semester")
    curriculumId: str = Field(..., description="Reference to Curriculum")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CLASS']


class Batch(BaseModel):
    batchId: str = Field(..., description="Unique identifier for the batch")
    batchName: str = Field(..., description="Name of the batch")
    startDate: datetime = Field(..., description="Start date of the batch")
    endDate: datetime = Field(..., description="End date of the batch")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['BATCH']


class Subject(BaseModel):
    subjectId: str = Field(..., description="Unique identifier for the subject")
    subjectName: str = Field(..., description="Name of the subject")
    subjectCode: str = Field(..., description="Code of the subject")
    description: Optional[str] = Field(None, description="Description of the subject")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['SUBJECT']


class Classroom(BaseModel):
    classroomId: str = Field(..., description="Unique identifier for the classroom")
    classroomName: str = Field(..., description="Name of the classroom")
    roomNumber: str = Field(..., description="Room number")
    building: str = Field(..., description="Building name")
    roomName: str = Field(..., description="Combined room name (roomNumber + building)")
    capacity: int = Field(..., description="Maximum capacity of the classroom")
    location: str = Field(..., description="Location of the classroom")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CLASSROOM']


class Semester(BaseModel):
    semesterId: str = Field(..., description="Unique identifier for the semester")
    semesterName: str = Field(..., description="Name of the semester")
    startDate: datetime = Field(..., description="Start date of the semester")
    endDate: datetime = Field(..., description="End date of the semester")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['SEMESTER']


class Curriculum(BaseModel):
    curriculumId: str = Field(..., description="Unique identifier for the curriculum")
    curriculumName: str = Field(..., description="Name of the curriculum")
    description: Optional[str] = Field(None, description="Description of the curriculum")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CURRICULUM']


class CurriculumSubject(BaseModel):
    curriculumSubjectId: str = Field(..., description="Unique identifier for the curriculum subject")
    curriculumId: str = Field(..., description="Reference to Curriculum")
    subjectId: str = Field(..., description="Reference to Subject")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CURRICULUM_SUBJECT']


class ParentStudent(BaseModel):
    parentStudentId: str = Field(..., description="Unique identifier for the parent-student relationship")
    parentId: str = Field(..., description="Reference to Parent")
    studentId: str = Field(..., description="Reference to Student")
    relationship: str = Field(..., description="Relationship between parent and student")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['PARENT_STUDENT']


class TeacherClassAssignment(BaseModel):
    teacherClassAssignmentId: str = Field(..., description="Unique identifier for the teacher-class assignment")
    teacherId: str = Field(..., description="Reference to Teacher")
    classId: str = Field(..., description="Reference to Class")
    subjectId: str = Field(..., description="Reference to Subject")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['TEACHER_CLASS_ASSIGNMENT']


class RFID(BaseModel):
    rfidId: str = Field(..., description="Unique identifier for the RFID")
    studentId: str = Field(..., description="Reference to Student")
    rfidNumber: str = Field(..., description="RFID card number")
    isActive: bool = Field(default=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    collection: str = COLLECTIONS['RFID']


class ClassSchedule(BaseModel):
    classScheduleId: str = Field(..., description="Unique identifier for the class schedule")
    semesterId: str = Field(..., description="Reference to Semester")
    weekNumber: int = Field(..., description="Week number in semester")
    dayNumber: int = Field(..., description="Day number in week (1-7, Monday=1)")
    classId: str = Field(..., description="Reference to Class")
    subjectId: str = Field(..., description="Reference to Subject")
    teacherId: str = Field(..., description="Reference to Teacher")
    classroomId: str = Field(..., description="Reference to Classroom")
    slotId: str = Field(..., description="Reference to Slot")
    roomName: str = Field("", description="Room name for display")
    topic: str = Field("", description="Topic of the class")
    sessionDate: datetime = Field(..., description="Date of the session")
    sessionWeek: str = Field(..., description="Week information")
    dayOfWeek: str = Field(..., description="Day of week (Monday, Tuesday, etc.)")
    startTime: str = Field(..., description="Start time in HH:MM format")
    endTime: str = Field(..., description="End time in HH:MM format")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['CLASS_SCHEDULE']


class SemesterSchedule(BaseModel):
    semesterScheduleId: str = Field(..., description="Unique identifier for the semester schedule")
    semesterId: str = Field(..., description="Reference to Semester")
    startDate: datetime = Field(..., description="Start date of the semester schedule")
    endDate: datetime = Field(..., description="End date of the semester schedule")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['SEMESTER_SCHEDULE']


class AttendanceLog(BaseModel):
    attendanceLogId: str = Field(..., description="Unique identifier for the attendance log")
    studentId: str = Field(..., description="Reference to Student")
    classId: str = Field(..., description="Reference to Class")
    date: datetime = Field(..., description="Date of attendance")
    status: str = Field(..., description="Attendance status (present, absent, late)")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    collection: str = COLLECTIONS['ATTENDANCE_LOG']


class Slot(BaseModel):
    slotId: str = Field(..., description="Unique identifier for the slot")
    slotName: str = Field(..., description="Name of the slot")
    slotNumber: int = Field(..., description="Slot number in day")
    dayOfWeek: str = Field(..., description="Day of week (Monday, Tuesday, etc.)")
    startTime: str = Field(..., description="Start time in HH:MM format")
    endTime: str = Field(..., description="End time in HH:MM format")
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    isActive: bool = Field(default=True)
    collection: str = COLLECTIONS['SLOT'] 
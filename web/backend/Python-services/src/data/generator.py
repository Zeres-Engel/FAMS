"""
Schedule generator module for the FAMS system.
This module contains functions to generate class schedules.
"""
import os
import datetime
import logging
from pymongo import MongoClient
from bson import ObjectId

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_db_connection():
    """Get MongoDB database connection"""
    from src.api.database import get_db_connection
    return get_db_connection()

def get_semester_info(academic_year, semester_number=1):
    """
    Create semester information for schedule generation
    
    Args:
        academic_year: Academic year (e.g., "2023-2024")
        semester_number: Semester number (1 or 2)
        
    Returns:
        Dictionary with semester information
    """
    # Parse academic year to get start and end years
    years = academic_year.split("-")
    if len(years) != 2:
        raise ValueError(f"Invalid academic year format: {academic_year}. Expected format: YYYY-YYYY")
    
    start_year = int(years[0])
    end_year = int(years[1])
    
    # Set semester dates based on semester number
    if semester_number == 1:
        # First semester: September to December
        start_date = datetime.datetime(start_year, 9, 1)
        end_date = datetime.datetime(start_year, 12, 31)
    else:
        # Second semester: January to May
        start_date = datetime.datetime(end_year, 1, 1)
        end_date = datetime.datetime(end_year, 5, 31)
    
    # Create semester info dictionary
    semester_info = {
        "semesterNumber": semester_number,
        "semesterName": f"Học kỳ {semester_number} năm học {academic_year}",
        "startDate": start_date,
        "endDate": end_date,
        "academicYear": academic_year
    }
    
    return semester_info

def generate_improved_schedule(academic_year, semester_number=1):
    """
    Generate an improved schedule for a specific academic year and semester
    
    Args:
        academic_year: Academic year (e.g., "2023-2024")
        semester_number: Semester number (1 or 2)
        
    Returns:
        List of generated schedule entries
    """
    # Get database connection
    db = get_db_connection()
    
    # Get semester information
    semester_info = get_semester_info(academic_year, semester_number)
    
    # Log the schedule generation process
    logger.info(f"Generating schedule for {academic_year}, Semester {semester_number}")
    
    # Import the actual schedule generator function from the correct module
    from src.schedule.core import generate_improved_schedule as core_generate_improved_schedule
    
    # Generate the schedule
    schedule_entries, warnings = core_generate_improved_schedule(
        db=db,
        semester_info=semester_info,
        total_weeks=18,  # Standard semester length
        academic_year=academic_year
    )
    
    # Log warnings if any
    if warnings:
        logger.warning(f"Generated schedule with {len(warnings)} warnings:")
        for warning in warnings[:5]:  # Log first 5 warnings
            logger.warning(f"  - {warning}")
        if len(warnings) > 5:
            logger.warning(f"  - ... and {len(warnings) - 5} more warnings")
    
    # Log results
    logger.info(f"Generated {len(schedule_entries)} schedule entries for {academic_year}, Semester {semester_number}")
    
    # Insert schedules into database if they aren't already there
    cleaned_schedules = []
    for entry in schedule_entries:
        # Check if this entry already exists to avoid duplicates
        existing = db.ClassSchedule.find_one({
            "semesterNumber": semester_info["semesterNumber"],
            "weekNumber": entry.get("weekNumber"),
            "dayOfWeek": entry.get("dayOfWeek"),
            "classId": entry.get("classId"),
            "subjectId": entry.get("subjectId"),
            "slotId": entry.get("slotId"),
            "academicYear": academic_year
        })
        
        if not existing:
            # Add academic year to the entry
            entry["academicYear"] = academic_year
            cleaned_schedules.append(entry)
    
    # Insert new schedules if any
    if cleaned_schedules:
        try:
            db.ClassSchedule.insert_many(cleaned_schedules)
            logger.info(f"Inserted {len(cleaned_schedules)} new schedule entries into database")
        except Exception as e:
            logger.error(f"Error inserting schedules: {str(e)}")
    else:
        logger.info("No new schedule entries to insert")
    
    # Generate attendance logs for the new schedules
    attendance_logs = []
    next_attendance_id = 1
    
    # Get the last attendance ID if any exist
    last_attendance = db.AttendanceLog.find_one(sort=[("attendanceId", -1)])
    if last_attendance and "attendanceId" in last_attendance:
        try:
            next_attendance_id = int(last_attendance["attendanceId"]) + 1
        except (ValueError, TypeError):
            logger.warning(f"Could not parse attendanceId: {last_attendance.get('attendanceId')}. Starting from 1.")
    
    logger.info(f"Generating attendance logs with starting ID: {next_attendance_id}")
    
    # Only generate attendance logs for newly inserted schedules
    for schedule in cleaned_schedules:
        class_id = schedule["classId"]
        schedule_id = schedule["scheduleId"]
        
        # Get all students in this class
        students_in_class = list(db.Student.find({"classId": class_id, "isActive": True}))
        
        if not students_in_class:
            logger.warning(f"No students found for class ID: {class_id}")
            continue
        
        logger.info(f"Creating attendance logs for class ID {class_id} with {len(students_in_class)} students")
        
        for student in students_in_class:
            user_id = student.get("userId")
            if user_id:
                attendance_log = {
                    "attendanceId": next_attendance_id,
                    "scheduleId": schedule_id,
                    "userId": user_id,
                    "checkIn": None,
                    "note": "",
                    "status": "Not Now",  # Default status
                    "semesterNumber": semester_info["semesterNumber"],
                    "createdAt": datetime.datetime.now(),
                    "updatedAt": datetime.datetime.now(),
                    "isActive": True
                }
                attendance_logs.append(attendance_log)
                next_attendance_id += 1
    
    # Insert attendance logs
    if attendance_logs:
        try:
            db.AttendanceLog.insert_many(attendance_logs)
            logger.info(f"Inserted {len(attendance_logs)} attendance logs")
        except Exception as e:
            logger.error(f"Error inserting attendance logs: {str(e)}")
    
    # Return all schedule entries, including existing ones
    return schedule_entries 
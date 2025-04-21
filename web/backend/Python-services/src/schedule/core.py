"""
Core scheduling algorithms and utilities
"""
import datetime
import logging
import re
from typing import Dict, List, Set, Tuple, Any
from ..constants import COLLECTIONS

# Cấu hình logging
logger = logging.getLogger(__name__)

def get_week_date_range(week_number, semester_start_date):
    """
    Get date range for a week (Monday to Sunday)
    
    Args:
        week_number: Week number (1-based)
        semester_start_date: Start date of semester
    
    Returns:
        str: Date range in format "DD/MM/YYYY to DD/MM/YYYY"
    """
    # Calculate Monday of the week
    monday = semester_start_date + datetime.timedelta(days=(week_number-1)*7)
    
    # Make sure it's Monday
    while monday.weekday() != 0:
        monday = monday - datetime.timedelta(days=1)
    
    # Calculate Sunday
    sunday = monday + datetime.timedelta(days=6)
    
    # Format as DD/MM/YYYY
    monday_str = monday.strftime("%d/%m/%Y")
    sunday_str = sunday.strftime("%d/%m/%Y")
    
    return f"{monday_str} to {sunday_str}"


def calculate_semester_slots(start_date, end_date, slots_per_day=10, weekdays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]):
    """
    Calculate total slots in a semester based on start and end dates
    
    Args:
        start_date: datetime - semester start date (must be Monday)
        end_date: datetime - semester end date (should be Sunday)
        slots_per_day: int - number of slots per day
        weekdays: list - days of the week with classes
        
    Returns:
        tuple - (total_slots, total_weeks)
    """
    if start_date.weekday() != 0:  # 0 is Monday in Python
        raise ValueError("Semester start date must be Monday")
    
    total_days = (end_date - start_date).days + 1
    total_weeks = total_days // 7
    
    # Calculate total slots in semester
    total_slots = total_weeks * len(weekdays) * slots_per_day
    
    return total_slots, total_weeks


def get_day_info(slot_index, start_date, slots_per_day=10, weekdays=["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]):
    """
    Calculate day and period from slot index
    
    Args:
        slot_index: int - slot index (starting from 0)
        start_date: datetime - semester start date
        slots_per_day: int - number of slots per day
        weekdays: list - days of the week with classes
        
    Returns:
        dict - day information including week, day, date, and period
    """
    # Calculate days since start date
    day_index = slot_index // slots_per_day
    
    # Calculate period in day
    period_index = slot_index % slots_per_day + 1  # +1 because periods start from 1
    
    # Calculate week
    week_number = day_index // len(weekdays) + 1  # +1 because weeks start from 1
    
    # Calculate day of week
    weekday_index = day_index % len(weekdays)
    weekday = weekdays[weekday_index]
    
    # Calculate actual date
    actual_date = start_date + datetime.timedelta(days=day_index)
    
    return {
        "week": week_number,
        "weekday": weekday,
        "date": actual_date,
        "period": period_index
    }


def get_period_time(period_index):
    """
    Get start and end times for a period
    
    Args:
        period_index: int - period index (1-10)
        
    Returns:
        dict - period timing information
    """
    periods = {
        1: {"start": "07:00", "end": "07:45"},
        2: {"start": "07:50", "end": "08:35"},
        3: {"start": "08:50", "end": "09:35"},
        4: {"start": "09:40", "end": "10:25"},
        5: {"start": "10:30", "end": "11:15"},
        6: {"start": "13:00", "end": "13:45"},
        7: {"start": "13:50", "end": "14:35"},
        8: {"start": "14:40", "end": "15:25"},
        9: {"start": "15:30", "end": "16:15"},
        10: {"start": "16:20", "end": "17:05"}
    }
    return periods.get(period_index, {"start": "00:00", "end": "00:00"})


def generate_improved_schedule(db, semester_info, total_weeks=18, academic_year=None):
    """
    Generate schedule for a semester using the improved algorithm
    
    Args:
        db: MongoDB database connection
        semester_info: Dictionary with semester information
        total_weeks: Number of weeks in semester (default 18)
        academic_year: Optional academic year to filter classes (e.g. "2022-2023")
        
    Returns:
        tuple - (schedule_entries, warnings)
    """
    semesterNumber = semester_info.get('semesterNumber')
    start_date = semester_info.get('startDate')
    end_date = semester_info.get('endDate')
    
    logger.info(f"Generating schedule for Semester {semesterNumber}")
    
    # Load all classes with optional academic year filter
    class_query = {}
    if academic_year:
        class_query["academicYear"] = academic_year
        logger.info(f"Filtering classes by academic year: {academic_year}")
    
    all_classes = list(db.Class.find(class_query))
    
    # Filter classes by class name pattern to only include specific formats like "10A1", "11B2", "12C3"
    classes = []
    for c in all_classes:
        # Chấp nhận tất cả lớp, không lọc theo pattern
        classes.append(c)
        class_name = c.get("className", "")
        if not re.match(r'^\d{1,2}[A-Z]\d+$', class_name):
            logger.info(f"Class with name '{class_name}' doesn't match standard pattern but will be included")
    
    if not classes:
        logger.error("No classes found")
        return [], ["No classes found"]
    
    logger.info(f"Found {len(classes)} classes")
    for c in classes[:5]:  # Log a few sample classes
        class_id = c.get("classId") or c.get("ClassID")
        class_name = c.get("className", "Unknown")
        logger.info(f"  - Class: {class_name} (ID: {class_id})")
        
        # Kiểm tra học sinh trong lớp này
        student_count = db.Student.count_documents({"classIds": class_id})
        logger.info(f"    - Students: {student_count}")
    
    # Get curriculum based on grade
    # Extract grades from class data
    grades = set()
    for c in classes:
        grade = c.get("grade")
        if grade:
            grades.add(grade)
    
    logger.info(f"Found classes for grades: {grades}")
    
    # Load curriculum subjects for each grade
    curriculum_subjects_by_grade = {}
    for grade in grades:
        # Find curriculum ID for this grade
        curriculum = db.Curriculum.find_one({"grade": grade})
        if not curriculum:
            logger.warning(f"No curriculum found for grade {grade}, using default")
            curriculum_id = grade  # Use grade as curriculum ID if not found
        else:
            curriculum_id = curriculum.get("curriculumId")
        
        # Get subjects for this curriculum
        curriculum_subjects = {}
        for cs in db.CurriculumSubject.find({"curriculumId": curriculum_id}):
            subject_id = cs.get("subjectId")
            if subject_id:
                curriculum_subjects[subject_id] = cs.get("sessions", 3)
        
        curriculum_subjects_by_grade[grade] = curriculum_subjects
        logger.info(f"Found {len(curriculum_subjects)} subjects for grade {grade}")
    
    # Load teachers, rooms, and schedule format slots - don't filter by isActive
    teachers = list(db.Teacher.find())
    logger.info(f"Found {len(teachers)} teachers")
    
    # Don't filter by isActive for Classroom since that field might not exist
    rooms = list(db.Classroom.find())
    logger.info(f"Found {len(rooms)} classrooms")
    
    # Use ScheduleFormat slots - most likely has isActive field
    slots = list(db.ScheduleFormat.find({"isActive": True}).sort([("dayOfWeek", 1), ("slotNumber", 1)]))
    if not slots:
        # If no slots with isActive=True, try without filter
        slots = list(db.ScheduleFormat.find().sort([("dayOfWeek", 1), ("slotNumber", 1)]))
    logger.info(f"Found {len(slots)} schedule format slots")
    
    if not slots:
        logger.error("No schedule slots found. Cannot generate schedule.")
        return [], ["No schedule slots found. Cannot generate schedule."]
    
    # Map subjects to their details - don't filter by isActive
    subjects_map = {s.get("subjectId"): s for s in db.Subject.find()}
    logger.info(f"Found {len(subjects_map)} subjects in database")
    
    # Process teacher information
    teacher_info = {}
    for t in teachers:
        teacher_id = t.get("teacherId")
        major = t.get("major", "").lower()
        capacity = int(t.get("weeklyCapacity", 10))
        teacher_info[teacher_id] = {"major": major, "capacity": capacity, "name": t.get("fullName", "")}
        logger.debug(f"Teacher {teacher_id}: Major={major}, Capacity={capacity}")
    
    # Prepare class needs for subjects
    class_needs = {}
    for c in classes:
        class_id = c.get("classId")
        if not class_id:
            logger.error(f"Class missing classId: {c}")
            continue
        
        grade = c.get("grade")
        if not grade:
            logger.warning(f"Class {class_id} missing grade, skipping")
            continue
            
        curriculum_subjects = curriculum_subjects_by_grade.get(grade, {})
        if not curriculum_subjects:
            logger.warning(f"No curriculum subjects for grade {grade}, skipping class {class_id}")
            continue
            
        class_needs[class_id] = {subj_id: sessions for subj_id, sessions in curriculum_subjects.items()}
    
    # Initialize schedule generation
    total_slots = len(slots) * total_weeks
    logger.info(f"Total schedule slots: {total_slots}")
    
    # Track resources
    schedule_entries = []
    warnings = []
    entry_id = 1
    
    # Check if we have any rooms
    if not rooms:
        logger.error("No classrooms found. Cannot generate schedule.")
        return [], ["No classrooms found. Cannot generate schedule."]
    
    # Check if we have any teachers
    if not teachers:
        logger.error("No teachers found. Cannot generate schedule.")
        return [], ["No teachers found. Cannot generate schedule."]
    
    # Track teacher weekly usage
    current_week = 1
    teacher_weekly_usage = {t_id: 0 for t_id in teacher_info.keys()}
    
    # Calculate weekdays available from slots
    weekdays = sorted(set(slot.get("dayOfWeek") for slot in slots))
    logger.info(f"Schedule will use these weekdays: {weekdays}")
    
    # Process each slot
    for week in range(1, total_weeks + 1):
        logger.info(f"Processing week {week}")
        
        # Reset weekly teacher usage when week changes
        if week != current_week:
            teacher_weekly_usage = {t_id: 0 for t_id in teacher_info.keys()}
            current_week = week
        
        for slot in slots:
            # Extract slot info
            slot_id = slot.get("slotId")
            day_of_week = slot.get("dayOfWeek")
            slot_number = slot.get("slotNumber")
            start_time = slot.get("startTime")
            end_time = slot.get("endTime")
            
            # Calculate actual date for this slot
            # Find day offset based on day of week
            day_offset = weekdays.index(day_of_week)
            slot_date = start_date + datetime.timedelta(days=7*(week-1) + day_offset)
            
            # Skip if date is outside semester range
            if slot_date < start_date or slot_date > end_date:
                continue
            
            # Available teachers for this slot
            available_teachers = []
            for t_id, info in teacher_info.items():
                # Check if teacher has remaining capacity this week
                if teacher_weekly_usage.get(t_id, 0) < info["capacity"]:
                    available_teachers.append(t_id)
            
            # Available rooms for this slot
            available_rooms = [r.get("classroomId") for r in rooms]
            
            # Used resources for this slot
            used_teachers = set()
            used_rooms = set()
            
            # Process each class
            for class_doc in classes:
                class_id = class_doc.get("classId")
                if not class_id:
                    logger.error(f"Class missing classId: {class_doc}")
                    continue
                
                # Skip if teacher/room already assigned to this class at this slot
                if class_id in used_teachers or class_id in used_rooms:
                    continue
                
                # Skip if no subjects left for this class
                if not any(sessions > 0 for sessions in class_needs.get(class_id, {}).values()):
                    continue
                
                # Try to find a subject that can be scheduled
                for subject_id, sessions_left in sorted(
                    class_needs.get(class_id, {}).items(), 
                    key=lambda x: x[1], 
                    reverse=True
                ):
                    if sessions_left <= 0:
                        continue
                    
                    # Skip if no rooms available
                    if not available_rooms:
                        continue
                    
                    # Find a teacher for this subject
                    subject_name = subjects_map.get(subject_id, {}).get("subjectName", "").lower()
                    suitable_teachers = []
                    
                    # Find teachers with matching major
                    for t_id in available_teachers:
                        if t_id in used_teachers:
                            continue
                        
                        teacher_major = teacher_info.get(t_id, {}).get("major", "").lower()
                        
                        # Check if teacher major matches subject
                        if teacher_major and subject_name:
                            # Try different matching methods
                            match = False
                            # Direct match
                            if subject_name in teacher_major:
                                match = True
                            # Word matching (e.g. "vật lý" in "Giáo viên vật lý")
                            elif any(subj_word in teacher_major.split() for subj_word in subject_name.split()):
                                match = True
                                
                            if match:
                                suitable_teachers.append(t_id)
                    
                    # If no specialized teachers, use any available teacher
                    if not suitable_teachers:
                        suitable_teachers = [t_id for t_id in available_teachers if t_id not in used_teachers]
                    
                    if not suitable_teachers:
                        continue
                    
                    # Assign resources
                    teacher_id = suitable_teachers[0]
                    room_id = available_rooms[0]
                    
                    # Update tracking
                    available_teachers.remove(teacher_id)
                    available_rooms.remove(room_id)
                    used_teachers.add(teacher_id)
                    used_rooms.add(room_id)
                    teacher_weekly_usage[teacher_id] += 1
                    class_needs[class_id][subject_id] -= 1
                    
                    # Get class and teacher name for better tracking
                    class_name = class_doc.get("className", f"Class {class_id}")
                    teacher_name = teacher_info.get(teacher_id, {}).get("name", f"Teacher {teacher_id}")
                    
                    # Create schedule entry
                    schedule_entry = {
                        "scheduleId": entry_id,
                        "semesterId": semester_info.get("semesterId", 1),  # Use existing semester ID
                        "semesterNumber": semesterNumber,
                        "weekNumber": week,
                        "dayOfWeek": day_of_week,
                        "classId": class_id,
                        "className": class_name,
                        "subjectId": subject_id,
                        "subjectName": subjects_map.get(subject_id, {}).get("subjectName", ""),
                        "teacherId": teacher_id,
                        "teacherName": teacher_name,
                        "classroomId": room_id,
                        "slotId": slot_id,
                        "slotNumber": slot_number,
                        "topic": f"{subject_name.title()} - Tuần {week}",
                        "sessionDate": slot_date,
                        "sessionWeek": get_week_date_range(week, start_date),
                        "startTime": start_time,
                        "endTime": end_time,
                        "isActive": True,
                        "createdAt": datetime.datetime.utcnow(),
                        "updatedAt": datetime.datetime.utcnow()
                    }
                    
                    schedule_entries.append(schedule_entry)
                    logger.debug(f"Scheduled {subject_name} for {class_name} with {teacher_name} at {day_of_week} slot {slot_number} week {week}")
                    
                    entry_id += 1
                    break  # Scheduled one subject for this class at this slot
    
    # Check for subjects not fully scheduled
    for class_id, subjects in class_needs.items():
        class_name = next((c.get("className", f"Class {class_id}") for c in classes if c.get("classId") == class_id), f"Class {class_id}")
        
        for subject_id, sessions_left in subjects.items():
            if sessions_left > 0:
                subject_name = subjects_map.get(subject_id, {}).get("subjectName", f"Subject ID {subject_id}")
                warnings.append(
                    f"Could not schedule all sessions for {subject_name} in class {class_name}. {sessions_left} sessions remaining."
                )
    
    logger.info(f"Schedule generation completed with {len(schedule_entries)} entries and {len(warnings)} warnings")
    
    return schedule_entries, warnings


def generate_schedule(db, semester_doc, total_weeks=18):
    """
    Generate schedule for a semester using the greedy approach
    
    Args:
        db: MongoDB database connection
        semester_doc: Semester document with semester info
        total_weeks: Number of weeks in semester (default 18)
        
    Returns:
        tuple - (schedule_entries, warnings)
    """
    logger.info(f"Generating schedule for semester {semester_doc.get('semesterName')}")
    
    # Get batch ID (handle both 'batchId' and 'BatchID')
    batch_id = semester_doc.get('batchId')
    
    if not batch_id:
        error_msg = f"No batchId found in semester document: {semester_doc}"
        logger.error(error_msg)
        raise ValueError(error_msg)
    
    logger.info(f"Using batch ID: {batch_id}")
    
    # Map batch to grade (assuming batch 1=12, 2=11, 3=10)
    grade_map = {"1": 12, "2": 11, "3": 10}
    grade = grade_map.get(str(batch_id))
    
    if not grade:
        logger.warning(f"Could not map batch {batch_id} to grade, using default grade 10")
        grade = 10
    
    logger.info(f"Using grade: {grade} for batch ID: {batch_id}")
    
    # Get curriculum ID
    curriculum_id = semester_doc.get('curriculumId')
    if not curriculum_id:
        # Map batch to curriculum (assuming batch 1=12, 2=11, 3=10)
        curriculum_map = {"1": "12", "2": "11", "3": "10"}
        curriculum_id = curriculum_map.get(str(batch_id), "10")
        logger.info(f"No curriculum found, using default mapping: Batch {batch_id} -> Curriculum {curriculum_id}")
    else:
        logger.info(f"Using curriculum ID: {curriculum_id}")
    
    # Load resources - Use grade instead of batchId to find classes
    classes = list(db.Class.find({"grade": grade}))
    
    if not classes:
        logger.error(f"No classes found for grade {grade}")
        return [], [f"No classes found for grade {grade}"]
    
    logger.info(f"Found {len(classes)} classes for grade {grade}")
    for c in classes[:3]:  # Log a few sample classes
        class_id = c.get("classId") or c.get("ClassID")
        class_name = c.get("ClassName", "Unknown")
        logger.info(f"  - Class: {class_name} (ID: {class_id})")
    
    teachers = list(db.Teacher.find())
    logger.info(f"Found {len(teachers)} teachers")
    
    rooms = list(db.Classroom.find())
    logger.info(f"Found {len(rooms)} rooms")
    
    slots = list(db[COLLECTIONS['SCHEDULE_FORMAT']].find().sort([("dayOfWeek", 1), ("slotNumber", 1)]))
    logger.info(f"Found {len(slots)} time slots")
    
    # Get curriculum subjects and sessions needed
    curriculum_subjects = {}
    for cs in db.CurriculumSubject.find({"curriculumId": c.get('curriculumId')}):
        subject_id = cs.get("subjectId")
        if subject_id:
            curriculum_subjects[subject_id] = cs.get("sessions", 3)
    
    if not curriculum_subjects:
        logger.error(f"No curriculum subjects found for curriculum {c.get('curriculumId')}")
        return [], [f"No curriculum subjects found for curriculum {c.get('curriculumId')}"]
    
    logger.info(f"Found {len(curriculum_subjects)} subjects in curriculum {c.get('curriculumId')}")
    
    # Map subjects to their details
    subjects_map = {s.get("subjectId"): s for s in db.Subject.find()}
    logger.info(f"Found {len(subjects_map)} subjects in database")
    
    # Debug teacher majors and capacities
    teacher_info = {}
    for t in teachers:
        teacher_id = t.get("teacherId")
        major = t.get("major", "").lower()
        capacity = int(t.get("WeeklyCapacity", 10))
        teacher_info[teacher_id] = {"major": major, "capacity": capacity}
        logger.debug(f"Teacher {teacher_id}: Major={major}, Capacity={capacity}")
    
    # Class needs for subjects
    class_needs = {}
    for c in classes:
        class_id = c.get("classId")
        if not class_id:
            logger.error(f"Class missing classId: {c}")
            continue
        
        class_needs[class_id] = {subj_id: sessions for subj_id, sessions in curriculum_subjects.items()}
    
    # Initialize schedule generation
    total_slots = len(slots) * total_weeks
    logger.info(f"Total schedule slots: {total_slots}")
    
    # Track resources
    schedule_entries = []
    warnings = []
    entry_id = 1
    
    # Track teacher weekly usage
    current_week = 1
    teacher_weekly_usage = {t_id: 0 for t_id in teacher_info.keys()}
    
    # Process each slot
    for week in range(1, total_weeks + 1):
        logger.info(f"Processing week {week}")
        
        # Reset weekly teacher usage when week changes
        if week != current_week:
            teacher_weekly_usage = {t_id: 0 for t_id in teacher_info.keys()}
            current_week = week
        
        for slot in slots:
            # Extract slot info
            slot_id = slot.get("slotId")
            day_of_week = slot.get("dayOfWeek")
            slot_number = slot.get("slotNumber")
            start_time = slot.get("startTime")
            end_time = slot.get("endTime")
            
            # Build date - assuming semester start date is day 1
            # For demonstration, using a fixed date offset
            session_date = semester_doc.get("startDate", datetime.datetime.now())
            if isinstance(session_date, str):
                try:
                    session_date = datetime.datetime.fromisoformat(session_date.rstrip("Z"))
                except Exception as e:
                    logger.error(f"Error parsing date {session_date}: {str(e)}")
                    session_date = datetime.datetime.now()
            
            day_offset = (week - 1) * 7
            if day_of_week == "Monday": day_offset += 0
            elif day_of_week == "Tuesday": day_offset += 1
            elif day_of_week == "Wednesday": day_offset += 2
            elif day_of_week == "Thursday": day_offset += 3
            elif day_of_week == "Friday": day_offset += 4
            elif day_of_week == "Saturday": day_offset += 5
            elif day_of_week == "Sunday": day_offset += 6
            
            session_date = session_date + datetime.timedelta(days=day_offset)
            
            # Available teachers for this slot
            available_teachers = []
            for t_id, info in teacher_info.items():
                # Check if teacher has remaining capacity this week
                if teacher_weekly_usage.get(t_id, 0) < info["capacity"]:
                    available_teachers.append(t_id)
            
            # Available rooms for this slot
            available_rooms = [r.get("classroomId") for r in rooms]
            
            # Process each class
            for class_doc in classes:
                class_id = class_doc.get("classId")
                if not class_id:
                    logger.error(f"Class missing classId: {class_doc}")
                    continue
                
                # Skip if no subjects left for this class
                if not any(sessions > 0 for sessions in class_needs.get(class_id, {}).values()):
                    continue
                
                # Try to find a subject that can be scheduled
                for subject_id, sessions_left in list(class_needs.get(class_id, {}).items()):
                    if sessions_left <= 0:
                        continue
                    
                    # Skip if no rooms available
                    if not available_rooms:
                        continue
                    
                    # Find a teacher for this subject
                    subject_name = subjects_map.get(subject_id, {}).get("subjectName", "").lower()
                    suitable_teachers = []
                    
                    # Find teachers with matching major
                    for t_id in available_teachers:
                        teacher_major = teacher_info.get(t_id, {}).get("major", "").lower()
                        if teacher_major and subject_name and subject_name in teacher_major:
                            suitable_teachers.append(t_id)
                    
                    # If no specialized teachers, use any available teacher
                    if not suitable_teachers:
                        suitable_teachers = available_teachers.copy()
                    
                    if not suitable_teachers:
                        continue
                    
                    # Assign resources
                    teacher_id = suitable_teachers[0]
                    room_id = available_rooms[0]
                    
                    # Update tracking
                    available_teachers.remove(teacher_id)
                    available_rooms.remove(room_id)
                    teacher_weekly_usage[teacher_id] += 1
                    class_needs[class_id][subject_id] -= 1
                    
                    # Create schedule entry
                    schedule_entry = {
                        "classScheduleId": str(entry_id),
                        "semesterId": semester_doc.get("semesterId"),
                        "weekNumber": week,
                        "dayNumber": {"Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6, "Sunday": 7}.get(day_of_week, 1),
                        "classId": class_id,
                        "subjectId": subject_id,
                        "teacherId": teacher_id,
                        "classroomId": room_id,
                        "slotId": slot_id,
                        "roomName": next((r.get("roomName", "") for r in rooms if r.get("classroomId") == room_id), ""),
                        "topic": f"{subject_name.title()} - Tuần {week}",
                        "sessionDate": session_date,
                        "sessionWeek": get_week_date_range(week, session_date - datetime.timedelta(days=day_offset)),
                        "dayOfWeek": day_of_week,
                        "startTime": start_time,
                        "endTime": end_time,
                        "isActive": True
                    }
                    
                    schedule_entries.append(schedule_entry)
                    
                    entry_id += 1
                    break  # Scheduled one subject for this class at this slot
    
    # Check for subjects not fully scheduled
    for class_id, subjects in class_needs.items():
        for subject_id, sessions_left in subjects.items():
            if sessions_left > 0:
                subject_name = subjects_map.get(subject_id, {}).get("subjectName", f"Subject ID {subject_id}")
                warnings.append(
                    f"Could not schedule all sessions for {subject_name} in class {class_id}. {sessions_left} sessions remaining."
                )
    
    # Save to database
    if schedule_entries and db is not None:
        try:
            # Đảm bảo các trường datetime được xử lý đúng
            for entry in schedule_entries:
                if isinstance(entry["sessionDate"], datetime.datetime):
                    entry["sessionDate"] = entry["sessionDate"].replace(tzinfo=None)
            
            result = db.ClassSchedule.insert_many(schedule_entries)
            logger.info(f"Inserted {len(result.inserted_ids)} schedule entries into database")
        except Exception as e:
            logger.error(f"Error saving schedules to database: {str(e)}")
            warnings.append(f"Error saving schedules: {str(e)}")
    
    if not schedule_entries:
        logger.warning("No schedules were generated!")
    
    return schedule_entries, warnings 
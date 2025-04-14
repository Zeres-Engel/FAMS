"""
Schedule generation main module
"""
import os
import datetime
from .core import generate_schedule
from .export import export_schedule_to_csv, export_semester_schedules
from ..constants import COLLECTIONS


def prepare_schedule_directory():
    """Prepare the directory for schedule output"""
    output_dir = "src/data/schedules"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    return output_dir


def generate_schedule_entries(db, schedule_data, total_weeks, start_date, end_date):
    """Generate schedule entries for each week of the semester"""
    from datetime import datetime, timedelta
    import math
    from bson import ObjectId
    
    # Generate the actual schedule entries
    print(f"Generating schedule entries from {start_date} to {end_date}")
    
    # Calculate number of days between start and end
    delta = end_date - start_date
    days_in_semester = delta.days + 1
    
    # Ensure we don't exceed the number of weeks
    actual_weeks = min(total_weeks, math.ceil(days_in_semester / 7))
    
    print(f"Generating schedule for {actual_weeks} weeks ({days_in_semester} days)")
    
    # Get time slots from the database
    time_slots = list(db.TimeSlot.find({}))
    time_slots_dict = {slot["slotId"]: slot for slot in time_slots}
    
    # For debugging
    print(f"Found {len(time_slots)} time slots in database")
    
    # Get classrooms for more detailed information
    classrooms = list(db.Classroom.find({}))
    classrooms_dict = {str(room["_id"]): room for room in classrooms}
    print(f"Found {len(classrooms)} classrooms in database")
    
    # For debugging
    if len(schedule_data) > 0:
        print(f"Sample schedule: {schedule_data[0]}")
    
    # Get subject info
    subjects = list(db.Subject.find({}))
    subjects_dict = {str(subject["_id"]): subject for subject in subjects}
    
    # Get teacher info for better display
    teachers = list(db.Teacher.find({}))
    teachers_dict = {str(teacher["_id"]): teacher for teacher in teachers}
    
    # Get class info
    classes = list(db.Class.find({}))
    classes_dict = {str(class_doc["_id"]): class_doc for class_doc in classes}
    
    # Generate entries for each week
    current_date = start_date
    schedule_entries = []
    
    # For each week
    for week_num in range(1, actual_weeks + 1):
        print(f"Generating schedule for Week {week_num}")
        week_start_date = current_date
        
        # For each day in the week
        for day_offset in range(7):
            day_date = current_date + timedelta(days=day_offset)
            
            # Skip if date is out of semester range
            if day_date > end_date:
                continue
                
            # Get day name (Monday, Tuesday, etc.)
            day_name = day_date.strftime("%A")
            
            # Skip weekends (Saturday and Sunday)
            if day_name in ["Saturday", "Sunday"]:
                continue
                
            # Format date for better display
            formatted_date = day_date.strftime("%Y-%m-%d")
            
            # For each schedule in this day
            day_entries = 0
            for schedule in schedule_data:
                if schedule["dayOfWeek"] == day_name:
                    # Get time slot information
                    slot_id = schedule["slotId"]
                    time_slot = time_slots_dict.get(slot_id, {})
                    
                    # Get classroom details
                    classroom_id = schedule["classroomId"]
                    classroom = classrooms_dict.get(classroom_id, {})
                    room_name = classroom.get("roomName", f"Phòng {classroom_id}")
                    
                    # Get subject details
                    subject_id = schedule["subjectId"]
                    subject = subjects_dict.get(subject_id, {})
                    subject_name = subject.get("subjectName", "")
                    if not subject_name:
                        subject_name = subject.get("name", f"Môn học {subject_id}")
                    
                    # Get teacher details
                    teacher_id = schedule["teacherId"]
                    teacher = teachers_dict.get(str(teacher_id), {})
                    teacher_name = teacher.get("fullName", "")
                    if not teacher_name:
                        first_name = teacher.get("firstName", "")
                        last_name = teacher.get("lastName", "")
                        if first_name and last_name:
                            teacher_name = f"{last_name} {first_name}"
                        else:
                            teacher_name = f"Giáo viên {teacher_id}"
                    
                    # Get class details
                    class_id = schedule["classId"]
                    class_doc = classes_dict.get(str(class_id), {})
                    class_name = class_doc.get("className", "")
                    if not class_name:
                        class_name = class_doc.get("name", f"Lớp {class_id}")
                    
                    # Create schedule entry with complete information
                    entry = {
                        "_id": ObjectId(),
                        "weekNumber": week_num,
                        "sessionDate": day_date,
                        "sessionDateFormatted": formatted_date,
                        "dayOfWeek": day_name,
                        "slotId": slot_id,
                        "startTime": time_slot.get("startTime", ""),
                        "endTime": time_slot.get("endTime", ""),
                        "teacherId": teacher_id,
                        "teacherName": teacher_name,
                        "subjectId": subject_id,
                        "subjectName": subject_name,
                        "classId": class_id,
                        "className": class_name,
                        "classroomId": classroom_id,
                        "roomName": room_name,
                        "semesterId": schedule["semesterId"],
                        "sessionWeek": f"Week {week_num}"
                    }
                    
                    schedule_entries.append(entry)
                    day_entries += 1
            
            if day_entries > 0:
                print(f"  {day_name} ({day_date.strftime('%d/%m/%Y')}): {day_entries} entries")
                    
        # Move to next week
        current_date += timedelta(days=7)
    
    # Insert entries into database
    if schedule_entries:
        # Remove any existing entries if needed
        db.ScheduleEntry.delete_many({"semesterId": schedule_data[0]["semesterId"]})
        
        # Insert new entries
        db.ScheduleEntry.insert_many(schedule_entries)
        print(f"Generated {len(schedule_entries)} schedule entries")
    else:
        print("No schedule entries generated")
    
    return schedule_entries


def generate_strict_schedule(db, semester_doc, total_weeks=20):
    """
    Generate a schedule for a semester using strict assignment
    
    Args:
        db: MongoDB database connection
        semester_doc: Semester document
        total_weeks: Total weeks in semester
        
    Returns:
        dict - results of generation
    """
    import os
    from datetime import datetime, timedelta
    from src.schedule.core import generate_schedule
    from src.schedule.export import export_schedule_to_csv
    
    semester_id = semester_doc["_id"]
    batch_id = semester_doc["batchId"]
    
    print(f"Generating schedule for semester {semester_id} (batch {batch_id})")
    
    # Get classes for this batch
    classes = list(db.Class.find({"batchId": batch_id}))
    class_ids = [c["_id"] for c in classes]
    print(f"Found {len(classes)} classes with batch ID {batch_id}")
    
    # Get teachers
    teachers = list(db.Teacher.find({}))
    teacher_ids = [t["_id"] for t in teachers]
    print(f"Found {len(teachers)} teachers")
    
    # Get curriculum
    curriculum_docs = list(db.CurriculumSubject.find({
        "gradeLevel": semester_doc.get("gradeLevel", 10)
    }))
    print(f"Found {len(curriculum_docs)} curriculum subjects")
    
    # Get start and end dates
    start_date = semester_doc.get("startDate")
    end_date = semester_doc.get("endDate")
    
    # Ensure dates are datetime objects
    if isinstance(start_date, str):
        start_date = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
    if isinstance(end_date, str):
        end_date = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
    
    # Verify we have valid dates and duration
    if not start_date or not end_date or start_date >= end_date:
        print("WARNING: Invalid semester dates. Using default.")
        start_date = datetime.now()
        end_date = start_date + timedelta(days=100)
    
    # Check if we need to adjust date format
    if not hasattr(start_date, 'strftime'):
        print("WARNING: Invalid date format. Using default.")
        start_date = datetime.now()
        end_date = start_date + timedelta(days=100)
    
    print(f"Semester period: {start_date.strftime('%d/%m/%Y')} to {end_date.strftime('%d/%m/%Y')}")
    
    # Generate schedule using the core algorithm
    generation_result = generate_schedule(
        db,
        semester_doc,
        total_weeks
    )
    
    # Generate weekly entries if we have a schedule
    schedule_data = generation_result.get("schedule", [])
    if schedule_data:
        print(f"Generated base schedule with {len(schedule_data)} entries")
        
        # Generate actual entries for each week
        schedule_entries = generate_schedule_entries(
            db, 
            schedule_data, 
            total_weeks, 
            start_date, 
            end_date
        )
        
        # Prepare data for export
        classes_data = {str(c["_id"]): c for c in classes}
        teachers_data = {str(t["_id"]): t for t in teachers}
        
        # Get subjects
        subjects = list(db.Subject.find({}))
        subjects_data = {str(s["_id"]): s for s in subjects}
        
        # Get classrooms for more detailed room info
        classrooms = list(db.Classroom.find({}))
        classrooms_data = {str(room["_id"]): room for room in classrooms}
        
        # Update classes data with room information
        for class_id, class_data in classes_data.items():
            classroom_id = class_data.get("classroomId")
            if classroom_id:
                classroom = classrooms_data.get(classroom_id)
                if classroom:
                    class_data["roomName"] = classroom.get("roomName", f"Phòng {classroom_id}")
        
        # Export to CSV
        output_dir = "src/data/schedules"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        teacher_count, class_count = export_schedule_to_csv(
            schedule_entries, 
            teachers_data=teachers_data, 
            classes_data=classes_data, 
            subjects_data=subjects_data,
            output_dir=output_dir
        )
        
        print(f"Exported schedules: {teacher_count} teachers, {class_count} classes to {output_dir}")
        
        # Add entry count to result
        generation_result["entries"] = len(schedule_entries)
    else:
        generation_result["entries"] = 0
        print("No schedule data to generate entries from")
    
    return generation_result


def generate_semesters(db):
    """
    Generate semesters for all batches
    """
    # Create semesters for each batch
    semesters = []
    
    # Get all batches
    batches = list(db[COLLECTIONS['BATCH']].find())
    
    # For each batch, create 6 semesters (3 years x 2 semesters)
    for batch in batches:
        batch_id = batch.get('BatchID') or batch.get('batchId')
        if not batch_id:
            continue
            
        start_year = batch.get('startYear', 2022)
        
        for year in range(3):  # 3 years of high school
            for sem in range(1, 3):  # 2 semesters per year
                semester_name = f"Học kỳ {sem} năm {year + 1}"
                
                # Calculate dates
                if sem == 1:  # First semester: Sep to Dec
                    start_date = datetime.datetime(start_year + year, 9, 1)
                    end_date = datetime.datetime(start_year + year, 12, 31)
                else:  # Second semester: Jan to May
                    start_date = datetime.datetime(start_year + year + 1, 1, 1)
                    end_date = datetime.datetime(start_year + year + 1, 5, 31)
                
                # Default curriculum based on batch (grade level)
                curriculum_id = str(12 - year)  # Grade 10 = curriculum 10, etc.
                
                semester = {
                    'semesterId': f"{batch_id}_{year+1}_{sem}",
                    'semesterName': semester_name,
                    'startDate': start_date,
                    'endDate': end_date,
                    'batchId': batch_id,
                    'curriculumId': curriculum_id,
                    'isActive': True,
                    'createdAt': datetime.datetime.now(),
                    'updatedAt': datetime.datetime.now()
                }
                
                # Insert into database
                db[COLLECTIONS['SEMESTER']].insert_one(semester)
                semesters.append(semester)
    
    return semesters


def generate_all_schedules(db, semesters, output_dir="src/data/schedules"):
    """
    Generate schedules for all semesters.
    
    Args:
        db: MongoDB database connection
        semesters: List of semester documents
        output_dir: Directory to export schedules to
        
    Returns:
        int: Total number of schedule entries generated
    """
    total_entries = 0
    
    for sem in semesters:
        # Generate schedule for this semester
        semester_name = sem.get('semesterName') or sem.get('SemesterName', 'Unknown')
        batch_id = sem.get('batchId') or sem.get('BatchID', 'Unknown')
        
        print(f"[SCHEDULE] Generating schedule for semester {semester_name} of Batch {batch_id}...")
        scheds, warnings = generate_schedule(db, sem, total_weeks=18)
        total_entries += len(scheds)
        
        if warnings:
            print(f"[WARNING] Found {len(warnings)} warnings while generating schedules:")
            for w in warnings:
                print(f"  - {w}")
        
        # Export schedule to CSV if possible
        try:
            from .export import export_semester_schedules
            export_semester_schedules(db, sem, output_dir)
        except Exception as e:
            print(f"[WARNING] Failed to export schedules: {str(e)}")
            print("[WARNING] Schedule export failed, but database initialization continues.")
            
    return total_entries
"""
Core scheduling algorithms and utilities
"""
import datetime


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


def generate_greedy_schedule(start_date, end_date, classes, curriculum_subjects, teachers, rooms, db=None):
    """
    Generate a schedule using a greedy algorithm
    
    Args:
        start_date: datetime - semester start date (must be Monday)
        end_date: datetime - semester end date (should be Sunday)
        classes: list - list of classes
        curriculum_subjects: dict - mapping from curriculum_id to subjects and sessions
        teachers: list - list of teachers
        rooms: list - list of classrooms
        db: database connection (optional) - database connection for saving
        
    Returns:
        tuple - (schedule_docs, warnings)
    """
    weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    slots_per_day = 10
    
    # Debug information
    print(f"DEBUG: Schedule generation with {len(classes)} classes, {len(teachers)} teachers, {len(rooms)} rooms")
    print(f"DEBUG: Curriculum subjects: {curriculum_subjects.keys()}")
    
    # Calculate total slots in semester
    total_slots, total_weeks = calculate_semester_slots(start_date, end_date, slots_per_day, weekdays)
    print(f"DEBUG: Total slots: {total_slots}, Total weeks: {total_weeks}")
    
    # Initialize data structures
    class_subjects = {}
    for c in classes:
        batch_id = c.get("BatchID")
        curr_id = "0"
        if batch_id == 3:
            curr_id = "10"
        elif batch_id == 2:
            curr_id = "11"
        else:
            curr_id = "12"
            
        # Get list of subjects and sessions needed
        subjects = curriculum_subjects.get(curr_id, [])
        if not subjects:
            print(f"DEBUG: No subjects found for curriculum ID {curr_id}")
        
        class_subjects[c["classId"]] = {s["subjectId"]: s["sessions"] for s in subjects}
    
    print(f"DEBUG: Class subjects mapping: {class_subjects}")
    
    # Initialize free slots for teachers, classes and rooms
    teacher_free = {t["teacherId"]: set(range(total_slots)) for t in teachers}
    class_free = {c["classId"]: set(range(total_slots)) for c in classes}
    room_free = {r["classroomId"]: set(range(total_slots)) for r in rooms}
    
    # Initialize weekly teacher schedules
    teacher_weekly_schedule = {t["teacherId"]: {w: 0 for w in range(1, total_weeks + 1)} for t in teachers}
    teacher_weekly_capacity = {t["teacherId"]: int(t.get("WeeklyCapacity", 10)) for t in teachers}
    
    # Debug teacher majors
    print("DEBUG: Teacher majors:")
    for t in teachers:
        print(f"  - Teacher {t['teacherId']}: {t.get('major', 'No major specified')}")
    
    # Map subject_id -> subject
    subjects_map = {}
    if db is not None:
        subjects_map = {s["subjectId"]: s for s in db.Subject.find()}
        print(f"DEBUG: Found {len(subjects_map)} subjects in database")
        for sid, subj in subjects_map.items():
            print(f"  - Subject {sid}: {subj.get('subjectName', 'Unknown')}")
            
    # Initialize results
    schedule_docs = []
    warnings = []
    schedule_id = 1
    
    # Iterate through each slot
    for slot_index in range(total_slots):
        # Get day information for slot
        day_info = get_day_info(slot_index, start_date, slots_per_day, weekdays)
        week = day_info["week"]
        weekday = day_info["weekday"]
        period = day_info["period"]
        
        # Get period time information
        period_time = get_period_time(period)
        
        # List of available teachers at this slot (and not over capacity this week)
        teachers_available = []
        for t in teachers:
            t_id = t["teacherId"]
            if (slot_index in teacher_free[t_id] and 
                teacher_weekly_schedule[t_id][week] < teacher_weekly_capacity[t_id]):
                teachers_available.append(t)
        
        # Iterate through classes
        for c in classes:
            c_id = c["classId"]
            
            # Skip if class already has schedule at this slot
            if slot_index not in class_free[c_id]:
                continue
            
            # Iterate through subjects that need scheduling
            for subject_id, sessions_left in list(class_subjects.get(c_id, {}).items()):
                if sessions_left <= 0:
                    continue
                
                # Find teachers who can teach this subject
                subject_name = subjects_map.get(subject_id, {}).get("subjectName", "")
                candidate_teachers = [t for t in teachers_available 
                                     if subject_name.lower() in t.get("major", "").lower()]
                
                # If no specialized teachers, try with any available teacher
                if not candidate_teachers:
                    candidate_teachers = teachers_available.copy()
                
                # Find available teacher
                teacher_found = None
                for t in candidate_teachers:
                    t_id = t["teacherId"]
                    if slot_index in teacher_free[t_id]:
                        teacher_found = t
                        break
                
                if not teacher_found:
                    continue
                
                # Find available room
                room_found = None
                for r in rooms:
                    r_id = r["classroomId"]
                    if slot_index in room_free[r_id]:
                        room_found = r
                        break
                
                if not room_found:
                    continue
                
                # Schedule class
                t_id = teacher_found["teacherId"]
                r_id = room_found["classroomId"]
                
                # Update status
                teacher_free[t_id].remove(slot_index)
                class_free[c_id].remove(slot_index)
                room_free[r_id].remove(slot_index)
                
                # Update teacher's weekly sessions
                teacher_weekly_schedule[t_id][week] += 1
                
                # Reduce number of sessions needed for subject
                class_subjects[c_id][subject_id] -= 1
                
                # Create schedule record
                schedule_docs.append({
                    "classScheduleId": str(schedule_id),
                    "semesterId": c.get("semesterId", "1"),
                    "weekNumber": week,
                    "dayNumber": day_info["date"].weekday() + 1,  # 1 = Monday, 7 = Sunday
                    "classId": c_id,
                    "subjectId": subject_id,
                    "teacherId": t_id,
                    "classroomId": r_id,
                    "slotId": str(period),
                    "roomName": room_found.get("roomName", ""),
                    "topic": f"{subjects_map.get(subject_id, {}).get('subjectName', 'Unknown')} - Week {week}",
                    "sessionDate": day_info["date"],
                    "sessionWeek": f"Week {week}",
                    "dayOfWeek": weekday,
                    "startTime": period_time["start"],
                    "endTime": period_time["end"],
                    "isActive": True
                })
                
                schedule_id += 1
                break  # Scheduled one subject for this class at this slot, move to next class
    
    # Check for subjects not fully scheduled
    for c_id, subjects in class_subjects.items():
        for subject_id, sessions_left in subjects.items():
            if sessions_left > 0:
                subject_name = subjects_map.get(subject_id, {}).get("subjectName", f"Subject ID {subject_id}")
                warnings.append(
                    f"Only {subjects[subject_id] - sessions_left}/{subjects[subject_id]} sessions scheduled for subject {subject_name} in class {c_id}. Extend semester required."
                )
    
    # Save to database if connection provided
    if db is not None and len(schedule_docs) > 0:
        db.ClassSchedule.insert_many(schedule_docs)
    
    return schedule_docs, warnings 
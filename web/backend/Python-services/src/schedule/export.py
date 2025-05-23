"""
Schedule export utilities for FAMS
"""
import os
import csv
from datetime import datetime


def export_schedule_to_csv(schedule_entries, teachers_data=None, classes_data=None, subjects_data=None, output_dir="src/data/schedules"):
    """
    Export schedules to CSV files
    
    This function will export all schedules to CSV files, grouping records by teacher and class
    
    Args:
        schedule_entries: List of schedule entries
        teachers_data: Dictionary of teacher info {id: teacher_doc}
        classes_data: Dictionary of class info {id: class_doc}
        subjects_data: Dictionary of subject info {id: subject_doc}
        output_dir: Output directory
    
    Returns:
        tuple: (teacher_count, class_count)
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    # Helper to truncate long names
    def truncate(s, max_len=30):
        if not s:
            return ""
        if isinstance(s, (int, float)):
            s = str(s)
        if len(s) > max_len:
            return s[:max_len-3] + "..."
        return s
    
    # Format dates correctly for Vietnamese format
    def format_date(date_obj):
        if not date_obj:
            return ""
        if isinstance(date_obj, str):
            try:
                date_obj = datetime.fromisoformat(date_obj.replace('Z', '+00:00'))
            except:
                return date_obj
        
        # Format as Vietnamese date
        try:
            return date_obj.strftime("%d/%m/%Y")
        except:
            return str(date_obj)
    
    # Group entries by teacher
    teacher_schedules = {}
    for entry in schedule_entries:
        teacher_id = str(entry.get("teacherId", ""))
        if teacher_id:
            if teacher_id not in teacher_schedules:
                teacher_schedules[teacher_id] = []
            teacher_schedules[teacher_id].append(entry)
    
    # Group entries by class
    class_schedules = {}
    for entry in schedule_entries:
        class_id = str(entry.get("classId", ""))
        if class_id:
            if class_id not in class_schedules:
                class_schedules[class_id] = []
            class_schedules[class_id].append(entry)
    
    # Write teacher schedules
    teacher_count = 0
    for teacher_id, entries in teacher_schedules.items():
        # Skip if no entries
        if not entries:
            continue
            
        # Get teacher name, prioritizing the pre-computed value
        sample_entry = entries[0]
        teacher_name = sample_entry.get("teacherName", "")
            
        # If not available, try to get from teacher_data
        if not teacher_name:
            teacher_info = teachers_data.get(teacher_id, {}) if teachers_data else {}
            teacher_name = teacher_info.get("fullName", "")
            
            # If still not available, try to construct from first/last name
            if not teacher_name:
                first_name = teacher_info.get("firstName", "")
                last_name = teacher_info.get("lastName", "")
                if first_name and last_name:
                    teacher_name = f"{last_name} {first_name}"
                else:
                    teacher_name = f"Teacher_{teacher_id}"
        
        # Prepare filename
        safe_name = teacher_name.replace(" ", "_").replace("/", "_").replace("\\", "_")
        filename = os.path.join(output_dir, f"teacher_{teacher_id}_{safe_name}.csv")
        
        # Sort entries by week, date, day of week and slot
        entries.sort(key=lambda e: (
            e.get("weekNumber", 0),
            e.get("sessionDate", ""), 
            ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].index(e.get("dayOfWeek", "")) if e.get("dayOfWeek", "") in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] else 99,
            e.get("startTime", "")
        ))
        
        # Write to CSV
        with open(filename, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header
            writer.writerow([
                "Tuần", 
                "Ngày", 
                "Thứ", 
                "Tiết", 
                "Lớp", 
                "Môn học", 
                "Phòng"
            ])
            
            # Write entries
            for entry in entries:
                # Get class name, prioritizing the pre-computed value
                class_name = entry.get("className", "")
                
                # If not available, try to get from class_data
                if not class_name:
                    class_id = str(entry.get("classId", ""))
                    class_info = classes_data.get(class_id, {}) if classes_data else {}
                    class_name = class_info.get("className", "")
                    if not class_name:
                        class_name = class_info.get("name", f"Lớp {class_id}")
                
                # Get subject name, prioritizing the pre-computed value
                subject_name = entry.get("subjectName", "")
                
                # If not available, try to get from subject_data
                if not subject_name:
                    subject_id = str(entry.get("subjectId", ""))
                    subject_info = subjects_data.get(subject_id, {}) if subjects_data else {}
                    subject_name = subject_info.get("subjectName", "")
                    if not subject_name:
                        subject_name = subject_info.get("name", f"Môn học {subject_id}")
                
                # Get room name, prioritizing the pre-computed value
                room_name = entry.get("roomName", "")
                if not room_name and entry.get("classroomId"):
                    room_name = f"Phòng {entry.get('classroomId')}"
                
                # Map day of week to Vietnamese
                day_map = {
                    "Monday": "Thứ Hai",
                    "Tuesday": "Thứ Ba",
                    "Wednesday": "Thứ Tư", 
                    "Thursday": "Thứ Năm",
                    "Friday": "Thứ Sáu",
                    "Saturday": "Thứ Bảy",
                    "Sunday": "Chủ Nhật"
                }
                day_of_week = day_map.get(entry.get("dayOfWeek", ""), entry.get("dayOfWeek", ""))
                
                # Format week number
                week_number = entry.get("weekNumber", "")
                week_display = f"Tuần {week_number}" if week_number else ""
                
                # Format time slot
                start_time = entry.get("startTime", "")
                end_time = entry.get("endTime", "")
                time_slot = f"{start_time} - {end_time}" if start_time and end_time else ""
                
                # Write row
                writer.writerow([
                    week_display,
                    format_date(entry.get("sessionDate")),
                    day_of_week,
                    time_slot,
                    truncate(class_name),
                    truncate(subject_name),
                    truncate(room_name)
                ])
        
        teacher_count += 1
        print(f"Exported schedule for teacher: {teacher_name} ({len(entries)} entries)")
    
    # Write class schedules
    class_count = 0
    for class_id, entries in class_schedules.items():
        # Skip if no entries
        if not entries:
            continue
            
        # Get class name, prioritizing the pre-computed value
        sample_entry = entries[0]
        class_name = sample_entry.get("className", "")
        
        # If not available, try to get from class_data
        if not class_name:
            class_info = classes_data.get(class_id, {}) if classes_data else {}
            class_name = class_info.get("className", "")
            if not class_name:
                class_name = class_info.get("name", f"Lớp {class_id}")
        
        # Prepare filename
        safe_name = class_name.replace(" ", "_").replace("/", "_").replace("\\", "_")
        filename = os.path.join(output_dir, f"class_{class_id}_{safe_name}.csv")
        
        # Sort entries by week, date, day of week and slot
        entries.sort(key=lambda e: (
            e.get("weekNumber", 0),
            e.get("sessionDate", ""), 
            ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].index(e.get("dayOfWeek", "")) if e.get("dayOfWeek", "") in ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] else 99,
            e.get("startTime", "")
        ))
        
        # Write to CSV
        with open(filename, "w", newline="", encoding="utf-8") as csvfile:
            writer = csv.writer(csvfile)
            
            # Write header
            writer.writerow([
                "Tuần", 
                "Ngày", 
                "Thứ", 
                "Tiết", 
                "Giáo viên", 
                "Môn học", 
                "Phòng"
            ])
            
            # Write entries
            for entry in entries:
                # Get teacher name, prioritizing the pre-computed value
                teacher_name = entry.get("teacherName", "")
                
                # If not available, try to get from teacher_data
                if not teacher_name:
                    teacher_id = str(entry.get("teacherId", ""))
                    teacher_info = teachers_data.get(teacher_id, {}) if teachers_data else {}
                    teacher_name = teacher_info.get("fullName", "")
                    
                    # If still not available, try to construct from first/last name
                    if not teacher_name:
                        first_name = teacher_info.get("firstName", "")
                        last_name = teacher_info.get("lastName", "")
                        if first_name and last_name:
                            teacher_name = f"{last_name} {first_name}"
                        else:
                            teacher_name = f"Teacher_{teacher_id}"
                
                # Get subject name, prioritizing the pre-computed value
                subject_name = entry.get("subjectName", "")
                
                # If not available, try to get from subject_data
                if not subject_name:
                    subject_id = str(entry.get("subjectId", ""))
                    subject_info = subjects_data.get(subject_id, {}) if subjects_data else {}
                    subject_name = subject_info.get("subjectName", "")
                    if not subject_name:
                        subject_name = subject_info.get("name", f"Môn học {subject_id}")
                
                # Get room name, prioritizing the pre-computed value
                room_name = entry.get("roomName", "")
                if not room_name and entry.get("classroomId"):
                    room_name = f"Phòng {entry.get('classroomId')}"
                
                # Map day of week to Vietnamese
                day_map = {
                    "Monday": "Thứ Hai",
                    "Tuesday": "Thứ Ba",
                    "Wednesday": "Thứ Tư", 
                    "Thursday": "Thứ Năm",
                    "Friday": "Thứ Sáu",
                    "Saturday": "Thứ Bảy",
                    "Sunday": "Chủ Nhật"
                }
                day_of_week = day_map.get(entry.get("dayOfWeek", ""), entry.get("dayOfWeek", ""))
                
                # Format week number
                week_number = entry.get("weekNumber", "")
                week_display = f"Tuần {week_number}" if week_number else ""
                
                # Format time slot
                start_time = entry.get("startTime", "")
                end_time = entry.get("endTime", "")
                time_slot = f"{start_time} - {end_time}" if start_time and end_time else ""
                
                # Write row
                writer.writerow([
                    week_display,
                    format_date(entry.get("sessionDate")),
                    day_of_week,
                    time_slot,
                    truncate(teacher_name),
                    truncate(subject_name),
                    truncate(room_name)
                ])
        
        class_count += 1
        print(f"Exported schedule for class: {class_name} ({len(entries)} entries)")
    
    print(f"Exported schedules for {teacher_count} teachers and {class_count} classes to {output_dir}")
    return teacher_count, class_count


def format_date(date_obj):
    """Format date to DD/MM/YYYY"""
    if not date_obj:
        return ""
    if isinstance(date_obj, str):
        return date_obj
    return date_obj.strftime("%d/%m/%Y")


def write_class_schedule(csvfile, entries, db):
    """Write class schedule to CSV file"""
    writer = csv.writer(csvfile)
    writer.writerow([
        'Tuần', 'Ngày', 'Thứ', 'Tiết', 'Giáo viên', 'Môn học', 'Phòng'
    ])
    
    # Sort entries by week, day, time
    entries.sort(key=lambda e: (
        e.get('weekNumber', 0),
        e.get('dayNumber', 0),
        e.get('startTime', '')
    ))
    
    for entry in entries:
        # Map day of week to Vietnamese
        day_map = {
            "Monday": "Thứ Hai",
            "Tuesday": "Thứ Ba",
            "Wednesday": "Thứ Tư", 
            "Thursday": "Thứ Năm",
            "Friday": "Thứ Sáu",
            "Saturday": "Thứ Bảy",
            "Sunday": "Chủ Nhật"
        }
        
        day_of_week = day_map.get(entry.get('dayOfWeek', ''), entry.get('dayOfWeek', ''))
        time_slot = f"{entry.get('startTime', '')} - {entry.get('endTime', '')}"
        
        # Get teacher name
        teacher_name = ""
        teacher_info = db.Teacher.find_one({"teacherId": entry.get('teacherId')})
        if teacher_info:
            first_name = teacher_info.get('firstName', '')
            last_name = teacher_info.get('lastName', '')
            teacher_name = f"{first_name} {last_name}".strip()
            
        # Get subject name
        subject_name = ""
        subject_info = db.Subject.find_one({"subjectId": entry.get('subjectId')})
        if subject_info:
            subject_name = subject_info.get('subjectName', '')
        
        writer.writerow([
            entry.get('sessionWeek', f"Tuần {entry.get('weekNumber', '')}"),
            format_date(entry.get('sessionDate')),
            day_of_week,
            time_slot,
            teacher_name,
            subject_name,
            entry.get('roomName', '')
        ])


def write_teacher_schedule(csvfile, entries, db):
    """Write teacher schedule to CSV file"""
    writer = csv.writer(csvfile)
    writer.writerow([
        'Tuần', 'Ngày', 'Thứ', 'Tiết', 'Lớp', 'Môn học', 'Phòng'
    ])
    
    # Sort entries by week, day, time
    entries.sort(key=lambda e: (
        e.get('weekNumber', 0),
        e.get('dayNumber', 0),
        e.get('startTime', '')
    ))
    
    for entry in entries:
        # Map day of week to Vietnamese
        day_map = {
            "Monday": "Thứ Hai",
            "Tuesday": "Thứ Ba",
            "Wednesday": "Thứ Tư", 
            "Thursday": "Thứ Năm",
            "Friday": "Thứ Sáu",
            "Saturday": "Thứ Bảy",
            "Sunday": "Chủ Nhật"
        }
        
        day_of_week = day_map.get(entry.get('dayOfWeek', ''), entry.get('dayOfWeek', ''))
        time_slot = f"{entry.get('startTime', '')} - {entry.get('endTime', '')}"
        
        # Get class name
        class_name = ""
        class_info = db.Class.find_one({"classId": entry.get('classId')})
        if class_info:
            class_name = class_info.get('className', '')
            
        # Get subject name
        subject_name = ""
        subject_info = db.Subject.find_one({"subjectId": entry.get('subjectId')})
        if subject_info:
            subject_name = subject_info.get('subjectName', '')
        
        writer.writerow([
            entry.get('sessionWeek', f"Tuần {entry.get('weekNumber', '')}"),
            format_date(entry.get('sessionDate')),
            day_of_week,
            time_slot,
            class_name,
            subject_name,
            entry.get('roomName', '')
        ])


def export_semester_schedules(db, semester, output_dir="src/data/schedules"):
    """
    Export all schedules for a semester to CSV files
    - Export by class
    - Export by teacher
    """
    print(f"[EXPORT] Exporting schedules for semester {semester.get('semesterName', 'Unknown')}...")
    print(f"[INFO] Exporting schedules for semester {semester.get('semesterName', 'Unknown')} (ID: {semester.get('semesterId', None)})")
    
    # Create output directory if it doesn't exist
    try:
        os.makedirs(output_dir, exist_ok=True)
    except PermissionError:
        print(f"[WARNING] Permission denied when creating directory {output_dir}. Using /tmp/schedules instead.")
        output_dir = "/tmp/schedules"
        os.makedirs(output_dir, exist_ok=True)
    
    # Get all schedule entries for this semester
    schedule_entries = list(db.ClassSchedule.find({
        "semesterId": semester.get("semesterId"),
        "isActive": True
    }))
    print(f"[INFO] Found {len(schedule_entries)} schedule entries")
    
    # Group by class
    class_schedules = {}
    for entry in schedule_entries:
        class_id = entry.get("classId")
        if class_id not in class_schedules:
            class_schedules[class_id] = []
        class_schedules[class_id].append(entry)
    
    # Group by teacher
    teacher_schedules = {}
    for entry in schedule_entries:
        teacher_id = entry.get("teacherId")
        if teacher_id not in teacher_schedules:
            teacher_schedules[teacher_id] = []
        teacher_schedules[teacher_id].append(entry)
    
    # Count of exported files
    exported_teacher_count = 0
    exported_class_count = 0
    
    # Export each class schedule
    for class_id, entries in class_schedules.items():
        class_info = db.Class.find_one({"classId": class_id})
        filename = f"{output_dir}/class_{class_id}_{class_info.get('className', '')}.csv"
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                # Write class schedule
                write_class_schedule(csvfile, entries, db)
            print(f"[INFO] Exported class schedule to {filename}")
            exported_class_count += 1
        except PermissionError as e:
            # Try alternative directory if permission denied
            alt_filename = f"/tmp/class_{class_id}_{class_info.get('className', '')}.csv"
            try:
                with open(alt_filename, 'w', newline='', encoding='utf-8') as csvfile:
                    write_class_schedule(csvfile, entries, db)
                print(f"[INFO] Exported class schedule to alternative location: {alt_filename}")
                exported_class_count += 1
            except Exception as e2:
                print(f"[ERROR] Failed to export class schedule to alternative location: {str(e2)}")
        except Exception as e:
            print(f"[ERROR] Failed to export class schedule to {filename}: {str(e)}")
    
    # Export each teacher schedule
    for teacher_id, entries in teacher_schedules.items():
        teacher_info = db.Teacher.find_one({"teacherId": teacher_id})
        if teacher_info:
            first_name = teacher_info.get('firstName', '')
            last_name = teacher_info.get('lastName', '')
            filename = f"{output_dir}/teacher_{teacher_id}_{first_name}_{last_name}.csv"
            try:
                with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
                    # Write teacher schedule
                    write_teacher_schedule(csvfile, entries, db)
                print(f"[INFO] Exported teacher schedule to {filename}")
                exported_teacher_count += 1
            except PermissionError as e:
                # Try alternative directory if permission denied
                alt_filename = f"/tmp/teacher_{teacher_id}_{first_name}_{last_name}.csv"
                try:
                    with open(alt_filename, 'w', newline='', encoding='utf-8') as csvfile:
                        write_teacher_schedule(csvfile, entries, db)
                    print(f"[INFO] Exported teacher schedule to alternative location: {alt_filename}")
                    exported_teacher_count += 1
                except Exception as e2:
                    print(f"[ERROR] Failed to export teacher schedule to alternative location: {str(e2)}")
            except Exception as e:
                print(f"[ERROR] Failed to export teacher schedule to {filename}: {str(e)}")
        else:
            print(f"[WARNING] Teacher information not found for ID: {teacher_id}")
    
    return exported_teacher_count, exported_class_count


def export_all_schedules(db, output_base_dir="exports"):
    """
    Export all schedules for all semesters
    
    Args:
        db: MongoDB database connection
        output_base_dir: Base output directory
        
    Returns:
        tuple: (total_teachers, total_classes)
    """
    print("[INFO] Exporting all schedules...")
    
    # Create output directory
    try:
        if not os.path.exists(output_base_dir):
            os.makedirs(output_base_dir)
    except PermissionError:
        print(f"[WARNING] Permission denied when creating directory {output_base_dir}. Using /tmp/schedules instead.")
        output_base_dir = "/tmp/schedules"
        os.makedirs(output_base_dir, exist_ok=True)
    
    # Get batch info with aggregation
    batch_pipeline = [
        {
            '$lookup': {
                'from': 'Batch',
                'localField': 'batchId',
                'foreignField': 'batchId',
                'as': 'batch'
            }
        },
        {
            '$project': {
                'semesterName': 1,
                'batchId': 1,
                'startDate': 1,
                'endDate': 1,
                'curriculumId': 1,
                'batch': {'$arrayElemAt': ['$batch', 0]}
            }
        }
    ]
    
    semesters = list(db.Semester.aggregate(batch_pipeline))
    print(f"[INFO] Found {len(semesters)} semesters")
    
    total_teachers = 0
    total_classes = 0
    
    # Process each semester
    for semester in semesters:
        semester_name = semester.get('semesterName', 'Unknown')
        batch_id = semester.get('batchId')
        batch_name = semester.get('batch', {}).get('batchName') or f'Batch_{batch_id}'
        
        # Create organized output directory
        try:
            semester_dir = os.path.join(output_base_dir, f"{batch_name}_{semester_name}")
            os.makedirs(semester_dir, exist_ok=True)
        except PermissionError:
            print(f"[WARNING] Permission denied for directory {semester_dir}. Using alternative.")
            semester_dir = os.path.join("/tmp/schedules", f"{batch_name}_{semester_name}")
            os.makedirs(semester_dir, exist_ok=True)
        
        # Export schedules for this semester
        teacher_count, class_count = export_semester_schedules(db, semester, semester_dir)
        
        total_teachers += teacher_count
        total_classes += class_count
    
    print(f"\n[COMPLETED] Exported schedules for {total_teachers} teachers and {total_classes} classes")
    return total_teachers, total_classes


# Command-line interface
if __name__ == "__main__":
    import sys
    sys.path.append('.')  # Add current directory to path
    
    from .db import connect_to_mongodb
    
    print("[INFO] Connecting to MongoDB...")
    client = connect_to_mongodb()
    db = client["fams"]
    
    export_all_schedules(db)
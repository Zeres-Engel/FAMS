"""
Data loader utilities for FAMS
This module handles loading data from CSV files into MongoDB
"""
import os
import csv
import random
from typing import List, Dict, Any
from datetime import datetime, timedelta
from .models.Subject import Subject
from .models.Curriculum import Curriculum
from .models.CurriculumSubject import CurriculumSubject
from .models.ScheduleFormat import ScheduleFormat
from .models.Classroom import Classroom
from .models.Teacher import Teacher
from .models.Parent import Parent
from .constants import COLLECTIONS


class DataLoader:
    """
    Data loader class for FAMS
    Handles loading data from CSV files into MongoDB
    """
    
    def __init__(self, db, data_dir="src/data"):
        """Initialize data loader"""
        self.db = db
        self.data_dir = data_dir
        # Create data directory if it doesn't exist
        os.makedirs(self.data_dir, exist_ok=True)
        
    def _get_file_path(self, file_name):
        """Get full file path for a file in the data directory"""
        return os.path.join(self.data_dir, file_name)
        
    def load_subjects(self) -> List[Dict[str, Any]]:
        """Extract subjects from curriculum files"""
        print("Extracting subjects from curriculum files")
        all_subjects = {}
        subjects = []
        
        # Chỉ trích xuất từ curriculum files
        for grade in [10, 11, 12]:
            curriculum_file = self._get_file_path(f"curriculum_{grade}.csv")
            if os.path.exists(curriculum_file):
                print(f"Processing curriculum file for grade {grade}")
                with open(curriculum_file, "r", encoding="utf-8") as f:
                    # Đọc dòng tiêu đề và xóa khoảng trắng
                    header_line = f.readline().strip()
                    headers = [h.strip() for h in header_line.split(',')]
                    
                    # Đọc nội dung file
                    for line in f:
                        line = line.strip()
                        if not line:  # bỏ qua dòng trống
                            continue
                            
                        # Phân tích dòng thành các trường
                        values = line.split(',')
                        # Đảm bảo số lượng giá trị trùng với số lượng tiêu đề
                        if len(values) < len(headers):
                            values.extend([''] * (len(headers) - len(values)))
                        
                        # Tạo dict từ headers và values
                        row = {}
                        for i, header in enumerate(headers):
                            if i < len(values):
                                row[header] = values[i].strip()
                            else:
                                row[header] = ""
                        
                        subject_name = row.get("SubjectName", "").strip()
                        if subject_name and subject_name not in all_subjects:
                            all_subjects[subject_name] = row
        
        # Create subject objects
        for i, (subject_name, row) in enumerate(all_subjects.items()):
            # Trích xuất thông tin môn học từ dòng trong file curriculum
            try:
                sessions = int(row.get("Sessions", "1").strip())
            except ValueError:
                sessions = 1
                
            # Map type values if necessary
            type_value = row.get("Type", "").strip()
            # Map Vietnamese display names to enum values
            type_mapping = {
                "Môn học chính": "Chinh",
                "Tự chọn": "TuChon",
                "Ngoại khóa": "NgoaiKhoa",
                "": "Chinh"  # Default value
            }
            # Use the mapping or the original value, defaulting to "Chinh" if not matched
            subject_type = type_mapping.get(type_value, type_value or "Chinh")
            
            subject = Subject(
                subjectId=str(i + 1),
                subjectName=subject_name,
                description=row.get("Description", "").strip(),
                subjectType=subject_type
            )
            subjects.append(subject.dict(exclude={"collection"}))
    
        # Insert subjects to database
        if subjects:
            # Clear existing subjects
            self.db.Subject.delete_many({})
            self.db.Subject.insert_many(subjects)
            print(f"Imported {len(subjects)} subjects")
        else:
            print("WARNING: No subjects found in curriculum files!")
            
        return subjects
        
    def load_classrooms(self) -> List[Dict[str, Any]]:
        """Load classrooms from CSV file"""
        room_path = self._get_file_path("room.csv")
        classrooms = []
        
        # Nếu file tồn tại, thử đọc từ file
        if os.path.exists(room_path):
            try:
                with open(room_path, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    custom_classrooms = []
                    for i, row in enumerate(reader):
                        building = row.get("building", "").strip()
                        room_number = row.get("room", "").strip()
                        room_name = f"{room_number}{building}"
                        
                        classroom = {
                            "classroomId": i + 1,
                            "classroomName": f"Room {room_number}, Building {building}",
                            "roomNumber": room_number,
                            "building": building,
                            "roomName": room_name,
                            "capacity": int(row.get("capacity", 30)),
                            "location": f"Building {building}"
                        }
                        custom_classrooms.append(classroom)
                        
                    if custom_classrooms:
                        classrooms = custom_classrooms
                        print(f"Loaded {len(classrooms)} classrooms from file")
            except Exception as e:
                print(f"Error loading classrooms from file: {e}")
                print("Using default classrooms instead")
                
        # Tạo classroom mặc định nếu không có dữ liệu từ file
        if not classrooms:
            print("Creating default classrooms")
            for i in range(1, 11):
                building = chr(65 + (i-1) % 3)  # A, B, C
                room_number = f"{100 + ((i-1) // 3) * 10 + (i-1) % 3 + 1}"
                room_name = f"{room_number}{building}"
                
                classroom = {
                    "classroomId": i,
                    "classroomName": f"Room {room_number}, Building {building}",
                    "roomNumber": room_number,
                    "building": building,
                    "roomName": room_name,
                    "capacity": 40,
                    "location": f"Building {building}"
                }
                classrooms.append(classroom)
                
        # Insert classrooms to database
        if classrooms:
            # Clear existing classrooms
            self.db.Classroom.delete_many({})
            self.db.Classroom.insert_many(classrooms)
            print(f"Imported {len(classrooms)} classrooms")
            
        return classrooms
        
    def load_slots(self) -> List[Dict[str, Any]]:
        """Load time slots from CSV file"""
        slot_path = self._get_file_path("scheduleformat.csv")
        slots = []
        
        if os.path.exists(slot_path):
            try:
                with open(slot_path, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for i, row in enumerate(reader):
                        # Xử lý trường hợp CSV chưa có DayOfWeek
                        day_of_week = row.get("DayOfWeek", "")
                        if not day_of_week:
                            # Nếu không có DayOfWeek, sử dụng giá trị mặc định dựa vào SlotNumber
                            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
                            slot_number = int(row.get("SlotNumber", 1))
                            day_index = (slot_number - 1) // 10  # 10 slots per day
                            if day_index < len(days):
                                day_of_week = days[day_index]
                            else:
                                day_of_week = "Monday"
                        
                        slot = {
                            "slotId": i + 1,
                            "slotName": f"Slot {row.get('SlotNumber', i+1)}",
                            "slotNumber": int(row.get("SlotNumber", i+1)),
                            "dayOfWeek": day_of_week,
                            "startTime": row.get("StartTime", "08:00"),
                            "endTime": row.get("EndTime", "09:00"),
                            "isActive": True
                        }
                        slots.append(slot)
                print(f"Loaded {len(slots)} slots from file")
            except Exception as e:
                print(f"Error loading slots from file: {e}")
                print("Using default slots instead")
        
        # Create default slots if no slots were loaded
        if not slots:
            print("Creating default slots")
            days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
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
            
            slot_id = 1
            for day in days:
                for period_num, period_time in periods.items():
                    slot = {
                        "slotId": slot_id,
                        "slotName": f"{day} Slot {period_num}",
                        "slotNumber": period_num,
                        "dayOfWeek": day,
                        "startTime": period_time["start"],
                        "endTime": period_time["end"],
                        "isActive": True
                    }
                    slots.append(slot)
                    slot_id += 1
        
        # Insert slots to database
        if slots:
            # Clear existing slots
            self.db[COLLECTIONS['SCHEDULE_FORMAT']].delete_many({})
            self.db[COLLECTIONS['SCHEDULE_FORMAT']].insert_many(slots)
            print(f"Imported {len(slots)} time slots")
        else:
            print("WARNING: No slots found!")
            
        return slots
        
    def load_curriculum(self, grade: int) -> Dict[str, Any]:
        """Load curriculum for a grade"""
        curriculum_file = self._get_file_path(f"curriculum_{grade}.csv")
        
        # Check if curriculum file exists
        if not os.path.exists(curriculum_file):
            print(f"WARNING: Curriculum file for grade {grade} not found!")
            return None
        
        # Map grade to sequential curriculum ID
        grade_to_id = {10: 1, 11: 2, 12: 3}
        curriculum_id = grade_to_id.get(grade, 1)  # Default to 1 if grade not in map
            
        # Create curriculum record
        curriculum = Curriculum(
            curriculumId=curriculum_id,  # Use sequential ID
            curriculumName=f"Curriculum for Grade {grade}",
            grade=grade,
            description=f"Standard curriculum for grade {grade}"
        )
        
        # Get subjects from database
        all_subjects = list(self.db.Subject.find())
        subject_map = {subject["subjectName"]: subject for subject in all_subjects}
        
        # Load curriculum subjects
        curriculum_subjects = []
        curriculum_subject_id = 1
        
        print(f"DEBUG: Loading curriculum for grade {grade} from {curriculum_file}")
        print(f"DEBUG: Found {len(all_subjects)} subjects in database")
        for subj in all_subjects:
            print(f"  - {subj.get('subjectName')}")
        
        with open(curriculum_file, "r", encoding="utf-8") as f:
            # Đọc dòng tiêu đề và xóa khoảng trắng
            header_line = f.readline().strip()
            headers = [h.strip() for h in header_line.split(',')]
            
            # Đọc nội dung file
            for line in f:
                line = line.strip()
                if not line:  # bỏ qua dòng trống
                    continue
                    
                # Phân tích dòng thành các trường
                values = line.split(',')
                # Đảm bảo số lượng giá trị trùng với số lượng tiêu đề
                if len(values) < len(headers):
                    values.extend([''] * (len(headers) - len(values)))
                
                # Tạo dict từ headers và values
                row = {}
                for i, header in enumerate(headers):
                    if i < len(values):
                        row[header] = values[i].strip()
                    else:
                        row[header] = ""
                
                subject_name = row.get("SubjectName", "").strip()
                
                if not subject_name:
                    continue
                    
                # Find subject by name
                subject = subject_map.get(subject_name)
                
                if subject:
                    # Create curriculum subject
                    try:
                        sessions = int(row.get("Sessions", "2").strip())
                        print(f"DEBUG: Sessions for {subject['subjectName']}: {sessions}")
                    except ValueError:
                        sessions = 2
                        print(f"DEBUG: Error converting sessions for {subject['subjectName']}, using default: 2")
                        
                    curriculum_subject = CurriculumSubject(
                        curriculumId=curriculum.curriculumId,
                        subjectId=subject["subjectId"],
                        sessions=sessions
                    )
                    
                    curriculum_subjects.append(curriculum_subject.dict(exclude={"collection"}))
                    curriculum_subject_id += 1
                    print(f"DEBUG: Created curriculum subject: {subject['subjectName']} for curriculum {curriculum.curriculumId}")
        
        # Insert curriculum to database
        curriculum_dict = curriculum.dict(exclude={"collection"})
        
        # Remove existing curriculum
        self.db.Curriculum.delete_one({"curriculumId": curriculum.curriculumId})
        self.db.Curriculum.insert_one(curriculum_dict)
        
        # Insert curriculum subjects
        if curriculum_subjects:
            # Remove existing curriculum subjects
            self.db.CurriculumSubject.delete_many({"curriculumId": curriculum.curriculumId})
            self.db.CurriculumSubject.insert_many(curriculum_subjects)
            
        return {
            "curriculum": curriculum_dict,
            "subjects": curriculum_subjects
        }
        
    def load_all_curricula(self) -> List[Dict[str, Any]]:
        """Load curricula for all grades"""
        # Create collections if they don't exist
        if "Curriculum" not in self.db.list_collection_names():
            self.db.create_collection("Curriculum")
            
        if "CurriculumSubject" not in self.db.list_collection_names():
            self.db.create_collection("CurriculumSubject")
            
        # Load curricula for grades 10, 11, and 12
        curricula = []
        
        for grade in [10, 11, 12]:
            result = self.load_curriculum(grade)
            if result:
                curricula.append(result["curriculum"])
            
        return curricula 
"""
Curriculum and subject data generation for FAMS
"""
import csv
import datetime
import os
from ..utils import find_file_path
from ..models.Subject import Subject
from ..models.Curriculum import Curriculum
from ..models.CurriculumSubject import CurriculumSubject
from ..models.ScheduleFormat import ScheduleFormat
from ..constants import COLLECTIONS


def import_subjects(db):
    """Import subjects from CSV file"""
    subjects_data = []
    
    # First try to read from subject.csv
    subj_path = "src/data/subject.csv"
    
    if os.path.exists(subj_path):
        with open(subj_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=1):
                subject = Subject.from_csv(row, i)
                subjects_data.append(subject.dict(exclude={"collection"}))
    else:
        # If subject.csv not found, try to aggregate subjects from curriculum files
        print("[INFO] subject.csv not found, trying to extract from curriculum files")
        found_subjects = set()
        
        for grade in [10, 11, 12]:
            curriculum_path = f"src/data/curriculum_{grade}.csv"
            if os.path.exists(curriculum_path):
                with open(curriculum_path, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        subject_name = row["SubjectName"]
                        if subject_name not in found_subjects:
                            found_subjects.add(subject_name)
                            subject_id = len(subjects_data) + 1
                            subject = Subject.from_csv(row, subject_id)
                            subjects_data.append(subject.dict(exclude={"collection"}))
    
    if subjects_data:
        db.Subject.insert_many(subjects_data)
        print(f"[INIT] Imported {len(subjects_data)} subjects.")
    else:
        print("[WARNING] No subject data found or imported.")
        
    return subjects_data


def import_slot_format(db):
    """Import slot format from CSV file"""
    slot_csv = "src/data/scheduleformat.csv"
    slots = []
    
    if os.path.exists(slot_csv):
        with open(slot_csv, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader, start=1):
                slot = ScheduleFormat.from_csv_row(row, i)
                slots.append(slot.dict(exclude={"collection"}))
                
        if slots:
            db[COLLECTIONS['SCHEDULE_FORMAT']].insert_many(slots)
            print(f"[INIT] Imported {len(slots)} slots from scheduleformat.csv.")
    else:
        print("[WARNING] Schedule format data file not found.")
        
    return slots


def import_curriculum_data(db, grade):
    """Import curriculum data for a specific grade"""
    file_path = f'src/data/curriculum_{grade}.csv'
    
    if not os.path.exists(file_path):
        print(f"[Warning] Curriculum file for grade {grade} not found.")
        return None
    
    # Check if curriculum exists, if not create it
    curriculum_doc = db.Curriculum.find_one({"curriculumId": str(grade)})
    if not curriculum_doc:
        curriculum = Curriculum.from_grade(grade)
        curriculum_dict = curriculum.dict(exclude={"collection"})
        db.Curriculum.insert_one(curriculum_dict)
        curriculum_doc = db.Curriculum.find_one({"curriculumId": str(grade)})
    
    # Import subjects from curriculum file    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            subject_name = row["SubjectName"]
            sessions = int(row.get("Sessions", 2))
            
            # Find subject by name
            subj = db.Subject.find_one({"subjectName": subject_name})
            if not subj:
                print(f"[!] Subject '{subject_name}' not found in DB. Skipping.")
                continue
                
            subject_id = subj["subjectId"]
            existing = db.CurriculumSubject.find_one({
                "curriculumId": str(grade),
                "subjectId": subject_id
            })
            
            if existing:
                db.CurriculumSubject.update_one(
                    {"_id": existing["_id"]},
                    {"$set": {"sessions": sessions}}
                )
            else:
                curriculum_subject = CurriculumSubject.from_csv_row(
                    row, str(grade), subject_id, 
                    f"{grade}_{subject_id}"
                )
                db.CurriculumSubject.insert_one(
                    curriculum_subject.dict(exclude={"collection"})
                )
                
    return curriculum_doc


def setup_all_curriculums(db):
    """Setup curriculums for all grades"""
    if "Curriculum" not in db.list_collection_names():
        db.create_collection("Curriculum")
    if "CurriculumSubject" not in db.list_collection_names():
        db.create_collection("CurriculumSubject")
    
    curriculums = []
    for grade in [10, 11, 12]:
        curriculum = import_curriculum_data(db, grade)
        if curriculum:
            curriculums.append(curriculum)
            
    return curriculums


def generate_semesters(db):
    """Generate semesters for each batch"""
    semester_docs = []
    current_date = datetime.datetime.now()
    
    # Define batch-curriculum mappings
    bs_mapping = [
        {"batchId": 3, "curriculumId": 10, "endYear": 2026},
        {"batchId": 2, "curriculumId": 11, "endYear": 2025},
        {"batchId": 1, "curriculumId": 12, "endYear": 2024}
    ]
    
    # Create semester 1 and 2 for each batch/year
    for bs in bs_mapping:
        semester_list = []
        
        for idx, (s, e) in enumerate(semester_dates(bs["endYear"]), 1):
            sem_doc = {
                "semesterName": f"Học kỳ {idx}",
                "startDate": s,
                "endDate": e,
                "curriculumId": bs["curriculumId"],
                "batchId": bs["batchId"]
            }
            semester_list.append(sem_doc)
            sem = db.Semester.find_one({"semesterName": sem_doc["semesterName"], "batchId": bs["batchId"]})
            
            if not sem and current_date.year < bs['endYear']:
                db.Semester.insert_one(sem_doc)
            elif current_date.year >= bs['endYear']:
                print(f"[INFO] Batch {bs['batchId']} đã ra trường. Bỏ qua tạo thời khóa biểu.")
                
    return semester_docs 
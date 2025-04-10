"""
Curriculum and subject data generation for FAMS
"""
import csv
import datetime
import os
from src.utils import find_file_path
from src.models.curriculum import Subject, Curriculum, CurriculumSubject, Slot


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
                slot = Slot.from_csv_row(row, i)
                slots.append(slot.dict(exclude={"collection"}))
                
        if slots:
            db.Slot.insert_many(slots)
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
    
    batch_semester = [
        {"BatchID": 3, "CurriculumID": 10, "EndYear": 2026},
        {"BatchID": 2, "CurriculumID": 11, "EndYear": 2025},
        {"BatchID": 1, "CurriculumID": 12, "EndYear": 2024}
    ]
    
    for bs in batch_semester:
        graduation_date = datetime.datetime(bs["EndYear"] + 1, 6, 15)
        
        if current_date <= graduation_date:
            if current_date.month < 9:
                academic_year_start = current_date.year - 1
            else:
                academic_year_start = current_date.year
                
            sem1_start = datetime.datetime(academic_year_start, 9, 1)
            sem1_end = datetime.datetime(academic_year_start + 1, 1, 15)
            sem2_start = datetime.datetime(academic_year_start + 1, 2, 1)
            sem2_end = datetime.datetime(academic_year_start + 1, 6, 15)
            
            for idx, (s, e) in enumerate([(sem1_start, sem1_end), (sem2_start, sem2_end)], start=1):
                sem_doc = {
                    "SemesterName": f"Học kỳ {idx}",
                    "StartDate": s,
                    "EndDate": e,
                    "CurriculumID": bs["CurriculumID"],
                    "BatchID": bs["BatchID"]
                }
                
                db.Semester.insert_one(sem_doc)
                sem = db.Semester.find_one({"SemesterName": sem_doc["SemesterName"], "BatchID": bs["BatchID"]})
                semester_docs.append(sem)
        else:
            print(f"[INFO] Batch {bs['BatchID']} đã ra trường. Bỏ qua tạo thời khóa biểu.")
            
    return semester_docs 
"""
Schedule generation package for FAMS
"""
from .core import generate_improved_schedule, generate_schedule
from .generator import generate_all_schedules
from .export import export_schedule_to_csv, export_semester_schedules
from .attendance import generate_attendance_logs
try:
    from .subject_matching import match_teacher_to_subject, get_matching_teachers, normalize_text, SUBJECT_MAPPINGS
except ImportError:
    print("[WARNING] subject_matching module not found in schedule package") 
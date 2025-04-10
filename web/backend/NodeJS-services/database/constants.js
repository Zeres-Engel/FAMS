/**
 * Standardized MongoDB collection names for FAMS application
 * These constants should be used in all model files to ensure consistency
 * between JS and Python code
 */

const COLLECTIONS = {
  USER_ACCOUNT: 'UserAccount',
  STUDENT: 'Student',
  TEACHER: 'Teacher',
  PARENT: 'Parent',
  CLASS: 'Class',
  BATCH: 'Batch',
  SUBJECT: 'Subject',
  CLASSROOM: 'Classroom',
  SEMESTER: 'Semester',
  CURRICULUM: 'Curriculum',
  CURRICULUM_SUBJECT: 'CurriculumSubject',
  PARENT_STUDENT: 'ParentStudent',
  TEACHER_CLASS_ASSIGNMENT: 'TeacherClassAssignment',
  RFID: 'RFID',
  CLASS_SCHEDULE: 'ClassSchedule',
  SEMESTER_SCHEDULE: 'SemesterSchedule',
  ATTENDANCE_LOG: 'AttendanceLog',
  SLOT: 'Slot'
};

module.exports = { COLLECTIONS }; 
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
  RFID: 'RFID',
  CLASS_SCHEDULE: 'ClassSchedule',
  ATTENDANCE_LOG: 'AttendanceLog',
  SCHEDULE_FORMAT: 'ScheduleFormat',
  ANNOUNCEMENT: 'Announcement',
  NOTIFICATION: 'Notification',
  FACE_VECTOR: 'FaceVector',
  MODEL_VERSION: 'ModelVersion',
  DEVICE: 'Device',
  SLOT: 'ScheduleFormat'  // Legacy reference for compatibility
};

module.exports = { COLLECTIONS }; 
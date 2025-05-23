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
  DEVICE: 'Device'
};

// Field naming conventions - using camelCase for IDs
const FIELDS = {
  // ID fields
  USER_ID: 'userId',
  STUDENT_ID: 'studentId',
  TEACHER_ID: 'teacherId',
  PARENT_ID: 'parentId',
  CLASS_ID: 'classId',
  BATCH_ID: 'batchId',
  SUBJECT_ID: 'subjectId',
  CLASSROOM_ID: 'classroomId',
  SEMESTER_ID: 'semesterId',
  CURRICULUM_ID: 'curriculumId',
  RFID_ID: 'rfidId',
  SCHEDULE_ID: 'scheduleId',
  ATTENDANCE_ID: 'attendanceId',
  SLOT_ID: 'slotId',
  ANNOUNCEMENT_ID: 'announcementId',
  NOTIFICATION_ID: 'notificationId',
  FACE_VECTOR_ID: 'faceVectorId',
  MODEL_ID: 'modelId',
  DEVICE_ID: 'deviceId'
};

module.exports = { COLLECTIONS, FIELDS }; 
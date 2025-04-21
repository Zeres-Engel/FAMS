const mongoose = require('mongoose');

// Import all models
const UserAccount = require('./UserAccount');
const Teacher = require('./Teacher');
const Student = require('./Student');
const Parent = require('./Parent');
const Class = require('./Class');
const ParentStudent = require('./ParentStudent');
const ClassSchedule = require('./ClassSchedule');
const AttendanceLog = require('./AttendanceLog');
const Subject = require('./Subject');
const Classroom = require('./Classroom');
const ScheduleFormat = require('./ScheduleFormat');
const RFID = require('./RFID');
const Curriculum = require('./Curriculum');
const CurriculumSubject = require('./CurriculumSubject');
const Semester = require('./Semester');
const Batch = require('./Batch');
const Announcement = require('./Announcement');
const Notification = require('./Notification');
const FaceVector = require('./FaceVector');
const ModelVersion = require('./ModelVersion');
const Device = require('./Device');

// Export all models for easy importing
module.exports = {
  UserAccount,
  Teacher,
  Student,
  Parent,
  Class,
  ParentStudent,
  ClassSchedule,
  AttendanceLog,
  Subject,
  Classroom,
  ScheduleFormat,
  RFID,
  Curriculum,
  CurriculumSubject,
  Semester,
  Batch,
  Announcement,
  Notification,
  FaceVector,
  ModelVersion,
  Device,
  
  // Compatibility alias - User is an alias for UserAccount
  User: UserAccount
}; 
// Export all models from the models directory
const User = require('./User');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Parent = require('./Parent');
const Class = require('./Class');
const Batch = require('./Batch');
const Subject = require('./Subject');
const Classroom = require('./Classroom');
const ClassSchedule = require('./ClassSchedule');
const Semester = require('./Semester');
const Curriculum = require('./Curriculum');
const CurriculumSubject = require('./CurriculumSubject');
const ParentStudent = require('./ParentStudent');
const TeacherClassAssignment = require('./TeacherClassAssignment');
const RFID = require('./RFID');
const Slot = require('./Slot');
const AttendanceLog = require('./AttendanceLog');

module.exports = {
  User,
  Student,
  Teacher,
  Parent,
  Class,
  Batch,
  Subject,
  Classroom,
  ClassSchedule,
  Semester,
  Curriculum,
  CurriculumSubject,
  ParentStudent,
  TeacherClassAssignment,
  RFID,
  Slot,
  AttendanceLog
}; 
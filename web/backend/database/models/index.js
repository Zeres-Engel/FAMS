// Export tất cả các models từ thư mục models
const User = require('./User');
const Student = require('./Student');
const Teacher = require('./Teacher');
const Parent = require('./Parent');
const Class = require('./Class');
const Batch = require('./Batch');
const Subject = require('./Subject');
const Classroom = require('./Classroom');
const Schedule = require('./Schedule');
const Semester = require('./Semester');
const Curriculum = require('./Curriculum');

module.exports = {
  User,
  Student,
  Teacher,
  Parent,
  Class,
  Batch,
  Subject,
  Classroom,
  Schedule,
  Semester,
  Curriculum
}; 
const mongoose = require('mongoose');
const { COLLECTIONS } = require('../constants');

/**
 * Schema ClassSchedule - Quản lý thời khóa biểu cho các lớp học
 * 
 * Model này quản lý thông tin về các buổi học trong thời khóa biểu, bao gồm:
 * - Thông tin về lớp học, môn học, giáo viên, phòng học
 * - Thời gian (ngày, tuần, tiết học, giờ bắt đầu/kết thúc)
 * - Thông tin bổ sung về nội dung buổi học
 * 
 * Lưu ý: Model này được lưu trong collection 'ClassSchedule' chứ không phải 'Schedule'
 */
const ClassScheduleSchema = new mongoose.Schema({
  scheduleId: {
    type: Number,
    required: true,
    unique: true,
    description: 'ID duy nhất của buổi học trong thời khóa biểu'
  },
  semesterId: {
    type: mongoose.Schema.Types.Mixed,
    ref: 'Semester',
    required: true,
    description: 'ID của học kỳ liên quan đến buổi học'
  },
  classId: {
    type: Number,
    ref: 'Class',
    required: true,
    description: 'ID của lớp học tham gia buổi học'
  },
  subjectId: {
    type: Number,
    ref: 'Subject',
    description: 'ID của môn học được giảng dạy trong buổi học'
  },
  teacherId: {
    type: Number,
    ref: 'Teacher',
    description: 'ID của giáo viên dạy buổi học'
  },
  classroomId: {
    type: Number,
    ref: 'Classroom',
    description: 'ID của phòng học diễn ra buổi học'
  },
  WeekNumber: {
    type: Number,
    required: true,
    description: 'Số tuần trong học kỳ (tuần thứ mấy)'
  },
  DayNumber: {
    type: Number,
    required: true,
    description: 'Số thứ tự ngày trong tuần (1: Thứ Hai, 2: Thứ Ba, ...)'
  },
  SessionDate: {
    type: String,
    required: true,
    description: 'Ngày diễn ra buổi học, định dạng YYYY-MM-DD'
  },
  SlotID: {
    type: Number,
    required: true,
    description: 'Số tiết học trong ngày (tiết 1, tiết 2, ...)'
  },
  dayOfWeek: {
    type: String,
    required: true,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    description: 'Thứ trong tuần dưới dạng chữ (tiếng Anh)'
  },
  startTime: {
    type: String,
    required: true,
    description: 'Thời gian bắt đầu buổi học, định dạng HH:MM'
  },
  endTime: {
    type: String,
    required: true,
    description: 'Thời gian kết thúc buổi học, định dạng HH:MM'
  },
  Topic: {
    type: String,
    description: 'Chủ đề/nội dung của buổi học'
  },
  isFreeTime: {
    type: Boolean,
    default: false,
    description: 'Đánh dấu tiết trống (true) hoặc tiết có lịch học (false)'
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'rescheduled'],
    default: 'scheduled',
    description: 'Trạng thái của buổi học'
  },
  attendanceRecorded: {
    type: Boolean,
    default: false,
    description: 'Đánh dấu đã điểm danh cho buổi học chưa'
  },
  notes: {
    type: String,
    description: 'Ghi chú bổ sung về buổi học'
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true // Thêm createdAt và updatedAt
});

/**
 * Virtual field - Thông tin lớp học
 * Tự động tham chiếu đến document trong collection 'Class'
 */
ClassScheduleSchema.virtual('class', {
  ref: 'Class',
  localField: 'classId',
  foreignField: 'classId',
  justOne: true
});

/**
 * Virtual field - Thông tin môn học
 * Tự động tham chiếu đến document trong collection 'Subject'
 */
ClassScheduleSchema.virtual('subject', {
  ref: 'Subject',
  localField: 'subjectId',
  foreignField: 'subjectId',
  justOne: true
});

/**
 * Virtual field - Thông tin giáo viên
 * Tự động tham chiếu đến document trong collection 'Teacher'
 */
ClassScheduleSchema.virtual('teacher', {
  ref: 'Teacher',
  localField: 'teacherId',
  foreignField: 'teacherId',
  justOne: true
});

/**
 * Virtual field - Thông tin phòng học
 * Tự động tham chiếu đến document trong collection 'Classroom'
 */
ClassScheduleSchema.virtual('classroom', {
  ref: 'Classroom',
  localField: 'classroomId',
  foreignField: 'classroomId',
  justOne: true
});

/**
 * Virtual field - Thông tin học kỳ
 * Tự động tham chiếu đến document trong collection 'Semester'
 */
ClassScheduleSchema.virtual('semester', {
  ref: 'Semester',
  localField: 'semesterId',
  foreignField: 'semesterId',
  justOne: true
});

/**
 * Lưu ý quan trọng: 
 * - Sử dụng model này qua tên 'ClassSchedule' (không phải 'Schedule')
 * - Collection trong MongoDB là COLLECTIONS.CLASS_SCHEDULE ('ClassSchedule')
 * - Khi truy vấn cần đảm bảo đúng kiểu dữ liệu cho các trường như classId, teacherId, etc.
 */
module.exports = mongoose.model('ClassSchedule', ClassScheduleSchema, COLLECTIONS.CLASS_SCHEDULE); 
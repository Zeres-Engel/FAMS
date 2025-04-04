const express = require('express');
const multer = require('multer');
const { 
  getStudents, 
  getStudent, 
  createStudent, 
  updateStudent, 
  deleteStudent,
  importStudentsFromCSV,
  getStudentSchedule
} = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { models } = require('../database');

// Set up multer storage for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backend/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5000000 } // 5MB limit
});

const router = express.Router();

// CSV import route - admin only
router.post(
  '/import', 
  protect, 
  authorize('Admin'), 
  upload.single('file'), 
  importStudentsFromCSV
);

// Standard CRUD routes
router
  .route('/')
  .get(protect, getStudents)
  .post(protect, authorize('Admin'), createStudent);

router
  .route('/:id')
  .get(protect, getStudent)
  .put(protect, authorize('Admin'), updateStudent)
  .delete(protect, authorize('Admin'), deleteStudent);

// Add new route for student schedule
router.get('/:id/schedule', protect, getStudentSchedule);

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await models.Student.find().sort({ studentId: 1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get students by class ID
router.get('/class/:classId', async (req, res) => {
  try {
    const students = await models.Student.find({ classId: req.params.classId }).sort({ fullName: 1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student by ID with detailed profile
router.get('/:id', async (req, res) => {
  try {
    const student = await models.Student.findOne({ studentId: req.params.id });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    // Get user data
    const user = await models.User.findOne({ userId: student.userId });
    
    // Get class information
    const classInfo = await models.Class.findOne({ classId: student.classId });
    
    // Get batch information
    const batchInfo = await models.Batch.findOne({ batchId: student.batchId });
    
    // Get parents information
    const parents = await models.Parent.find({ 
      parentId: { $in: student.parentIds || [] } 
    });
    
    res.json({
      success: true,
      data: {
        ...student.toObject(),
        user: user ? {
          name: user.name,
          email: user.email,
          role: user.role
        } : null,
        class: classInfo || null,
        batch: batchInfo || null,
        parents: parents || []
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student's schedule
router.get('/:id/schedule', async (req, res) => {
  try {
    const student = await models.Student.findOne({ studentId: req.params.id });
    
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    
    // Get latest semester for student's batch
    const semester = await models.Semester.findOne({ 
      batchId: student.batchId 
    }).sort({ startDate: -1 });
    
    if (!semester) {
      return res.status(404).json({ 
        success: false, 
        error: 'No active semester found for this student' 
      });
    }
    
    // Get student's class schedule
    const schedules = await models.Schedule.find({ 
      semesterId: semester.semesterId,
      classId: student.classId
    }).sort({ dayOfWeek: 1, startTime: 1 });
    
    // Enhance schedule with teacher, subject and classroom information
    const enhancedSchedules = await Promise.all(schedules.map(async (schedule) => {
      const teacher = await models.Teacher.findOne({ teacherId: schedule.teacherId });
      const subject = await models.Subject.findOne({ subjectId: schedule.subjectId });
      const classroom = await models.Classroom.findOne({ classroomId: schedule.classroomId });
      
      return {
        ...schedule.toObject(),
        teacherName: teacher ? teacher.fullName : 'Unknown Teacher',
        subjectName: subject ? subject.name : 'Unknown Subject',
        classroomNumber: classroom ? classroom.roomNumber : 'Unknown Classroom'
      };
    }));
    
    res.json({
      success: true,
      count: enhancedSchedules.length,
      data: {
        semester: semester.semesterName,
        schedules: enhancedSchedules
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 
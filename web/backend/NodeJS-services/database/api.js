const express = require('express');
const router = express.Router();

// Import models
const {
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
} = require('./models');

// Import batch service
const batchService = require('./batchService');

// Get database info
router.get('/info', async (req, res) => {
  try {
    const { getDatabaseInfo } = require('./database');
    const info = await getDatabaseInfo();
    res.json(info);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all batches
router.get('/batches', async (req, res) => {
  try {
    const batches = await Batch.find().sort({ batchId: 1 });
    res.json({ success: true, count: batches.length, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get batch options based on current year
router.get('/batches/options', async (req, res) => {
  try {
    const currentYear = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const count = req.query.count ? parseInt(req.query.count) : 5;
    
    const result = await batchService.generateBatchOptions(currentYear, count);
    
    if (result.success) {
      res.json({ 
        success: true, 
        count: result.data.length, 
        currentYear,
        data: result.data 
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create batch if not exists
router.post('/batches/create-if-not-exists', async (req, res) => {
  try {
    const batchData = req.body;
    
    // Ensure we have either startDate or startYear
    if (!batchData.startDate && !batchData.startYear && !batchData.batchId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required batch fields: startDate, startYear, or batchId'
      });
    }
    
    // If startYear is provided but not startDate, generate startDate
    if (!batchData.startDate && batchData.startYear) {
      batchData.startDate = batchService.generateStartDate(parseInt(batchData.startYear));
    }
    
    // If endYear is provided but not endDate, generate endDate
    if (!batchData.endDate && batchData.endYear) {
      batchData.endDate = batchService.generateEndDate(parseInt(batchData.endYear));
    }
    
    // If we have a batchId but no dates, extract years from batchId and generate dates
    if (batchData.batchId && (!batchData.startDate || !batchData.endDate)) {
      const parts = batchData.batchId.split('-');
      if (parts.length === 2) {
        const startYear = parseInt(parts[0]);
        const endYear = parseInt(parts[1]);
        
        if (!batchData.startDate && !isNaN(startYear)) {
          batchData.startDate = batchService.generateStartDate(startYear);
        }
        
        if (!batchData.endDate && !isNaN(endYear)) {
          batchData.endDate = batchService.generateEndDate(endYear);
        }
      }
    }
    
    // Create the batch
    const result = await batchService.createBatchIfNotExists(batchData);
    
    if (result.success) {
      res.status(result.isNew ? 201 : 200).json({
        success: true,
        data: result.data,
        isNew: result.isNew
      });
    } else {
      res.status(500).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get batch by ID
router.get('/batches/:id', async (req, res) => {
  try {
    const batch = await Batch.findOne({ batchId: req.params.id });
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Batch not found' });
    }
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all classes
router.get('/classes', async (req, res) => {
  try {
    const classes = await Class.find().sort({ classId: 1 });
    res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get classes by batch ID
router.get('/classes/batch/:batchId', async (req, res) => {
  try {
    const classes = await Class.find({ batchId: req.params.batchId }).sort({ className: 1 });
    res.json({ success: true, count: classes.length, data: classes });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get class by ID
router.get('/classes/:id', async (req, res) => {
  try {
    const cls = await Class.findOne({ classId: req.params.id });
    if (!cls) {
      return res.status(404).json({ success: false, error: 'Class not found' });
    }
    res.json({ success: true, data: cls });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ studentId: 1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get students by class ID
router.get('/students/class/:classId', async (req, res) => {
  try {
    const students = await Student.find({ classId: req.params.classId }).sort({ fullName: 1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get student by ID
router.get('/students/:id', async (req, res) => {
  try {
    const student = await Student.findOne({ studentId: req.params.id });
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all teachers
router.get('/teachers', async (req, res) => {
  try {
    const teachers = await Teacher.find().sort({ teacherId: 1 });
    res.json({ success: true, count: teachers.length, data: teachers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get teacher by ID
router.get('/teachers/:id', async (req, res) => {
  try {
    const teacher = await Teacher.findOne({ teacherId: req.params.id });
    if (!teacher) {
      return res.status(404).json({ success: false, error: 'Teacher not found' });
    }
    res.json({ success: true, data: teacher });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all parents
router.get('/parents', async (req, res) => {
  try {
    const parents = await Parent.find().sort({ parentId: 1 });
    res.json({ success: true, count: parents.length, data: parents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get parent by ID
router.get('/parents/:id', async (req, res) => {
  try {
    const parent = await Parent.findOne({ parentId: req.params.id });
    if (!parent) {
      return res.status(404).json({ success: false, error: 'Parent not found' });
    }
    res.json({ success: true, data: parent });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get parents by student ID
router.get('/parents/student/:studentId', async (req, res) => {
  try {
    const parents = await Parent.find({ studentIds: req.params.studentId }).sort({ fullName: 1 });
    res.json({ success: true, count: parents.length, data: parents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all subjects
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await Subject.find().sort({ subjectId: 1 });
    res.json({ success: true, count: subjects.length, data: subjects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get subject by ID
router.get('/subjects/:id', async (req, res) => {
  try {
    const subject = await Subject.findOne({ subjectId: req.params.id });
    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }
    res.json({ success: true, data: subject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all classrooms
router.get('/classrooms', async (req, res) => {
  try {
    const classrooms = await Classroom.find().sort({ classroomId: 1 });
    res.json({ success: true, count: classrooms.length, data: classrooms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all schedules
router.get('/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ scheduleId: 1 });
    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schedules by semester ID
router.get('/schedules/semester/:semesterId', async (req, res) => {
  try {
    const schedules = await Schedule.find({ semesterId: req.params.semesterId }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schedules by class ID
router.get('/schedules/class/:classId', async (req, res) => {
  try {
    const schedules = await Schedule.find({ classId: req.params.classId }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get schedules by teacher ID
router.get('/schedules/teacher/:teacherId', async (req, res) => {
  try {
    const schedules = await Schedule.find({ teacherId: req.params.teacherId }).sort({ dayOfWeek: 1, startTime: 1 });
    res.json({ success: true, count: schedules.length, data: schedules });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all semesters
router.get('/semesters', async (req, res) => {
  try {
    const semesters = await Semester.find().sort({ semesterId: 1 });
    res.json({ success: true, count: semesters.length, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get semesters by batch ID
router.get('/semesters/batch/:batchId', async (req, res) => {
  try {
    const semesters = await Semester.find({ batchId: req.params.batchId }).sort({ startDate: 1 });
    res.json({ success: true, count: semesters.length, data: semesters });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get all curriculums
router.get('/curriculums', async (req, res) => {
  try {
    const curriculums = await Curriculum.find().sort({ curriculumId: 1 });
    res.json({ success: true, count: curriculums.length, data: curriculums });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get curriculum by ID
router.get('/curriculums/:id', async (req, res) => {
  try {
    const curriculum = await Curriculum.findOne({ curriculumId: req.params.id });
    if (!curriculum) {
      return res.status(404).json({ success: false, error: 'Curriculum not found' });
    }
    res.json({ success: true, data: curriculum });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get curriculum by batch ID
router.get('/curriculums/batch/:batchId', async (req, res) => {
  try {
    const curriculum = await Curriculum.findOne({ batchId: req.params.batchId });
    if (!curriculum) {
      return res.status(404).json({ success: false, error: 'Curriculum not found for this batch' });
    }
    res.json({ success: true, data: curriculum });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Reinitialize the database
router.post('/reinitialize', async (req, res) => {
  try {
    res.json({ 
      success: true, 
      message: 'Database reinitialization request received. Please run initialization script manually using: npm run init-db' 
    });
    
    // Không tự động chạy script khởi tạo nữa
    // require('./initDatabase');
    
    console.log('Database reinitialization was requested but script was not executed automatically.');
    console.log('To initialize database manually, run: npm run init-db');
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/admin/users/:type/basic
router.get('/users/:type/basic', async (req, res) => {
  try {
    const { type } = req.params;
    const limit = 5; // Chỉ lấy 5 bản ghi
    
    let data = [];
    
    if (type === 'student') {
      data = await Student.find().limit(limit).lean();
    } 
    else if (type === 'teacher') {
      data = await Teacher.find().limit(limit).lean();
    } 
    else if (type === 'parent') {
      data = await Parent.find().limit(limit).lean();
    } 
    else {
      return res.status(400).json({
        success: false,
        message: 'Invalid user type',
        data: []
      });
    }
    
    return res.json({
      success: true,
      count: data.length,
      data: data
    });
    
  } catch (error) {
    console.error(`Error fetching ${req.params.type} list:`, error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error',
      error: error.stack
    });
  }
});

module.exports = router; 
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Import các controller
const attendanceController = require('../controllers/attendanceController');
const curriculumController = require('../controllers/curriculumController');
const classroomController = require('../controllers/classroomController');
const subjectController = require('../controllers/subjectController');
const Subject = require('../models/subjectModel');

// Route quản lý điểm danh
router.get('/attendance/:sessionId', protect, attendanceController.getAttendanceBySession);
router.get('/attendance/student/:studentId', protect, attendanceController.getStudentAttendance);
router.get('/attendance/class/:classId/date/:date', protect, attendanceController.getClassAttendanceByDate);
router.post('/attendance/:sessionId', protect, authorize('Teacher', 'Admin'), attendanceController.recordAttendance);

// Route quản lý phòng học
router.get('/classrooms', protect, classroomController.getAllClassrooms);
router.get('/classrooms/:id', protect, classroomController.getClassroomById);
router.post('/classrooms', protect, authorize('Admin'), classroomController.createClassroom);
router.put('/classrooms/:id', protect, authorize('Admin'), classroomController.updateClassroom);
router.delete('/classrooms/:id', protect, authorize('Admin'), classroomController.deleteClassroom);

// Route quản lý chương trình học
router.get('/curriculum', protect, curriculumController.getAllCurricula);
router.get('/curriculum/:id', protect, curriculumController.getCurriculumById);
router.get('/curriculum/:id/subjects', protect, curriculumController.getCurriculumSubjects);
router.post('/curriculum', protect, authorize('Admin'), curriculumController.createCurriculum);
router.put('/curriculum/:id', protect, authorize('Admin'), curriculumController.updateCurriculum);
router.delete('/curriculum/:id', protect, authorize('Admin'), curriculumController.deleteCurriculum);

// Get all subjects for filter dropdown
router.get('/subjects/list', async (req, res) => {
  try {
    // Get all subjects to use for filtering teachers
    const subjects = await Subject.find().sort({ subjectName: 1 }).select('subjectId subjectName type');
    
    res.json({
      success: true,
      count: subjects.length,
      data: subjects
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Function to load subject options for teacher filter
async function loadSubjectOptions() {
    try {
        const response = await fetch('/api/database/subjects/list', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            // Update the filter options - use subjectName instead of name
            const subjectOptions = data.data.map(subject => ({
                value: subject.subjectName || subject.name, // Try both field names
                label: subject.subjectName || subject.name
            }));
            
            // Find the major filter in teacher filterOptions and update its options
            const majorFilterIndex = filterOptions.teacher.findIndex(f => f.field === 'major');
            if (majorFilterIndex !== -1) {
                filterOptions.teacher[majorFilterIndex].options = subjectOptions;
            }
            
            console.log('Loaded subject options for teacher filter:', subjectOptions);
            
            // If the teacher tab is active, update the filter dropdown
            if (currentUserType === 'teacher') {
                updateFilterOptions('teacher');
            }
        }
    } catch (error) {
        console.error('Error loading subject options:', error);
    }
}

module.exports = router; 
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');

// Import các controller
const attendanceController = require('../controllers/attendanceController');
const curriculumController = require('../controllers/curriculumController');
const classroomController = require('../controllers/classroomController');

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

module.exports = router; 
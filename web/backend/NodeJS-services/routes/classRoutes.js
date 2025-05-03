const express = require('express');
const router = express.Router();
const classController = require('../controllers/classController');
const { protect } = require('../middleware/authMiddleware');

// Routes for class management
// GET /api/classes - Get all classes
router.get('/', classController.getAllClasses);

// GET /api/classes/user/:userId - Get classes by userId (student or teacher)
router.get('/user/:userId', protect, classController.getClassesByUserId);

// GET /api/classes/:id/students - Get all students in a class
router.get('/:classId/students', protect, classController.getStudentsByClassId);

// GET /api/classes/:id - Get class by ID
router.get('/:id', protect, classController.getClassById);

// POST /api/classes - Create a new class
router.post('/', protect, classController.createClass);

// POST /api/classes/with-students - Create a new class and add students
router.post('/with-students', protect, classController.createClassWithStudents);

// POST /api/classes/:classId/students - Add students to an existing class
router.post('/:classId/students', protect, classController.addStudentsToClass);

// PUT /api/classes/:id - Update a class
router.put('/:id', protect, classController.updateClass);

// DELETE /api/classes/:id - Delete a class
router.delete('/:id', protect, classController.deleteClass);

module.exports = router; 
const express = require('express');
const router = express.Router();
const { getAllStudents, getStudentById, searchStudents } = require('../controllers/studentController');
const { protect } = require('../middleware/authMiddleware');

/**
 * @route   GET /api/student-info/search/query
 * @desc    Tìm kiếm sinh viên theo từ khóa
 * @access  Private
 */
router.get('/search/query', protect, searchStudents);

/**
 * @route   GET /api/student-info/:id
 * @desc    Lấy thông tin chi tiết sinh viên theo ID
 * @access  Private
 */
router.get('/:id', protect, getStudentById);

/**
 * @route   GET /api/student-info
 * @desc    Lấy danh sách tất cả sinh viên (có phân trang và lọc)
 * @access  Private
 */
router.get('/', protect, getAllStudents);

module.exports = router; 
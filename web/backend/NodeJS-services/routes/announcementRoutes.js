const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const announcementController = require('../controllers/announcementController');

// Lấy tất cả thông báo chung (accessible to all)
router.get('/', authenticateToken, announcementController.getAllAnnouncements);

// Lấy chi tiết một thông báo chung
router.get('/:id', authenticateToken, announcementController.getAnnouncementById);

// Tạo thông báo chung mới (chỉ admin hoặc giáo viên)
router.post('/', authenticateToken, authorizeRoles(['Admin', 'Teacher']), announcementController.createAnnouncement);

// Cập nhật thông báo chung
router.put('/:id', authenticateToken, authorizeRoles(['Admin', 'Teacher']), announcementController.updateAnnouncement);

// Xóa thông báo chung
router.delete('/:id', authenticateToken, authorizeRoles(['Admin']), announcementController.deleteAnnouncement);

// Gửi thông báo cho tất cả người dùng
router.post('/send-all', authenticateToken, authorizeRoles(['Admin']), announcementController.createAnnouncementForAllUsers);

// Gửi thông báo cho tất cả giáo viên
router.post('/send-teachers', authenticateToken, authorizeRoles(['Admin']), announcementController.createAnnouncementForTeachers);

// Gửi thông báo cho tất cả học sinh
router.post('/send-students', authenticateToken, authorizeRoles(['Admin', 'Teacher']), announcementController.createAnnouncementForStudents);

module.exports = router; 
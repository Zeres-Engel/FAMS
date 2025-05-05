const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Lấy tất cả thông báo của người dùng hiện tại
router.get('/my-notifications', authenticateToken, notificationController.getMyNotifications);

// Lấy chi tiết một thông báo
router.get('/:id', authenticateToken, notificationController.getNotificationById);

// Tạo thông báo mới (có thể giới hạn cho admin hoặc giáo viên)
router.post('/', authenticateToken, notificationController.createNotification);

// Đánh dấu thông báo đã đọc
router.patch('/:id/mark-as-read', authenticateToken, notificationController.markAsRead);

// Đánh dấu tất cả thông báo đã đọc
router.patch('/mark-all-as-read', authenticateToken, notificationController.markAllAsRead);

// Xóa thông báo
router.delete('/:id', authenticateToken, notificationController.deleteNotification);

// Gửi thông báo cho tất cả học sinh
router.post('/send-all-students', authenticateToken, authorizeRoles(['Admin', 'Teacher']), notificationController.sendNotificationToAllStudents);

// Gửi thông báo cho tất cả giáo viên
router.post('/send-all-teachers', authenticateToken, authorizeRoles(['Admin']), notificationController.sendNotificationToAllTeachers);

// Gửi thông báo cho tất cả admin
router.post('/send-all-admins', authenticateToken, authorizeRoles(['Admin']), notificationController.sendNotificationToAllAdmins);

// Gửi thông báo cho tất cả phụ huynh
router.post('/send-all-parents', authenticateToken, authorizeRoles(['Admin', 'Teacher']), notificationController.sendNotificationToAllParents);

// Gửi thông báo cho một userId cụ thể
router.post('/send-to-user', authenticateToken, authorizeRoles(['Admin', 'Teacher']), notificationController.sendNotificationToUser);

// Gửi thông báo cho tất cả học sinh của một lớp
router.post('/send-to-class', authenticateToken, authorizeRoles(['Admin', 'Teacher']), notificationController.sendNotificationToClassStudents);

module.exports = router; 
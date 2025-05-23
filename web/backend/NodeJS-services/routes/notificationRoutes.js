const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware bảo vệ tất cả các routes
router.use(authMiddleware.protect);

// Lấy tất cả thông báo của người dùng đăng nhập
router.get('/my-notifications', notificationController.getMyNotifications);

// Lấy thông báo đã gửi của người dùng
router.get('/sent-notifications', notificationController.getSentNotifications);

// API debug thông báo (đặt trước route có tham số)
router.get('/debug-notification/:id', notificationController.debugNotification);

// Lấy chi tiết một thông báo
router.get('/:id', notificationController.getNotificationById);

// API đơn giản hóa - gửi thông báo đến nhiều người dùng
router.post('/send-to-users', notificationController.sendNotificationToMultipleUsers);

// Gửi thông báo cho học sinh của một lớp cụ thể
router.post('/send-to-class', notificationController.sendNotificationToClassStudents);

// Gửi thông báo cho tất cả học sinh
router.post('/send-all-students', notificationController.sendNotificationToAllStudents);

// Gửi thông báo cho tất cả giáo viên
router.post('/send-all-teachers', notificationController.sendNotificationToAllTeachers);

// Gửi thông báo cho tất cả phụ huynh
router.post('/send-all-parents', notificationController.sendNotificationToAllParents);

// Gửi thông báo cho một người dùng cụ thể
router.post('/send-to-user', notificationController.sendNotificationToUser);

// Gửi thông báo cho tất cả người dùng
router.post('/send-all-users', notificationController.sendNotificationToAllUsers);

// Tạo thông báo mới (cho một người dùng - giữ lại cho khả năng tương thích)
router.post('/', notificationController.createNotification);

// Đánh dấu thông báo đã đọc
router.patch('/:id/mark-as-read', notificationController.markAsRead);

// Đánh dấu tất cả thông báo đã đọc
router.patch('/mark-all-as-read', notificationController.markAllAsRead);

// Lưu trữ và bỏ lưu trữ thông báo
router.patch('/:id/archive', notificationController.toggleArchiveNotification);

// Xóa thông báo
router.delete('/:id', notificationController.deleteNotification);

module.exports = router; 
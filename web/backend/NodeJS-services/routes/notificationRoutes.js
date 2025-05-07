const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware bảo vệ tất cả các routes
// Temporarily commented out to allow all roles to access
// router.use(authMiddleware.protect);

// Lấy tất cả thông báo của người dùng đăng nhập
router.get('/my-notifications', notificationController.getMyNotifications);

// Lấy chi tiết một thông báo
router.get('/:id', notificationController.getNotificationById);

// API đơn giản hóa - gửi thông báo đến nhiều người dùng
router.post('/send-to-users', notificationController.sendNotificationToMultipleUsers);

// Tạo thông báo mới (cho một người dùng - giữ lại cho khả năng tương thích)
router.post('/', notificationController.createNotification);

// Đánh dấu thông báo đã đọc
router.patch('/:id/mark-as-read', notificationController.markAsRead);

// Đánh dấu tất cả thông báo đã đọc
router.patch('/mark-all-as-read', notificationController.markAllAsRead);

// Xóa thông báo
router.delete('/:id', notificationController.deleteNotification);

module.exports = router; 
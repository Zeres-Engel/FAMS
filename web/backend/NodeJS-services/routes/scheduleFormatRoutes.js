const express = require('express');
const router = express.Router();
const scheduleFormatController = require('../controllers/scheduleFormatController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Route để lấy tất cả khung giờ học
router.get('/', protect, scheduleFormatController.getAllScheduleFormats);

// Route để lấy khung giờ học theo ngày trong tuần
router.get('/day/:dayOfWeek', protect, scheduleFormatController.getScheduleFormatsByDay);

// Route để lấy khung giờ học theo ID
router.get('/:id', protect, scheduleFormatController.getScheduleFormatById);

// Route để tạo khung giờ học mới (chỉ Admin)
router.post('/', protect, authorize('Admin'), scheduleFormatController.createScheduleFormat);

// Route để cập nhật khung giờ học (chỉ Admin)
router.put('/:id', protect, authorize('Admin'), scheduleFormatController.updateScheduleFormat);

// Route để thay đổi trạng thái active của slot (chỉ Admin)
router.patch('/:id/toggle-status', protect, authorize('Admin'), scheduleFormatController.toggleScheduleFormatStatus);

// Route để xóa khung giờ học (chỉ Admin)
router.delete('/:id', protect, authorize('Admin'), scheduleFormatController.deleteScheduleFormat);

module.exports = router; 
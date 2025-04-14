const express = require('express');
const { protect, authorize } = require('../middleware/authMiddleware');
const teacherService = require('../services/teacherService');
const { asyncHandler, sendResponse, sendError } = require('../utils/routeUtils');

const router = express.Router();

// Lấy danh sách tất cả giáo viên với phân trang và lọc
router.get('/', protect, asyncHandler(async (req, res) => {
  // Tách riêng các tham số đặc biệt
  const { page, limit, sortBy, sortDir, search, className, ...otherFilters } = req.query;
  
  // Build sort object
  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortDir === 'desc' ? -1 : 1;
  } else {
    sort.teacherId = 1; // Default sorting
  }
  
  // Cấu hình options với tất cả các tham số
  const options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    sort,
    filter: otherFilters, // Tất cả các tham số còn lại được xem là filter
    search,
    className
  };
  
  console.log("Teacher request query:", req.query);
  console.log("Teacher search options:", JSON.stringify(options, null, 2));
  
  const result = await teacherService.getTeachers(options);
  
  if (result.success) {
    return sendResponse(res, { 
      data: result.data, 
      count: result.count,
      pagination: result.pagination
    });
  }
  
  return sendError(res, { message: result.error });
}));

// Lấy thông tin chi tiết giáo viên
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const result = await teacherService.getTeacherById(req.params.id, true);
  
  if (result.success) {
    return sendResponse(res, { data: result.data });
  }
  
  return sendError(res, { 
    statusCode: result.code === 'TEACHER_NOT_FOUND' ? 404 : 500,
    message: result.error,
    code: result.code
  });
}));

// Lấy lịch dạy của giáo viên
router.get('/:id/schedule', protect, asyncHandler(async (req, res) => {
  const result = await teacherService.getTeacherSchedule(req.params.id);
  
  if (result.success) {
    return sendResponse(res, { 
      data: result.data,
      count: result.count 
    });
  }
  
  return sendError(res, { 
    statusCode: result.code === 'TEACHER_NOT_FOUND' || result.code === 'NO_ACTIVE_SEMESTER' ? 404 : 500,
    message: result.error,
    code: result.code
  });
}));

// Debug endpoint to check schedules for a teacher
router.get('/:id/debug-schedules', protect, asyncHandler(async (req, res) => {
  const result = await teacherService.checkTeacherSchedules(req.params.id);
  
  return sendResponse(res, { data: result.data });
}));

// Tạo giáo viên mới
router.post('/', protect, authorize('Admin'), asyncHandler(async (req, res) => {
  const result = await teacherService.createTeacher(req.body);
  
  if (result.success) {
    return sendResponse(res, { statusCode: 201, data: result.data });
  }
  
  return sendError(res, { message: result.error, code: result.code });
}));

// Cập nhật thông tin giáo viên
router.put('/:id', protect, authorize('Admin'), asyncHandler(async (req, res) => {
  const result = await teacherService.updateTeacher(req.params.id, req.body);
  
  if (result.success) {
    return sendResponse(res, { 
      data: result.data,
      deletedScheduleIds: result.deletedScheduleIds,
      message: result.message 
    });
  }
  
  return sendError(res, { 
    statusCode: result.code === 'UPDATE_FAILED' ? 404 : 500,
    message: result.error,
    code: result.code
  });
}));

// Xóa giáo viên
router.delete('/:id', protect, authorize('Admin'), asyncHandler(async (req, res) => {
  const result = await teacherService.deleteTeacher(req.params.id);
  
  if (result.success) {
    return sendResponse(res, { 
      message: result.message,
      teacherDeleted: result.teacherDeleted,
      deletedScheduleIds: result.deletedScheduleIds
    });
  }
  
  return sendError(res, { 
    statusCode: result.code === 'DELETE_FAILED' ? 404 : 500,
    message: result.error,
    code: result.code
  });
}));

module.exports = router; 
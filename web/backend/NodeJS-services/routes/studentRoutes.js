const express = require('express');
const multer = require('multer');
const { protect, authorize } = require('../middleware/authMiddleware');
const studentService = require('../services/studentService');
const { asyncHandler, sendResponse, sendError } = require('../utils/routeUtils');

// Set up multer storage for CSV uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'backend/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv') {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 5000000 } // 5MB limit
});

const router = express.Router();

// Lấy danh sách tất cả học sinh với phân trang và lọc
router.get('/', protect, asyncHandler(async (req, res) => {
  // Tách riêng các tham số đặc biệt
  const { page, limit, sortBy, sortDir, search, className, batchYear, ...otherFilters } = req.query;
  
  // Build sort object
  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortDir === 'desc' ? -1 : 1;
  } else {
    sort.studentId = 1; // Default sorting
  }
  
  // Cấu hình options với tất cả các tham số
  const options = {
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || 10,
    sort,
    filter: otherFilters, // Tất cả các tham số còn lại được xem là filter
    search,
    className,
    batchYear
  };
  
  console.log("Request query:", req.query);
  console.log("Search options:", JSON.stringify(options, null, 2));
  
  const result = await studentService.getStudents(options);
  
  if (result.success) {
    return sendResponse(res, { 
      data: result.data, 
      count: result.count,
      pagination: result.pagination
    });
  }
  
  return sendError(res, { message: result.error });
}));

// Lấy học sinh theo lớp
router.get('/class/:classId', protect, asyncHandler(async (req, res) => {
  const result = await studentService.getStudentsByClass(req.params.classId);
  
  if (result.success) {
    return sendResponse(res, { data: result.data, count: result.count });
  }
  
  return sendError(res, { message: result.error });
}));

// Lấy thông tin chi tiết học sinh
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const result = await studentService.getStudentById(req.params.id, true);
  
  if (result.success) {
    return sendResponse(res, { data: result.data });
  }
  
  return sendError(res, { 
    statusCode: result.code === 'STUDENT_NOT_FOUND' ? 404 : 500,
    message: result.error,
    code: result.code
  });
}));

// Lấy thời khóa biểu của học sinh
router.get('/:id/schedule', protect, asyncHandler(async (req, res) => {
  const result = await studentService.getStudentSchedule(req.params.id);
  
  if (result.success) {
    return sendResponse(res, { 
      data: result.data,
      count: result.count 
    });
  }
  
  return sendError(res, { 
    statusCode: result.code === 'STUDENT_NOT_FOUND' || result.code === 'NO_ACTIVE_SEMESTER' ? 404 : 500,
    message: result.error,
    code: result.code
  });
}));

// Tạo học sinh mới
router.post('/', protect, authorize('Admin'), asyncHandler(async (req, res) => {
  const result = await studentService.createStudent(req.body);
  
  if (result.success) {
    return sendResponse(res, { statusCode: 201, data: result.data });
  }
  
  return sendError(res, { message: result.error, code: result.code });
}));

// Cập nhật thông tin học sinh
router.put('/:id', protect, authorize('Admin'), asyncHandler(async (req, res) => {
  const result = await studentService.updateStudent(req.params.id, req.body);
  
  if (result.success) {
    return sendResponse(res, { data: result.data });
  }
  
  return sendError(res, { 
    statusCode: result.code === 'UPDATE_FAILED' ? 404 : 500,
    message: result.error,
    code: result.code
  });
}));

// Xóa học sinh
router.delete('/:id', protect, authorize('Admin'), asyncHandler(async (req, res) => {
  const result = await studentService.deleteStudent(req.params.id);
  
  if (result.success) {
    return sendResponse(res, { message: result.message });
  }
  
  return sendError(res, { 
    statusCode: result.code === 'DELETE_FAILED' ? 404 : 500,
    message: result.error,
    code: result.code
  });
}));

// Nhập học sinh từ file CSV
router.post('/import', protect, authorize('Admin'), upload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, { 
      statusCode: 400,
      message: 'No CSV file uploaded',
      code: 'FILE_MISSING'
    });
  }
  
  // Gọi controller importStudentsFromCSV ở đây
  // const result = await importStudentsFromCSV(req, res);
  // Giữ lại code cũ nếu cần
  
  return sendResponse(res, { 
    message: 'CSV import functionality is being reworked through the service layer.',
    success: false
  });
}));

module.exports = router; 
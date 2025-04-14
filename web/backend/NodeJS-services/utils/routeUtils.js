/**
 * Route Utils - Các hàm tiện ích để xử lý API routes
 */

/**
 * Hàm bọc async để xử lý lỗi cho các route handler
 * @param {Function} fn - Route handler function
 * @returns {Function} Express middleware với xử lý lỗi
 */
exports.asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Tạo response chuẩn hóa cho API
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {boolean} success - Trạng thái thành công
 * @param {Object|Array} data - Dữ liệu trả về
 * @param {string} message - Thông báo
 * @param {number} count - Số lượng items (nếu trả về mảng)
 */
exports.sendResponse = (res, { statusCode = 200, success = true, data = null, message = null, count = null }) => {
  const response = { success };
  
  if (message) response.message = message;
  if (count !== null) response.count = count;
  if (data !== null) response.data = data;
  
  return res.status(statusCode).json(response);
};

/**
 * Tạo response lỗi chuẩn hóa
 * @param {Response} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Thông báo lỗi
 * @param {string} code - Mã lỗi
 */
exports.sendError = (res, { statusCode = 500, message = 'Server Error', code = null }) => {
  const response = { 
    success: false, 
    error: message
  };
  
  if (code) response.code = code;
  
  return res.status(statusCode).json(response);
};

/**
 * Validate request body
 * @param {Object} schema - Joi validation schema
 */
exports.validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return exports.sendError(res, {
        statusCode: 400,
        message: error.details[0].message,
        code: 'VALIDATION_ERROR'
      });
    }
    next();
  };
}; 
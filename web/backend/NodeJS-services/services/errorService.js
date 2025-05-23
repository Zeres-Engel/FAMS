/**
 * Error Service
 * Centralizes error handling across the API
 */

/**
 * Custom API Error class for consistent error responses
 */
class ApiError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.success = false;
  }
}

/**
 * Create a new API error
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {string} code - Error code for client identification
 * @returns {ApiError} Custom error object
 */
exports.createError = (message, statusCode, code) => {
  return new ApiError(message, statusCode, code);
};

/**
 * Not found error
 * 
 * @param {string} item - The item that was not found
 * @returns {ApiError} Custom error object
 */
exports.notFoundError = (item) => {
  return new ApiError(`${item} not found`, 404, 'NOT_FOUND');
};

/**
 * Unauthorized error
 * 
 * @param {string} message - Custom message (optional)
 * @returns {ApiError} Custom error object
 */
exports.unauthorizedError = (message = 'Not authorized to access this resource') => {
  return new ApiError(message, 401, 'UNAUTHORIZED');
};

/**
 * Forbidden error
 * 
 * @param {string} message - Custom message (optional)
 * @returns {ApiError} Custom error object
 */
exports.forbiddenError = (message = 'Forbidden: Insufficient permissions') => {
  return new ApiError(message, 403, 'FORBIDDEN');
};

/**
 * Bad request error
 * 
 * @param {string} message - Custom message (optional)
 * @returns {ApiError} Custom error object
 */
exports.badRequestError = (message = 'Invalid request data') => {
  return new ApiError(message, 400, 'BAD_REQUEST');
};

/**
 * Server error
 * 
 * @param {string} message - Custom message (optional)
 * @returns {ApiError} Custom error object
 */
exports.serverError = (message = 'Server error occurred') => {
  return new ApiError(message, 500, 'SERVER_ERROR');
};

/**
 * Validation error
 * 
 * @param {string} message - Custom message (optional)
 * @returns {ApiError} Custom error object
 */
exports.validationError = (message = 'Validation failed') => {
  return new ApiError(message, 400, 'VALIDATION_ERROR');
};

/**
 * Global error handler middleware
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);
  
  // If it's our ApiError, use its status code and message
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      code: err.code
    });
  }
  
  // For mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    return res.status(400).json({
      success: false,
      message,
      code: 'VALIDATION_ERROR'
    });
  }
  
  // For mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for field '${field}': ${value}`,
      code: 'DUPLICATE_ERROR'
    });
  }
  
  // Default to 500 server error
  return res.status(500).json({
    success: false,
    message: err.message || 'Server Error',
    code: 'SERVER_ERROR'
  });
}; 
/**
 * Async handler wrapper for controllers to avoid try/catch in every function
 * @param {Function} fn - Async function to execute
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler; 
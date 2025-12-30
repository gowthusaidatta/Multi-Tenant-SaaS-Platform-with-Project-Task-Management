/**
 * Global error handler middleware
 * Catches unhandled errors and returns standardized error responses
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export function errorHandler(err, req, res, next) {
  // Log error details for debugging
  console.error('[Error Handler]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  // Send generic error response to client
  res.status(500).json({ success: false, message: 'Internal server error' });
}

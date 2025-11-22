/**
 * Production-safe error handler
 * Prevents leaking sensitive information in error messages
 */

export function errorHandler(err, req, res, next) {
  // Log full error details server-side
  console.error("API Error:", {
    message: err.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });

  // Determine status code
  const statusCode = err.statusCode || err.status || 500;

  // In production, don't expose internal error details
  const isProduction = process.env.NODE_ENV === "production";

  // Generic error message for production
  const message = isProduction && statusCode === 500
    ? "An internal server error occurred. Please try again later."
    : err.message || "An error occurred";

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && {
      details: err.details,
      stack: err.stack,
    }),
  });
}

/**
 * Async error wrapper - catches async errors in route handlers
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Create custom error with status code
 */
export function createError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}


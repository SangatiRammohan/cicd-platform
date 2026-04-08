const logger = require('../utils/logger');

// Express error-handling middleware MUST have exactly 4 params.
// If you use 3, Express treats it as a normal middleware and skips it.
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;

  logger.error('unhandled error', {
    message: err.message,
    stack:   err.stack,
    method:  req.method,
    path:    req.path,
    status
  });

  // Never expose internal stack traces to clients in production
  res.status(status).json({
    error:   status >= 500 ? 'Internal server error' : err.message,
    status,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};
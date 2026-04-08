const logger = require('../utils/logger');

// Logs every request as a structured JSON line.
// Output example:
// {"level":"info","method":"GET","path":"/api/status","status":200,"ms":4,"ts":"..."}
module.exports = function requestLogger(req, res, next) {
  const start = Date.now();

  // Hook into the response 'finish' event so we can log the status code.
  // We cannot log it before next() because the handler hasn't run yet.
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info';

    logger[level]('request', {
      method: req.method,
      path:   req.path,
      status: res.statusCode,
      ms,
      // Include x-request-id if your ingress / load balancer sets it
      reqId:  req.headers['x-request-id'] || null
    });
  });

  next();
};
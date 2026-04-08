const { createLogger, format, transports } = require('winston');

const { combine, timestamp, json, colorize, simple, errors } = format;

// In production (K8s), logs must be JSON so log aggregators
// (Datadog, CloudWatch, Loki) can parse and index them.
// In development, colorised human-readable output is easier to read.
const isDev = process.env.NODE_ENV !== 'production';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',

  // errors() must come before json() so stack traces are included
  format: isDev
    ? combine(errors({ stack: true }), colorize(), simple())
    : combine(
        errors({ stack: true }),
        timestamp(),
        json()           // output: {"level":"info","message":"...","timestamp":"..."}
      ),

  // Always log to stdout — never to files in a container.
  // K8s collects stdout automatically. Files inside a container
  // are lost when the pod restarts.
  transports: [
    new transports.Console()
  ],

  // If Winston itself throws an error, write to stderr so it
  // doesn't crash the process silently
  exceptionHandlers: [new transports.Console({ stderrLevels: ['error'] })],
  rejectionHandlers: [new transports.Console({ stderrLevels: ['error'] })]
});

module.exports = logger;
require('dotenv').config();
const express       = require('express');
const helmet        = require('helmet');
const cors          = require('cors');
const requestLogger = require('./middleware/requestLogger');
const errorHandler  = require('./middleware/errorHandler');
const { router: healthRouter } = require('./routes/health');
const apiRouter     = require('./routes/api');

function createApp() {
  const app = express();

  // Security: sets X-Content-Type, X-Frame-Options, HSTS, etc.
  app.use(helmet());

  // CORS: restrict origins in production via CORS_ORIGIN env var
  app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));

  // Body parsers
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Log every request BEFORE routes run
  app.use(requestLogger);

  // Routes
  app.use('/',    healthRouter);  // GET /health  GET /ready
  app.use('/api', apiRouter);     // GET /api/status

  // 404 — must be after all routes
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Global error handler — must be last, must have 4 params
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
const express = require('express');
const router  = express.Router();
const logger  = require('../utils/logger');

// Track application readiness state globally.
// Set to false during startup and during graceful shutdown.
let isReady = false;
const startTime = Date.now();

// Call this from server.js once all connections are established
const setReady = (value) => { isReady = value; };

// ── /health ──────────────────────────────────────────────────────────────────
// Liveness probe. Must always return 200 if the process is alive and not hung.
// Do NOT check DB here — a DB blip should not restart the pod.
router.get('/health', (_req, res) => {
  res.status(200).json({
    status:  'ok',
    uptime:  Math.floor((Date.now() - startTime) / 1000),  // seconds
    ts:      new Date().toISOString()
  });
});

// ── /ready ───────────────────────────────────────────────────────────────────
// Readiness probe. Returns 503 during startup or graceful shutdown.
// K8s removes the pod from the load balancer when this returns non-2xx.
// Add real dependency checks here (DB ping, cache ping, etc.)
router.get('/ready', async (_req, res) => {
  if (!isReady) {
    logger.warn('Readiness check failed — app not ready');
    return res.status(503).json({ status: 'not_ready' });
  }

  // TODO Phase 5: add MongoDB ping check here
  // try { await mongoose.connection.db.admin().ping(); }
  // catch { return res.status(503).json({ status: 'db_unavailable' }); }

  res.status(200).json({ status: 'ready' });
});

module.exports = { router, setReady };
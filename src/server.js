const createApp    = require('./app');
const logger       = require('./utils/logger');
const { setReady } = require('./routes/health');

const PORT = process.env.PORT || 3000;
const app  = createApp();

// Start HTTP server
const server = app.listen(PORT, () => {
  logger.info('Server started', { port: PORT, env: process.env.NODE_ENV });
  setReady(true);
  logger.info('App is ready to receive traffic');
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
// K8s sends SIGTERM when stopping a pod. We must:
//   1. Stop accepting new connections
//   2. Finish all in-flight requests
//   3. Close DB connections (Phase 5)
//   4. Exit with code 0
// If we skip this, K8s kills Node immediately — dropping live requests.

async function shutdown(signal) {
  logger.info(`${signal} received — starting graceful shutdown`);

  // Mark not-ready so readiness probe fails immediately.
  // K8s removes this pod from the load balancer.
  setReady(false);

  server.close(async (err) => {
    if (err) {
      logger.error('Error during server close', { error: err.message });
      process.exit(1);
    }
    // Phase 5: await mongoose.disconnect();
    logger.info('Graceful shutdown complete');
    process.exit(0);
  });

  // Force-exit after 25s if connections won't close.
  // deployment.yaml terminationGracePeriodSeconds is 30s — so this fires first.
  setTimeout(() => {
    logger.error('Shutdown timeout — forcing exit');
    process.exit(1);
  }, 25000);
}

process.on('SIGTERM', () => shutdown('SIGTERM')); // K8s pod stop
process.on('SIGINT',  () => shutdown('SIGINT'));  // Ctrl+C local dev

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
  process.exit(1);
});
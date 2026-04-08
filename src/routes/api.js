const express = require('express');
const router  = express.Router();

// Placeholder business route — replace with real routes in Phase 5
router.get('/status', (_req, res) => {
  res.json({
    app:     process.env.APP_NAME || 'express-app',
    env:     process.env.NODE_ENV,
    version: process.env.npm_package_version
  });
});

module.exports = router;
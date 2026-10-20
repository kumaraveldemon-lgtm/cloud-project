// routes/health.js
const express = require('express');
const router = express.Router();
const { query } = require('../db');

router.get('/', async (req, res) => {
  try {
    const start = Date.now();
    const result = await query('SELECT NOW() as now, version() as version;');
    const latencyMs = Date.now() - start;
    res.json({
      status: 'healthy',
      database: 'connected',
      latencyMs,
      serverTime: result.rows[0].now,
      postgresVersion: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1],
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: err.message,
    });
  }
});

module.exports = router;

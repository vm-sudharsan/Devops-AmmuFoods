const express = require("express");
const client = require("prom-client");

const router = express.Router();

// Enable collection of default Node.js metrics
// (CPU, memory, event loop lag, GC, active handles, etc.)
// { register } prevents duplicate registration if this module
// is required more than once (e.g. during tests)
client.collectDefaultMetrics({ register: client.register });

// GET /metrics  — scraped by Prometheus
router.get("/", async (req, res) => {
  try {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  } catch (err) {
    res.status(500).end(err.message);
  }
});

module.exports = router;

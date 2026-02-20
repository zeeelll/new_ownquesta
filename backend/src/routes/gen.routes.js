const express = require('express');
const router = express.Router();
const { explainModel } = require('../services/gen.service');

router.post('/explain', async (req, res) => {
  try {
    const payload = req.body;
    const data = await explainModel(payload);
    res.json(data);
  } catch (err) {
    console.error('Gen agent proxy error:', err && err.message ? err.message : err);
    res.status(500).json({ status: 'error', message: err.message || 'Gen agent error' });
  }
});

module.exports = router;

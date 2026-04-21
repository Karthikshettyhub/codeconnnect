const express = require('express');
const router = express.Router();
const { runInDocker } = require('../services/dockerService');

router.post('/run', async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({
      success: false,
      error: 'Code and language are required',
    });
  }

  const result = await runInDocker(code, language);
  res.json(result);
});

module.exports = router;
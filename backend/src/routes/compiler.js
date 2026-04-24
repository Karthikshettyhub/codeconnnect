const express = require('express');
const router = express.Router();
const { runInDocker } = require('../services/dockerService');

router.post('/run', async (req, res) => {
  const { code, language, input } = req.body || {};

  if (!code || !language) {
    return res.status(400).json({
      success: false,
      error: 'Code and language are required in JSON body',
    });
  }

  console.log(`🚀 [Compiler] Running ${language} code...`);
  const result = await runInDocker(code, language, input);
  
  if (result.success) {
    console.log(`✅ [Compiler] Execution successful`);
  } else {
    console.error(`❌ [Compiler] Execution failed:`, result.error);
  }
  
  res.json(result);
});

module.exports = router;
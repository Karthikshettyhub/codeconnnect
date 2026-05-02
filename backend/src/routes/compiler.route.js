const express = require("express");
const router = express.Router();
const { runCode } = require("../dockerService");

/**
 * POST /api/compiler/run
 * Body: { code, language, stdin }
 * Returns: { output, error, executionTime }
 */
router.post("/run", async (req, res) => {
  const { code, language, stdin = "" } = req.body;

  // basic validation
  if (!code || !language) {
    return res.status(400).json({ error: "Code and language are required." });
  }

  if (code.length > 50000) {
    return res.status(400).json({ error: "Code too long. Max 50,000 characters." });
  }

  try {
    const result = await runCode(code, language, stdin);
    res.json(result);
  } catch (err) {
    console.error("Compiler error:", err.message);
    res.status(500).json({ error: "Something went wrong running your code." });
  }
});

module.exports = router;
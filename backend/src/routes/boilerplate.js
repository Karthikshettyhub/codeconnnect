// const express = require("express");
// const router = express.Router();
// const { generateBoilerplate } = require("../services/llm");

// router.post("/generate", async (req, res) => {
//   const { code, language } = req.body;

//   console.log("📥 Boilerplate request received");

//   if (!code || !language) {
//     return res.status(400).json({
//       error: "Code and language are required",
//     });
//   }

//   try {
//     console.log("🧠 Calling LLM...");
//     const wrappedCode = await generateBoilerplate(code, language);

//     console.log("✅ Boilerplate generated");
//     res.json({ wrappedCode });
//   } catch (err) {
//     console.error("❌ Boilerplate error:", err);
//     res.status(500).json({
//       error: "Failed to generate boilerplate",
//     });
//   }
// });

// module.exports = router;

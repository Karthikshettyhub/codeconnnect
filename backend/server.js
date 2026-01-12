const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5005;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// ✅ NOW TEST HERE (after GEMINI_KEY is declared)
console.log("🔑 API Key loaded:", GEMINI_KEY ? "YES (length: " + GEMINI_KEY.length + ")" : "NO");
console.log("🔑 First 10 chars:", GEMINI_KEY ? GEMINI_KEY.substring(0, 10) + "..." : "NONE");

app.use(cors());
app.use(express.json());

const clean = (text = "") =>
  text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/```/g, "")
    .replace(/`/g, "")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/Here is( the)? code:?/gi, "")
    .replace(/Output:?/gi, "")
    .replace(/Explanation:?/gi, "")
    .trim();

app.get("/", (req, res) => {
  res.json({ message: "Backend working!" });
});

app.post("/boiler", async (req, res) => {
  const { language, userBody } = req.body;

  console.log("\n===============================");
  console.log("🔵 GEMINI REQUEST");
  console.log("Language:", language);
  console.log("User Code:\n", userBody);
  console.log("===============================\n");

  if (!language || !userBody) {
    console.log("❌ Missing language or userBody");
    return res.json({ ok: false, output: "", error: "Missing language or code" });
  }

  if (!GEMINI_KEY) {
    console.log("❌ Missing GEMINI_API_KEY in .env");
    return res.json({ ok: false, output: "", error: "API key not configured" });
  }

  const prompt = `Generate ONLY ${language} boilerplate code that wraps this user code.

Rules:
- DO NOT modify the user's code
- DO NOT add explanations or comments
- DO NOT use markdown code blocks
- Output ONLY executable ${language} code

User code to wrap:
${userBody}

Generate the complete boilerplate now:`;

  try {
    console.log("📤 Sending request to Gemini API...");

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );

    console.log("📥 Received response from Gemini");

    const llmText = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!llmText) {
      console.log("❌ Empty response from Gemini");
      return res.json({ ok: false, output: "", error: "Empty response from AI" });
    }

    console.log("🟢 RAW RESPONSE:\n", llmText);

    const cleaned = clean(llmText);

    console.log("🟢 CLEANED OUTPUT:\n", cleaned);
    console.log("🟢 CLEANED LENGTH:", cleaned.length);

    if (!cleaned || cleaned.length < 10) {
      console.log("⚠️ Cleaned output too short or empty");
      return res.json({
        ok: false,
        output: "",
        error: `Generated code too short (${cleaned.length} chars)`
      });
    }

    console.log("✅ Boilerplate generated successfully");

    return res.json({
      ok: true,
      output: cleaned,
    });
  } catch (err) {
    console.log("🟥 GEMINI ERROR:");
    console.log("Error message:", err.message);
    console.log("Error response:", err.response?.data);

    const errorMessage = err.response?.data?.error?.message || err.message || "Unknown error";

    return res.json({
      ok: false,
      output: "",
      error: `Gemini API error: ${errorMessage}`
    });
  }
});

require("./src/socketHandler")(io);

server.listen(PORT, () => {
  console.log(`🔥 Backend + Gemini + Socket running on port ${PORT}`);
});
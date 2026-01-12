const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// 🔥 IMPORTANT FIX FOR RENDER + WEBRTC
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"], // ✅ FORCE WEBSOCKET
});

const PORT = process.env.PORT || 5005;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

// Debug Gemini key (safe)
console.log(
  "🔑 API Key loaded:",
  GEMINI_KEY ? "YES (length: " + GEMINI_KEY.length + ")" : "NO"
);

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

  if (!language || !userBody) {
    return res.json({ ok: false, output: "", error: "Missing language or code" });
  }

  if (!GEMINI_KEY) {
    return res.json({
      ok: false,
      output: "",
      error: "API key not configured",
    });
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
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );

    const llmText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleaned = clean(llmText);

    if (!cleaned || cleaned.length < 10) {
      return res.json({
        ok: false,
        output: "",
        error: "Generated code too short",
      });
    }

    return res.json({
      ok: true,
      output: cleaned,
    });
  } catch (err) {
    return res.json({
      ok: false,
      output: "",
      error: err.message || "Gemini API error",
    });
  }
});

// 🔌 SOCKET HANDLER (UNCHANGED)
require("./src/socketHandler")(io);

server.listen(PORT, () => {
  console.log(`🔥 Backend + Gemini + Socket running on port ${PORT}`);
});

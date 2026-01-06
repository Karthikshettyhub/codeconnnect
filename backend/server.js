const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// ========================
// 🚀 SOCKET.IO SETUP
// ========================
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173",process.env.FRONTEND_URL],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// IMPORTANT: backend runs on 5005
const PORT = process.env.PORT || 5005;
const GEMINI_KEY = process.env.GEMINI_API_KEY;

app.use(cors());
app.use(express.json());

// =============================
// 🧼 CLEAN FUNCTION
// =============================
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

// =============================
// TEST ROUTE
// =============================
app.get("/", (req, res) => {
  res.json({ message: "Backend working!" });
});

// =============================
// 🧠 GEMINI BOILERPLATE ROUTE
// =============================
app.post("/boiler", async (req, res) => {
  const { language, userBody } = req.body;

  console.log("\n===============================");
  console.log("🔵 GEMINI REQUEST");
  console.log("Language:", language);
  console.log("User Code:\n", userBody);
  console.log("===============================\n");

  if (!language || !userBody) {
    return res.json({ ok: false, output: "" });
  }

  const prompt = `
Generate ONLY ${language} boilerplate code.
DO NOT fix user code.
DO NOT explain.
DO NOT add markdown.

Wrap this USER BODY inside correct ${language} boilerplate.

USER BODY:
${userBody}
`;

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }],
      }
    );

    const llmText =
      response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    const cleaned = clean(llmText);

    console.log("🟢 RAW RESPONSE:\n", llmText);
    console.log("🟢 CLEANED OUTPUT:\n", cleaned);

    if (!cleaned || cleaned.length < 5) {
      return res.json({ ok: false, output: "" });
    }

    return res.json({
      ok: true,
      output: cleaned,
    });
  } catch (err) {
    console.log("🟥 GEMINI ERROR:", err.response?.data || err);
    return res.json({ ok: false, output: "" });
  }
});

// =============================
// SOCKET HANDLER (UNCHANGED)
// =============================
require("./src/socketHandler")(io);

// =============================
// START SERVER
// =============================
server.listen(PORT, () => {
  console.log(`🔥 Backend + Gemini + Socket running on port ${PORT}`);
});

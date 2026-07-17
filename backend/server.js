const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const passport = require("passport");
const cookieParser = require("cookie-parser");

require("dotenv").config();

// 🔥 DB
const connectDB = require("./src/config/db"); // adjust path if needed

const app = express();
const server = http.createServer(app);

// 🔥 CONNECT DB
connectDB();

// 🔐 PASSPORT CONFIG
require("./src/config/passport");

// ── CORS CONFIG ──────────────────────────────────────────────
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL,
  ],
  methods: ["GET", "POST"],
  credentials: true, // 🔥 REQUIRED FOR COOKIES
};

// ── SOCKET SERVER ────────────────────────────────────────────
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

// ── MIDDLEWARES ──────────────────────────────────────────────
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser()); // 🔥 for reading cookies
app.use(passport.initialize()); // 🔥 passport

const PORT = process.env.PORT || 5005;

// ── AUTH ROUTES (NEW) ────────────────────────────────────────
app.use("/auth", require("./src/routes/auth"));

// ── API ROUTES ───────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// compiler route
const compilerRoutes = require("./src/routes/compiler.route.js");
app.use("/api/compiler", compilerRoutes);

// room history routes
app.use("/api/rooms", require("./src/routes/room.route.js"));

// ── STATIC FRONTEND ──────────────────────────────────────────
const frontendPath = path.join(__dirname, "../frontend/my-app/dist");
app.use(express.static(frontendPath));

// SPA fallback
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/auth")) {
    return res.sendFile(path.join(frontendPath, "index.html"));
  }
});

// ── SOCKET HANDLER ───────────────────────────────────────────
require("./src/socketHandler")(io);

// ── START SERVER ─────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
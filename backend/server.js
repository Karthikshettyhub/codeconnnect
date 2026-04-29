const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

// cors config — controls who can access your backend
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL, // local docker frontend
    process.env.VERCEL_URL,   // deployed vercel frontend
  ],
  methods: ["GET", "POST"],
};

// socket.io server with same cors config
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"], // polling as fallback
});

const PORT = process.env.PORT || 5005;

app.use(cors(corsOptions));
app.use(express.json());

// ── API routes ────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// compiler route — must be before static files
const compilerRoutes = require("./src/routes/compiler.route");
app.use("/api/compiler", compilerRoutes);

// ── Static frontend files ─────────────────────────────────────
const frontendPath = path.join(__dirname, "../frontend/my-app/dist");
app.use(express.static(frontendPath));

// SPA fallback — send index.html for all non-api GET requests
// so React Router handles the routing on frontend
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(frontendPath, "index.html"));
  }
  next();
});

// ── Socket handler ────────────────────────────────────────────
require("./src/socketHandler")(io);

// ── Start server ──────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
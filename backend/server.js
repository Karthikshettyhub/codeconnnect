const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5005;

// ✅ Detect environment
const isProduction = process.env.NODE_ENV === "production";

// ✅ Allowed origins
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL
].filter(Boolean);

// ✅ Flexible CORS (handles Vercel)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      return callback(null, true);
    }

    console.log("❌ Blocked by CORS:", origin);
    return callback(null, false);
  },
  credentials: true
}));

app.use(express.json());

// ✅ Routes
const compilerRoute = require("./src/routes/compiler");
app.use("/api/compiler", compilerRoute);

// ✅ Health check
app.get("/", (req, res) => res.send("Server running"));
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ✅ Socket.IO
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

require("./src/socketHandler")(io);

// ✅ Prevent timeout issues
server.timeout = 30000;

// ✅ Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("ENV:", process.env.NODE_ENV);
});
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5005;

// ✅ Detect environment
const isProduction = process.env.NODE_ENV === "production";

// ✅ Allowed origins (safe + flexible)
const allowedOrigins = [
  "http://localhost:5173", // dev frontend
  process.env.FRONTEND_URL, // deployed frontend
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
].filter(Boolean);

// ✅ Dynamic CORS handler (BEST PRACTICE)
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true
}));




// ✅ Middleware
app.use(express.json());

// ✅ Routes
const compilerRoute = require("./src/routes/compiler.js");
app.use("/api/compiler", compilerRoute);

// ✅ Health check
app.get("/", (req, res) => {
  res.send("Server running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ✅ Socket.IO (FIXED)
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ["websocket", "polling"]
});

// ✅ Socket handler
require("./src/socketHandler")(io);

// ✅ Serve frontend ONLY in production
const frontendPath = path.join(__dirname, "../frontend/my-app/dist");

if (isProduction) {
  app.use(express.static(frontendPath));

  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

// ✅ Debug logs (optional)
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("Allowed Origins:", allowedOrigins);

// ✅ Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
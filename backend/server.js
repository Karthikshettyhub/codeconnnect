const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  transports: ["websocket"],
});

const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json());

// Serve static frontend build
const frontendPath = path.join(__dirname, "../frontend/my-app/dist");
app.use(express.static(frontendPath));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// SPA catch-all — must be after all API routes
app.use((req, res, next) => {
  // Only serve index.html for non-API GET requests
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    return res.sendFile(path.join(frontendPath, "index.html"));
  }
  next();
});

// Socket handler
require("./src/socketHandler")(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

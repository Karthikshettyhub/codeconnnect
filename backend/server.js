const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST"],
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

const PORT = process.env.PORT || 5005;

app.use(cors(corsOptions));
app.use(express.json());

const frontendPath = path.join(__dirname, "../frontend/my-app/dist");

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Static files
app.use(express.static(frontendPath));

// SPA fallback (one, at the end)
app.get("*splat", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

require("./src/socketHandler")(io);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
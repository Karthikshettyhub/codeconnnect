const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const passport = require("passport");
const cookieParser = require("cookie-parser");
const { createClient } = require("redis");
const { createAdapter } = require("@socket.io/redis-adapter");

require("dotenv").config();

// Database connection
const connectDB = require("./src/config/Db");

const app = express();
const server = http.createServer(app);

// Trust the Nginx reverse proxy in front of this server
app.set("trust proxy", 1);

// Connect to MongoDB
connectDB();

// Load passport strategy config
require("./src/config/passport");

// CORS configuration
const corsOptions = {
  origin: [
    process.env.FRONTEND_URL,
    process.env.VERCEL_URL,
  ],
  methods: ["GET", "POST"],
  credentials: true, // required so cookies are sent cross-origin
};

// Socket.IO server setup
const io = new Server(server, {
  cors: corsOptions,
  transports: ["websocket", "polling"],
});

// Redis adapter: lets multiple backend instances share Socket.IO events
const pubClient = createClient({ url: "redis://redis:6379" });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()])
  .then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log("Redis adapter connected - Socket.IO synced across instances");
  })
  .catch((err) => {
    console.error("Redis adapter connection failed:", err);
  });

// Middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());

const PORT = process.env.PORT || 5005;

// Auth routes
app.use("/auth", require("./src/routes/auth"));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Compiler route
const compilerRoutes = require("./src/routes/compiler.route.js");
app.use("/api/compiler", compilerRoutes);

// Room history routes
app.use("/api/rooms", require("./src/routes/room.route.js"));

// Serve the built frontend
const frontendPath = path.join(__dirname, "../frontend/my-app/dist");
app.use(express.static(frontendPath));

// SPA fallback - send index.html for any non-API route
app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api") && !req.path.startsWith("/auth")) {
    return res.sendFile(path.join(frontendPath, "index.html"));
  }
});

// Socket event handlers
require("./src/socketHandler")(io);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
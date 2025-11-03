// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

// ✅ Allow Vite frontend (5173) to connect
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Backend running!' });
});

// ✅ Correct import (your file is socket.js, not socketHandler.js)
const socketHandler = require('./src/socketHandler');

socketHandler(io);

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

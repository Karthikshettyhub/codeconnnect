// src/server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

//TODO: Setup Socket.io with CORS
//What origin should we allow? (think about your React app's port)

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5174', // React app's URL (Vite default)
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic test route
app.get('/', (req, res) => {
  res.json({ message: 'CodeCollab Backend Running!' });
});

//TODO: Import and initialize socket handler


const socketHandler = require('./socketHandler');
socketHandler(io);

server.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});

// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require("mongoose");
const authRoutes = require("./src/routes/authRoutes.js");


const app = express();
const server = http.createServer(app);

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

// ✅ Allow Vite frontend (5173) to connect
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.get('/', (req, res) => {
  res.json({ message: 'Backend running!' });
});

// ✅ Correct import (your file is socket.js, not socketHandler.js)
const socketHandler = require('./src/socketHandler.js');


socketHandler(io);

server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

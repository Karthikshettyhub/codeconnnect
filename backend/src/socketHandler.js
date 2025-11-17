// backend/src/socketHandler.js

const roomManager = require('./roomManager');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // CREATE ROOM
    socket.on('create-room', ({ roomId, username }) => {
      const result = roomManager.createRoom(roomId, socket.id, username);

      if (result.success) {
        socket.join(roomId);

        socket.emit('room-created', {
          roomId,
          username,
          users: result.room.users,
        });
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // JOIN ROOM
    socket.on('join-room', ({ roomId, username }) => {
      const result = roomManager.joinRoom(roomId, socket.id, username);

      if (result.success) {
        socket.join(roomId);

        socket.emit('room-joined', {
          roomId,
          users: result.room.users,
        });

        socket.to(roomId).emit('user-joined', { username });
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // TEXT MESSAGE
    socket.on("send-message", ({ roomId, username, message }) => {
      io.to(roomId).emit("receive-message", {
        username,
        message,
        timestamp: Date.now(),
      });
    });

    // CODE SYNC
    socket.on("code-send", ({ roomId, code }) => {
      socket.to(roomId).emit("code-receive", { code });
    });

    // ========= 🎤 VOICE CHAT EVENTS =========

    // MIC ON
    socket.on("voice-start", ({ roomId, username }) => {
      socket.to(roomId).emit("voice-start", { username });
    });

    // SENDING AUDIO CHUNKS
    socket.on("voice-chunk", ({ roomId, username, chunk }) => {
      socket.to(roomId).emit("voice-chunk", { username, chunk });
    });

    // MIC OFF
    socket.on("voice-stop", ({ roomId, username }) => {
      socket.to(roomId).emit("voice-stop", { username });
    });

    // USER DISCONNECT
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });

  });
};

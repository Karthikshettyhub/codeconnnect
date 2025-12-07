// backend/src/socketHandler.js
const roomManager = require("./roomManager");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // ================================
    // CREATE ROOM
    // ================================
    socket.on("create-room", ({ roomId, username }) => {
      const result = roomManager.createRoom(roomId, socket.id, username);

      if (!result.success) {
        socket.emit("error", { message: result.message });
        return;
      }

      socket.join(roomId);
      socket.emit("room-created", {
        roomId,
        users: result.room.users,
        messages: result.room.messages,
        code: result.room.code,
        // optional: language: result.room.language || "javascript",
      });

      console.log(`🏠 Room created: ${roomId}`);
    });

    // ================================
    // JOIN ROOM
    // ================================
    socket.on("join-room", ({ roomId, username }) => {
      const result = roomManager.joinRoom(roomId, socket.id, username);

      if (!result.success) {
        socket.emit("error", { message: result.message });
        return;
      }

      socket.join(roomId);

      const roomData = roomManager.getRoomData(roomId);

      socket.emit("room-joined", {
        roomId,
        users: roomData.data.users,
        messages: roomData.data.messages,
        code: roomData.data.code,
        // optional: language: roomData.data.language || "javascript",
      });

      socket.to(roomId).emit("user-joined", {
        username,
        users: roomData.data.users,
      });

      console.log(`🚪 ${username} joined ${roomId}`);
    });

    // ================================
    // LEAVE ROOM
    // ================================
    socket.on("leave-room", ({ roomId, username }) => {
      const result = roomManager.leaveRoom(roomId, socket.id);
      socket.leave(roomId);

      if (result.success) {
        socket.to(roomId).emit("user-left", { username });
        console.log(`👋 ${username} left ${roomId}`);
      }
    });

    // ================================
    // CHAT MESSAGE
    // ================================
    socket.on("chat-message", ({ roomId, username, message }) => {
      const messageData = {
        username,
        message,
        timestamp: Date.now(),
        isSystem: false,
      };

      roomManager.addMessage(roomId, messageData);
      io.to(roomId).emit("receive-message", messageData);

      console.log(`💬 [${roomId}] ${username}: ${message}`);
    });

    // ================================
    // CODE SYNC
    // ================================
    socket.on("code-change", ({ roomId, code }) => {
      roomManager.updateCode(roomId, code);
      socket.to(roomId).emit("code-receive", { code });
    });

    // ================================
    // 🔥 LANGUAGE CHANGE SYNC
    // ================================
    socket.on("language-change", ({ roomId, language, username }) => {
      console.log(`🌐 Language changed in ${roomId} → ${language} by ${username}`);

      // Send to everyone EXCEPT the one who changed
      socket.to(roomId).emit("language-receive", {
        language,
        username,
      });
    });

    // ================================
    // DISCONNECT
    // ================================
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};

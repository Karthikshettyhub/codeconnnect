const roomManager = require("./roomManager");

module.exports = (io) => {

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // When a user creates a new room
    socket.on("create-room", ({ roomId, username, passcode } = {}) => {
      const result = roomManager.createRoom(roomId, socket.id, username, passcode);
      if (!result.success) {
        socket.emit("error", { message: result.message });
        return;
      }

      // UPDATED: EXTRA SAFETY CHECK
      if (!roomManager.rooms[roomId]) return;

      socket.join(roomId);
      socket.emit("room-created", { roomId, ...roomManager.getRoomData(roomId) });
    });

    // When a user joins an existing room
    socket.on("join-room", ({ roomId, username, passcode } = {}) => {
      if (!roomId || !username) return;

      const result = roomManager.joinRoom(roomId, socket.id, username, passcode);
      if (!result.success) {
        socket.emit("error", { message: result.message });
        return;
      }

      socket.join(roomId);
      console.log(`✅ [JOIN] Socket ${socket.id} (${username}) joined: ${roomId}`);
      console.log("Current rooms for socket:", Array.from(socket.rooms));

      socket.emit("room-joined", { roomId, ...roomManager.getRoomData(roomId) });
      socket.to(roomId).emit("user-joined", { username, socketId: socket.id });
    });

    // When a user sends a chat message
    socket.on("chat-message", ({ roomId, username, message }) => {
      if (!roomId || !username || !message) return;

      console.log(`📩 [CHAT] Received from ${username} in ${roomId}: ${message}`);
      
      // Verification: Is socket in this room?
      if (!socket.rooms.has(roomId)) {
        console.warn(`⚠️ [CHAT] Socket ${socket.id} attempted to chat in ${roomId} but was NOT in room. Fixing...`);
        socket.join(roomId);
      }

      const chatData = {
        username,
        message,
        timestamp: Date.now(),
      };

      roomManager.addMessage(roomId, chatData);
      
      console.log(`📡 [CHAT] Broadcasting message to room: ${roomId}`);
      io.to(roomId).emit("receive-message", chatData);
    });

    // When a user types in the code editor
    socket.on("code-change", ({ roomId, code } = {}) => {
      roomManager.updateCode(roomId, code);
      socket.to(roomId).emit("code-receive", { code });
    });

    // When a user changes the coding language
    socket.on("language-change", ({ roomId, language, username } = {}) => {
      roomManager.updateLanguage(roomId, language);
      socket.to(roomId).emit("language-change", {
        language,
        username: username || "Someone"
      });
    });

    socket.on("leave-room", ({ roomId }) => {
      roomManager.leaveRoom(roomId, socket.id);
    });

    socket.on("disconnect", (reason) => {
      console.log("DISCONNECT:", socket.id, reason);
      roomManager.removeUserBySocketId(socket.id);
    });

    // WebRTC Signaling for Voice Chat
    socket.on("webrtc-offer", ({ target, offer }) => {
      socket.to(target).emit("webrtc-offer", { from: socket.id, offer });
    });

    socket.on("webrtc-answer", ({ target, answer }) => {
      socket.to(target).emit("webrtc-answer", { from: socket.id, answer });
    });

    socket.on("webrtc-ice", ({ target, candidate }) => {
      socket.to(target).emit("webrtc-ice", { from: socket.id, candidate });
    });
  });

};
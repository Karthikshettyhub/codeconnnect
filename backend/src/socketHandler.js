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
      const result = roomManager.joinRoom(roomId, socket.id, username, passcode);
      if (!result.success) {
        socket.emit("error", { message: result.message });
        return;
      }

      // UPDATED: EXTRA SAFETY CHECK
      if (!roomManager.rooms[roomId]) return;

      socket.join(roomId);
      socket.emit("room-joined", { roomId, ...roomManager.getRoomData(roomId) });
      socket.to(roomId).emit("user-joined", { username, socketId: socket.id });
    });

    // When a user sends a chat message
    socket.on("chat-message", ({ roomId, message } = {}) => {
      const room = roomManager.getRoomData(roomId);
      const sender = room?.users?.find(u => u.socketId === socket.id);
      if (!sender) {
        socket.emit("error", { message: "You are not in this room." });
        return;
      }
      const chatData = {
        username: sender.username,
        message: message,
        timestamp: Date.now(),
      };
      roomManager.addMessage(roomId, chatData);
      io.to(roomId).emit("receive-message", chatData);
    });

    // When a user types in the code editor
    socket.on("code-change", ({ roomId, code } = {}) => {
      roomManager.updateCode(roomId, code);
      socket.to(roomId).emit("code-receive", { code });
    });

    // When a user changes the coding language
    socket.on("language-change", ({ roomId, language } = {}) => {
      const room = roomManager.getRoomData(roomId);
      const sender = room?.users?.find(u => u.socketId === socket.id);
      roomManager.updateLanguage(roomId, language);
      socket.to(roomId).emit("language-change", {
        language,
        username: sender?.username ?? "Someone"
      });
    });

    // ADDED
    socket.on("leave-room", ({ roomId }) => {
      roomManager.leaveRoom(roomId, socket.id);
    });

    // UPDATED with DEBUG LOGS
    socket.on("disconnect", (reason) => {
      console.log("DEBUG: socket.id disconnecting:", socket.id);

      // Step 1: Mark user offline
      const affectedRooms = roomManager.removeUserBySocketId(socket.id);
      if (!affectedRooms || affectedRooms.length === 0) return;

      affectedRooms.forEach(({ roomId }) => {
        // Step 3: Wait 5 seconds
        setTimeout(() => {
          // Step 4: Check if room is still empty (all users offline)
          const users = roomManager.getRoomUsers(roomId);
          if (!users) return;

          const allOffline = users.every(u => u.socketId === null);

          if (allOffline) {
            // Step 5: Trigger cleanup
            roomManager.leaveRoom(roomId, null);
          }
        }, 5000);
      });
    });

  });

};
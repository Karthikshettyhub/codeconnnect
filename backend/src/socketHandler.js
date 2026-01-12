// backend/src/socketHandler.js
const roomManager = require("./roomManager");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    // =====================
    // CREATE ROOM
    // =====================
    socket.on("create-room", ({ roomId, username }) => {
      console.log("📥 CREATE-ROOM EVENT:", {
        roomId,
        username,
        socketId: socket.id,
      });

      const result = roomManager.createRoom(
        roomId,
        socket.id, // userId
        username,
        socket.id // socketId
      );

      if (!result.success) {
        console.log("❌ FAILED:", result.message);
        socket.emit("error", { message: result.message });
        return;
      }

      socket.join(roomId);

      socket.emit("room-created", {
        roomId,
        ...roomManager.getRoomData(roomId),
      });

      console.log("✅ ROOM CREATED:", roomId);
    });

    // =====================
    // JOIN ROOM (REFRESH SAFE)
    // =====================
    socket.on("join-room", ({ roomId, username }) => {
      console.log("📥 JOIN-ROOM EVENT:", {
        roomId,
        username,
        socketId: socket.id,
      });

      const result = roomManager.joinRoom(
        roomId,
        socket.id, // userId
        username,
        socket.id
      );

      if (!result.success) {
        console.log("❌ FAILED:", result.message);
        socket.emit("error", { message: result.message });
        return;
      }

      socket.join(roomId);

      socket.emit("room-joined", {
        roomId,
        ...roomManager.getRoomData(roomId),
      });

      console.log("✅ ROOM JOINED:", roomId);
    });

    // =====================
    // CHAT
    // =====================
    socket.on("chat-message", ({ roomId, username, message }) => {
      const data = {
        username,
        message,
        timestamp: Date.now(),
      };

      roomManager.addMessage(roomId, data);
      io.to(roomId).emit("receive-message", data);
    });

    // =====================
    // CODE SYNC
    // =====================
    socket.on("code-change", ({ roomId, code }) => {
      roomManager.updateCode(roomId, code);
      socket.to(roomId).emit("code-receive", { code });
    });

    // =====================
    // LANGUAGE CHANGE
    // =====================
    socket.on("language-change", ({ roomId, language, username }) => {
      roomManager.updateLanguage(roomId, language);
      socket.to(roomId).emit("language-change", {
        language,
        username,
      });
    });

    // =====================
    // DISCONNECT (SAFE)
    // =====================
    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
      roomManager.removeUserBySocketId(socket.id);
    });

    // =====================
    // WEBRTC SIGNALING
    // =====================
    // =====================
    // WEBRTC SIGNALING
    // =====================
    socket.on("webrtc-offer", ({ target, offer }) => {
      io.to(target).emit("webrtc-offer", {
        from: socket.id,
        offer,
      });
    });

    socket.on("webrtc-answer", ({ target, answer }) => {
      io.to(target).emit("webrtc-answer", {
        from: socket.id,
        answer,
      });
    });

    socket.on("webrtc-ice", ({ target, candidate }) => {
      io.to(target).emit("webrtc-ice", {
        from: socket.id,
        candidate,
      });
    });

  });
};

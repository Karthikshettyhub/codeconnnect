// backend/src/socketHandler.js
const roomManager = require("./roomManager");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 Connected:", socket.id);

    socket.on("create-room", ({ roomId, username }) => {
      const result = roomManager.createRoom(roomId, socket.id, username);
      if (!result.success) return;

      socket.join(roomId);

      socket.emit("room-created", {
        roomId,
        ...roomManager.getRoomData(roomId),
      });
    });

    socket.on("join-room", ({ roomId, username }) => {
      const result = roomManager.joinRoom(roomId, socket.id, username);
      if (!result.success) return;

      socket.join(roomId);

      socket.emit("room-joined", {
        roomId,
        ...roomManager.getRoomData(roomId),
      });
    });

    socket.on("chat-message", ({ roomId, username, message }) => {
      const data = { username, message, timestamp: Date.now() };
      roomManager.addMessage(roomId, data);
      io.to(roomId).emit("receive-message", data);
    });

    socket.on("code-change", ({ roomId, code }) => {
      roomManager.updateCode(roomId, code);
      socket.to(roomId).emit("code-receive", { code });
    });

    // ✅ LANGUAGE CHANGE (POPUP ONLY)
    socket.on("language-change", ({ roomId, language, username }) => {
      roomManager.updateLanguage(roomId, language);

      socket.to(roomId).emit("language-change", {
        language,
        username,
      });
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected:", socket.id);
    });
    // inside io.on("connection")

    socket.on("webrtc-offer", ({ roomId, offer }) => {
      console.log("📨 Offer received for room", roomId);
      socket.to(roomId).emit("webrtc-offer", { roomId, offer });
    });

    socket.on("webrtc-answer", ({ roomId, answer }) => {
      console.log("📤 Answer received for room", roomId);
      socket.to(roomId).emit("webrtc-answer", { answer });
    });

    socket.on("webrtc-ice", ({ roomId, candidate }) => {
      socket.to(roomId).emit("webrtc-ice", { candidate });
    });

  });
};

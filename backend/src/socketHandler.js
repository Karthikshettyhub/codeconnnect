const roomManager = require("./roomManager");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("Connected:", socket.id);

    socket.on("create-room", ({ roomId, username, passcode }) => {
      const result = roomManager.createRoom(
        roomId,
        socket.id,
        username,
        socket.id,
        passcode
      );

      if (!result.success) {
        socket.emit("error", { message: result.message });
        return;
      }

      socket.join(roomId);
      socket.emit("room-created", {
        roomId,
        ...roomManager.getRoomData(roomId),
      });
    });

    socket.on("join-room", ({ roomId, username, passcode }) => {
      const result = roomManager.joinRoom(
        roomId,
        socket.id,
        username,
        socket.id,
        passcode
      );

      if (!result.success) {
        socket.emit("error", { message: result.message });
        return;
      }

      socket.join(roomId);
      socket.emit("room-joined", {
        roomId,
        ...roomManager.getRoomData(roomId),
      });
    });

    socket.on("chat-message", ({ roomId, username, message }) => {
      const data = {
        username,
        message,
        timestamp: Date.now(),
      };

      roomManager.addMessage(roomId, data);
      io.to(roomId).emit("receive-message", data);
    });

    socket.on("code-change", ({ roomId, code }) => {
      roomManager.updateCode(roomId, code);
      socket.to(roomId).emit("code-receive", { code });
    });

    socket.on("language-change", ({ roomId, language, username }) => {
      roomManager.updateLanguage(roomId, language);
      socket.to(roomId).emit("language-change", { language, username });
    });

    socket.on("disconnect", () => {
      console.log("Disconnected:", socket.id);
      roomManager.removeUserBySocketId(socket.id);
    });

    socket.on("webrtc-offer", ({ target, offer }) => {
      io.to(target).emit("webrtc-offer", { from: socket.id, offer });
    });

    socket.on("webrtc-answer", ({ target, answer }) => {
      io.to(target).emit("webrtc-answer", { from: socket.id, answer });
    });

    socket.on("webrtc-ice", ({ target, candidate }) => {
      io.to(target).emit("webrtc-ice", { from: socket.id, candidate });
    });
  });
};

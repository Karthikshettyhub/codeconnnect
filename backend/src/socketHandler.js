// backend/src/socketHandler.js
<<<<<<< HEAD
const roomManager = require("./roomManager"); // keep your manager
module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // CREATE ROOM
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
      });

      console.log(`🏠 Room created: ${roomId}`);
    });

    // JOIN ROOM
    socket.on("join-room", ({ roomId, username }) => {
      const result = roomManager.joinRoom(roomId, socket.id, username);

      if (!result.success) {
        socket.emit("error", { message: result.message });
        return;
      }

      socket.join(roomId);

      const roomData = roomManager.getRoomData(roomId);

      // 1) send joined user full room data
      socket.emit("room-joined", {
        roomId,
        users: roomData.data.users,
        messages: roomData.data.messages,
        code: roomData.data.code,
=======
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
>>>>>>> bugfix-working-version
      });
    });

<<<<<<< HEAD
      // 2) send list of existing participants (so the new user can trigger/expect offers)
      const existing = (roomData.data.users || [])
        .filter((u) => u.socketId !== socket.id)
        .map((u) => ({ socketId: u.socketId, username: u.username }));
      socket.emit("existing-users", { existing });

      // 3) notify others about new participant (so others can create offers to the newcomer)
      socket.to(roomId).emit("new-participant", { socketId: socket.id, username });

      // 4) broadcast user-joined for UI lists
      socket.to(roomId).emit("user-joined", {
        username,
        users: roomData.data.users,
=======
    socket.on("join-room", ({ roomId, username }) => {
      const result = roomManager.joinRoom(roomId, socket.id, username);
      if (!result.success) return;

      socket.join(roomId);

      socket.emit("room-joined", {
        roomId,
        ...roomManager.getRoomData(roomId),
>>>>>>> bugfix-working-version
      });
    });

<<<<<<< HEAD
    // LEAVE ROOM
    socket.on("leave-room", ({ roomId, username }) => {
      const result = roomManager.leaveRoom(roomId, socket.id);
      socket.leave(roomId);

      if (result.success) {
        socket.to(roomId).emit("user-left", { username });
        console.log(`👋 ${username} left ${roomId}`);
      }
    });

    // CHAT MESSAGE
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

    // CODE SYNC
=======
    socket.on("chat-message", ({ roomId, username, message }) => {
      const data = { username, message, timestamp: Date.now() };
      roomManager.addMessage(roomId, data);
      io.to(roomId).emit("receive-message", data);
    });

>>>>>>> bugfix-working-version
    socket.on("code-change", ({ roomId, code }) => {
      roomManager.updateCode(roomId, code);
      socket.to(roomId).emit("code-receive", { code });
    });

<<<<<<< HEAD
    // LANGUAGE CHANGE SYNC
    socket.on("language-change", ({ roomId, language, username }) => {
      console.log(`🌐 Language changed in ${roomId} → ${language} by ${username}`);
      socket.to(roomId).emit("language-receive", { language, username });
    });

    // =========================
    // WEBRTC SIGNALING PROXY
    // =========================
    // Offer from A -> forward to B
    socket.on("webrtc-offer", ({ to, from, sdp, username }) => {
      console.log(`🔁 Forwarding OFFER from ${from} to ${to}`);
      io.to(to).emit("webrtc-offer", { from, sdp, username });
    });

    // Answer from B -> forward to A
    socket.on("webrtc-answer", ({ to, from, sdp }) => {
      console.log(`🔁 Forwarding ANSWER from ${from} to ${to}`);
      io.to(to).emit("webrtc-answer", { from, sdp });
    });

    // ICE candidates
    socket.on("webrtc-ice-candidate", ({ to, from, candidate }) => {
      // candidate: RTCIceCandidate-like
      io.to(to).emit("webrtc-ice-candidate", { from, candidate });
    });

    // DISCONNECT
    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.id}`);

      // Remove user from rooms via roomManager
      const roomsLeft = roomManager.removeUserBySocketId(socket.id);
      // notify all rooms about user-left
      (roomsLeft || []).forEach(({ roomId, username }) => {
        io.to(roomId).emit("user-left", { username });
      });
=======
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
>>>>>>> bugfix-working-version
    });

  });
};

const roomManager = require("./roomManager");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");

module.exports = (io) => {

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // 🔐 AUTHENTICATION
    try {
      const rawCookie = socket.handshake.headers.cookie;

      if (!rawCookie) {
        console.log("❌ No cookie found → disconnecting");
        socket.disconnect();
        return;
      }

      const parsed = cookie.parse(rawCookie);
      const token = parsed.token;

      if (!token) {
        console.log("❌ No token found → disconnecting");
        socket.disconnect();
        return;
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      socket.user = decoded;

      console.log("✅ Authenticated:", decoded.email);

    } catch (err) {
      console.log("❌ Auth failed:", err.message);
      socket.disconnect();
      return;
    }

    // ✅ CREATE ROOM
    socket.on("create-room", async ({ roomId, username } = {}) => {
      const finalUsername = username?.trim() || socket.user.username;

      const result = await roomManager.createRoom(
        roomId,
        socket.id,
        finalUsername,
        socket.user.id   // ✅ FIXED
      );

      if (!result.success) {
        socket.emit("error", { message: result.message });
        return;
      }

      socket.join(roomId);

      const data = await roomManager.getRoomData(roomId);

      socket.emit("room-created", { roomId, ...data });
    });

    // ✅ JOIN ROOM
    socket.on("join-room", async ({ roomId, username } = {}) => {
      const finalUsername = username?.trim() || socket.user.username;

      if (!roomId) return;

      const result = await roomManager.joinRoom(
        roomId,
        socket.id,
        finalUsername,
        socket.user.id   // optional but good
      );

      if (!result.success) {
        socket.emit("error", { message: result.message });
        return;
      }

      socket.join(roomId);

      console.log(`✅ [JOIN] ${finalUsername} joined ${roomId}`);

      const data = await roomManager.getRoomData(roomId);

      socket.emit("room-joined", { roomId, ...data });

      socket.to(roomId).emit("user-joined", {
        username: finalUsername,
        socketId: socket.id
      });
    });

    // ✅ CHAT
    socket.on("chat-message", async ({ roomId, message, username }) => {
      const finalUsername = username?.trim() || socket.user.username;

      if (!roomId || !message) return;

      const chatData = {
        userId: socket.user.id,
        username: finalUsername,
        message,
        timestamp: Date.now(),
      };

      await roomManager.addMessage(roomId, chatData);

      io.to(roomId).emit("receive-message", chatData);
    });

    // ✅ CODE
    socket.on("code-change", async ({ roomId, code } = {}) => {
      await roomManager.updateCode(roomId, code);
      socket.to(roomId).emit("code-receive", { code });
    });

    // ✅ LANGUAGE
    socket.on("language-change", async ({ roomId, language } = {}) => {
      const username = socket.user.username;

      await roomManager.updateLanguage(roomId, language);

      socket.to(roomId).emit("language-change", {
        language,
        username
      });
    });

    // ✅ LEAVE
    socket.on("leave-room", async ({ roomId }) => {
      await roomManager.leaveRoom(roomId, socket.id);
    });

    // ✅ DISCONNECT
    socket.on(
  "disconnecting",
  async (reason) => {

    console.log(
      "DISCONNECTING:",
      socket.id,
      reason
    );

    // find rooms before removal
    const joinedRooms =
      [...socket.rooms].filter(
        (room) => room !== socket.id
      );

    await roomManager.removeUserBySocketId(
      socket.id
    );

    // emit ONLY to affected rooms
    joinedRooms.forEach((roomId) => {

      socket.to(roomId).emit(
        "user-left",
        {
          socketId: socket.id
        }
      );
    });
  }
);

    // WebRTC
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
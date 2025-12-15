// backend/src/roomManager.js
class RoomManager {
  constructor() {
    this.rooms = {};
  }

  createRoom(roomId, userId, username, socketId) {
    if (!roomId || !userId) {
      return { success: false, message: "roomId and userId are required" };
    }

    if (this.rooms[roomId]) {
      return { success: false, message: "Room already exists" };
    }

    const room = {
      creator: userId,
      users: [{ userId, username }],
      messages: [],
      code: "",
      language: "javascript", // ✅ PERSIST LANGUAGE
      createdAt: Date.now(),
    };

    this.rooms[roomId] = room;
    console.log(`🏠 Room created: ${roomId}`);
    return { success: true, room };
  }

  joinRoom(roomId, userId, username, socketId) {
    const room = this.rooms[roomId];
    if (!room) return { success: false, message: "Room not found" };

    const exists = room.users.some((u) => u.userId === userId);
    if (!exists) room.users.push({ userId, username });

    return { success: true, room };
  }

  leaveRoom(roomId, userId) {
    const room = this.rooms[roomId];
    if (!room) return { success: false };

    room.users = room.users.filter((u) => u.userId !== userId);
    if (room.users.length === 0) delete this.rooms[roomId];

    return { success: true };
  }

  addMessage(roomId, message) {
    const room = this.rooms[roomId];
    if (!room) return;
    room.messages.push(message);
  }

  updateCode(roomId, code) {
    const room = this.rooms[roomId];
    if (!room) return;
    room.code = code;
  }

  updateLanguage(roomId, language) {
    const room = this.rooms[roomId];
    if (!room) return;
    room.language = language;
    console.log("🌐 language saved:", language);
  }

  getRoomData(roomId) {
    const room = this.rooms[roomId];
    if (!room) return null;

    return {
      users: room.users,
      messages: room.messages,
      code: room.code,
      language: room.language, // ✅ SEND LANGUAGE
    };
  }

  // 🔥🔥🔥 MISSING FUNCTION ADDED — FIXES BACKEND CRASH
  removeUserBySocketId(socketId) {
    let roomsLeft = [];

    for (const roomId in this.rooms) {
      const room = this.rooms[roomId];

      const user = room.users.find((u) => u.socketId === socketId);
      if (user) {
        room.users = room.users.filter((u) => u.socketId !== socketId);

        roomsLeft.push({
          roomId,
          userId: user.userId,
          username: user.username,
        });

        if (room.users.length === 0) {
          delete this.rooms[roomId];
          console.log(`🗑️ Room deleted (empty): ${roomId}`);
        }
      }
    }

    return roomsLeft;
  }
}

module.exports = new RoomManager();

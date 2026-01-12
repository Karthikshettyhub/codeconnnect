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

    this.rooms[roomId] = {
      creator: userId,
      users: [{ userId, username, socketId }],
      messages: [],
      code: "",
      language: "javascript",
      createdAt: Date.now(),
    };

    return { success: true, room: this.rooms[roomId] };
  }

  joinRoom(roomId, userId, username, socketId) {
    const room = this.rooms[roomId];
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    const existingUser = room.users.find(u => u.userId === userId);

    if (existingUser) {
      // 🔥 REFRESH CASE → update socketId
      existingUser.socketId = socketId;
    } else {
      room.users.push({ userId, username, socketId });
    }

    return { success: true, room };
  }

  leaveRoom(roomId, userId) {
    const room = this.rooms[roomId];
    if (!room) return;

    room.users = room.users.filter(u => u.userId !== userId);

    // ✅ DELETE ROOM ONLY ON EXPLICIT LEAVE
    if (room.users.length === 0) {
      delete this.rooms[roomId];
    }
  }

  addMessage(roomId, message) {
    const room = this.rooms[roomId];
    if (room) room.messages.push(message);
  }

  updateCode(roomId, code) {
    const room = this.rooms[roomId];
    if (room) room.code = code;
  }

  updateLanguage(roomId, language) {
    const room = this.rooms[roomId];
    if (room) room.language = language;
  }

  getRoomData(roomId) {
    const room = this.rooms[roomId];
    if (!room) return null;

    return {
      users: room.users,
      messages: room.messages,
      code: room.code,
      language: room.language,
    };
  }

  // 🔥 IMPORTANT CHANGE
  removeUserBySocketId(socketId) {
    for (const roomId in this.rooms) {
      const room = this.rooms[roomId];
      const user = room.users.find(u => u.socketId === socketId);

      if (user) {
        // ❌ DO NOT REMOVE USER ON DISCONNECT
        // Just detach socket
        user.socketId = null;
      }
    }
  }
}

module.exports = new RoomManager();

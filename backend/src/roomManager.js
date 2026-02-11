class RoomManager {
  constructor() {
    this.rooms = {};
  }

  createRoom(roomId, userId, username, socketId, passcode) {
    if (!roomId || !userId) {
      return { success: false, message: "Room ID and Username are required" };
    }

    if (this.rooms[roomId]) {
      return { success: false, message: "Room ID already exists. Try another one." };
    }

    this.rooms[roomId] = {
      creator: userId,
      passcode: passcode || null, // Optional passcode
      users: [{ userId, username, socketId }],
      messages: [],
      code: "",
      language: "javascript",
      createdAt: Date.now(),
    };

    return { success: true, room: this.rooms[roomId] };
  }

  joinRoom(roomId, userId, username, socketId, passcode) {
    const room = this.rooms[roomId];
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    // Passcode check
    if (room.passcode && room.passcode !== passcode) {
      return { success: false, message: "Invalid passcode" };
    }

    const existingUser = room.users.find(u => u.userId === userId || (u.username === username && u.socketId === null));

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

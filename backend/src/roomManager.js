<<<<<<< HEAD
// backend/src/roomManager.js - UPDATED WITH SOCKET FIXES
=======
// backend/src/roomManager.js
>>>>>>> bugfix-working-version
class RoomManager {
  constructor() {
    this.rooms = {};
  }

  createRoom(roomId, userId, username, socketId) {
    if (!roomId || !userId) {
      return { success: false, message: "roomId and userId are required" };
    }

    if (this.rooms[roomId]) {
<<<<<<< HEAD
      return {
        success: false,
        message: "Room already exists",
        room: this.rooms[roomId],
      };
=======
      return { success: false, message: "Room already exists" };
>>>>>>> bugfix-working-version
    }

    const room = {
      creator: userId,
<<<<<<< HEAD
      users: [{ userId, username, socketId }],
      messages: [],
      code: "",
=======
      users: [{ userId, username }],
      messages: [],
      code: "",
      language: "javascript", // ✅ PERSIST LANGUAGE
>>>>>>> bugfix-working-version
      createdAt: Date.now(),
    };

    this.rooms[roomId] = room;
<<<<<<< HEAD

    console.log(`🏠 Room created: ${roomId} by ${username}`);
    return { success: true, message: "Room created", room };
=======
    console.log(`🏠 Room created: ${roomId}`);
    return { success: true, room };
>>>>>>> bugfix-working-version
  }

  joinRoom(roomId, userId, username, socketId) {
    const room = this.rooms[roomId];
    if (!room) return { success: false, message: "Room not found" };

<<<<<<< HEAD
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    const alreadyInRoom = room.users.some((u) => u.userId === userId);
    if (alreadyInRoom) {
      return { success: true, message: "User already in room", room };
    }

    room.users.push({ userId, username, socketId });

    console.log(`🚪 ${username} joined room: ${roomId}`);
    return { success: true, message: "Joined room", room };
=======
    const exists = room.users.some((u) => u.userId === userId);
    if (!exists) room.users.push({ userId, username });

    return { success: true, room };
>>>>>>> bugfix-working-version
  }

  leaveRoom(roomId, userId) {
    const room = this.rooms[roomId];
    if (!room) return { success: false };

<<<<<<< HEAD
    if (!room) {
      return { success: false, message: "Room not found" };
    }

    room.users = room.users.filter((user) => user.userId !== userId);

    if (room.users.length === 0) {
      delete this.rooms[roomId];
      console.log(`🗑️ Room deleted (empty): ${roomId}`);
      return {
        success: true,
        message: "User left. Room deleted as it became empty.",
      };
    }

    console.log(`👋 User left room: ${roomId}`);
    return { success: true, message: "User left the room successfully." };
  }

  getRoomUsers(roomId) {
    const room = this.rooms[roomId];

    if (!room) {
      return { success: false, message: "Room not found", users: [] };
    }

    return { success: true, users: room.users };
  }

  addMessage(roomId, messageData) {
    const room = this.rooms[roomId];

    if (!room) {
      return { success: false, message: "Room not found" };
    }

    room.messages.push(messageData);

    if (room.messages.length > 100) {
      room.messages.shift();
    }

    console.log(`💬 [${roomId}] Message added (total: ${room.messages.length})`);
    return { success: true };
  }

  getMessages(roomId) {
=======
    room.users = room.users.filter((u) => u.userId !== userId);
    if (room.users.length === 0) delete this.rooms[roomId];

    return { success: true };
  }

  addMessage(roomId, message) {
>>>>>>> bugfix-working-version
    const room = this.rooms[roomId];
    if (!room) return;
    room.messages.push(message);
  }

  updateCode(roomId, code) {
    const room = this.rooms[roomId];
<<<<<<< HEAD

    if (!room) {
      return { success: false, message: "Room not found" };
    }

=======
    if (!room) return;
>>>>>>> bugfix-working-version
    room.code = code;
  }

<<<<<<< HEAD
  getCode(roomId) {
    const room = this.rooms[roomId];

    if (!room) {
      return { success: false, code: "" };
    }

    return { success: true, code: room.code };
=======
  updateLanguage(roomId, language) {
    const room = this.rooms[roomId];
    if (!room) return;
    room.language = language;
    console.log("🌐 language saved:", language);
>>>>>>> bugfix-working-version
  }

  getRoomData(roomId) {
    const room = this.rooms[roomId];
<<<<<<< HEAD

    if (!room) {
      return { success: false, message: "Room not found" };
    }

    return {
      success: true,
      data: {
        users: room.users,
        messages: room.messages,
        code: room.code,
      },
=======
    if (!room) return null;

    return {
      users: room.users,
      messages: room.messages,
      code: room.code,
      language: room.language, // ✅ SEND LANGUAGE
>>>>>>> bugfix-working-version
    };
  }

  // 🔥🔥🔥 MISSING FUNCTION ADDED — FIXES BACKEND CRASH
  removeUserBySocketId(socketId) {
    let roomsLeft = [];

    for (const roomId in this.rooms) {
      const room = this.rooms[roomId];

      const user = room.users.find((u) => u.socketId === socketId);
      if (user) {
        // Remove user
        room.users = room.users.filter((u) => u.socketId !== socketId);

        roomsLeft.push({ roomId, userId: user.userId, username: user.username });

        // Delete room if empty
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

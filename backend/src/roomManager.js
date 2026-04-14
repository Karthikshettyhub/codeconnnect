class RoomManager {
  constructor() {
    // All active rooms stored by roomId
    this.rooms = {};
  }


  // ── CREATE ROOM ───────────────────────────────────────────────
  // Called when a user starts a new room
  createRoom(roomId, socketId, username, passcode) {
    if (!roomId || !socketId || !username) {
      return { success: false, message: "Room ID and username are required." };
    }

    const room = this.rooms[roomId];

    if (room) {
      // UPDATED: Check if room is a ghost room
      const allOffline = room.users.every((u) => u.socketId === null);
      if (allOffline) {
        delete this.rooms[roomId];
      } else {
        return { success: false, message: "Room already exists" };
      }
    }

    this.rooms[roomId] = {
      createdBy: socketId,
      passcode: passcode || null,
      users: [{ socketId, username }],
      messages: [],
      code: "",
      language: "javascript",
      createdAt: Date.now(),
    };

    return { success: true };
  }


  // ── JOIN ROOM ─────────────────────────────────────────────────
  // Called when a user joins an existing room
  joinRoom(roomId, socketId, username, passcode) {
    const room = this.rooms[roomId];

    if (!room) {
      return { success: false, message: "Room not found" };
    }

    // UPDATED: Check for ghost room before joining
    const allOffline = room.users.every((u) => u.socketId === null);
    if (allOffline) {
      delete this.rooms[roomId];
      return { success: false, message: "Room expired" };
    }

    if (room.passcode && room.passcode !== passcode) {
      return { success: false, message: "Invalid passcode." };
    }

    // If same username is already in the room with no socket (disconnected),
    // reconnect them instead of adding a duplicate
    const disconnectedUser = room.users.find(
      u => u.username === username && u.socketId === null
    );

    if (disconnectedUser) {
      disconnectedUser.socketId = socketId;
    } else {
      room.users.push({ socketId, username });
    }

    return { success: true };
  }


  // UPDATED
  leaveRoom(roomId, socketId) {
    if (socketId !== null) {
      const room = this.rooms[roomId];
      if (room) {
        room.users = room.users.filter((u) => u.socketId !== socketId);
      }
    }

    const room = this.rooms[roomId];

    if (room) {
      const allOffline = room.users.every((u) => u.socketId === null);
      if (allOffline) {
        delete this.rooms[roomId];
        console.log(`[CLEANUP] Room "${roomId}" was DELETED from memory.`);
        return true;
      }
    }

    return false;
  }

  // ADDED
  getRoomUsers(roomId) {
    return this.rooms[roomId]?.users || null;
  }


  // ── ADD MESSAGE ───────────────────────────────────────────────
  // Saves a chat message to the room's message history
  addMessage(roomId, message) {
    const room = this.rooms[roomId];
    if (room) room.messages.push(message);
  }


  // ── UPDATE CODE ───────────────────────────────────────────────
  // Saves the latest code from the shared editor
  updateCode(roomId, code) {
    const room = this.rooms[roomId];
    if (room) room.code = code;
  }


  // ── UPDATE LANGUAGE ───────────────────────────────────────────
  // Updates which programming language the editor is set to
  updateLanguage(roomId, language) {
    const room = this.rooms[roomId];
    if (room) room.language = language;
  }


  // ── GET ROOM DATA ─────────────────────────────────────────────
  // Returns the safe public data for a room (no passcode exposed)
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


  // UPDATED
  removeUserBySocketId(socketId) {
    const affectedRooms = [];
    for (const roomId in this.rooms) {
      const room = this.rooms[roomId];
      const user = room.users.find((u) => u.socketId === socketId);

      if (user) {
        const username = user.username;
        user.socketId = null; // Mark as offline (keep for reconnection)
        console.log(`User "${username}" went offline in room "${roomId}"`);
        affectedRooms.push({ roomId, username });
      }
    }
    return affectedRooms;
  }
}

module.exports = new RoomManager();
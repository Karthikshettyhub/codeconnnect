const fs = require("fs");
const path = require("path");

class RoomManager {
  constructor() {
    this.filePath = path.join(__dirname, "rooms.json");
    try {
      if (fs.existsSync(this.filePath)) {
        const data = fs.readFileSync(this.filePath, "utf-8");
        this.rooms = JSON.parse(data);
        console.log("✅ [BACKEND] rooms.json loaded.");
      } else {
        this.rooms = {};
      }
    } catch (err) {
      this.rooms = {};
    }
  }

  saveRooms() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.rooms, null, 2));
    } catch (err) {}
  }

  // ALWAYS SUCCESS: Create if missing, Join if exists
  createRoom(roomId, socketId, username, passcode) {
    console.log("CREATE ATTEMPT:", roomId, username);
    
    // If room exists, treat as join
    if (this.rooms[roomId]) {
      return this.joinRoom(roomId, socketId, username, passcode);
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

    this.saveRooms();
    console.log("ROOM CREATED:", roomId);
    return { success: true };
  }

  // ALWAYS SUCCESS: Auto-create missing rooms
  joinRoom(roomId, socketId, username, passcode) {
    console.log("JOIN ATTEMPT:", roomId, username);
    
    if (!this.rooms[roomId]) {
      console.log("🔄 AUTO-CREATING MISSING ROOM:", roomId);
      this.rooms[roomId] = {
        createdBy: "system",
        passcode: passcode || null,
        users: [],
        messages: [],
        code: "",
        language: "javascript",
        createdAt: Date.now(),
      };
    }

    const room = this.rooms[roomId];

    // Check passcode only if it exists
    if (room.passcode && room.passcode !== passcode) {
       return { success: false, message: "Invalid passcode." };
    }

    // Mark as online
    const user = room.users.find(u => u.username === username);
    if (user) {
      user.socketId = socketId;
    } else {
      room.users.push({ socketId, username });
    }

    this.saveRooms();
    console.log("JOIN SUCCESS:", roomId, username);
    return { success: true };
  }

  // DISCONNECT: Mark offline but NEVER delete
  removeUserBySocketId(socketId) {
    for (const roomId in this.rooms) {
      const room = this.rooms[roomId];
      const user = room.users.find((u) => u.socketId === socketId);
      if (user) {
        user.socketId = null;
        console.log("OFFLINE:", user.username, "in", roomId);
        this.saveRooms();
      }
    }
  }

  // EXPLICIT LEAVE: Just mark offline or ignore for now to keep rooms alive
  leaveRoom(roomId, socketId) {
    const room = this.rooms[roomId];
    if (room) {
      const user = room.users.find(u => u.socketId === socketId);
      if (user) user.socketId = null;
    }
    this.saveRooms();
    return true;
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

  addMessage(roomId, message) {
    if (this.rooms[roomId]) {
      this.rooms[roomId].messages.push(message);
      this.saveRooms();
    }
  }

  updateCode(roomId, code) {
    if (this.rooms[roomId]) {
      this.rooms[roomId].code = code;
      this.saveRooms();
    }
  }

  updateLanguage(roomId, language) {
    if (this.rooms[roomId]) {
      this.rooms[roomId].language = language;
      this.saveRooms();
    }
  }

  addMessage(roomId, message) {
    if (this.rooms[roomId]) {
      this.rooms[roomId].messages.push(message);
      this.saveRooms();
    }
  }
}

module.exports = new RoomManager();
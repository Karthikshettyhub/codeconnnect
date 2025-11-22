// backend/src/roomManager.js - UPDATED WITH STORAGE
class RoomManager {
  constructor() {
    // Store all rooms with messages and code
    this.rooms = {};
  }

  createRoom(roomId, userId, username) {
    if (!roomId || !userId) {
      return { success: false, message: 'roomId and userId are required' };
    }

    if (this.rooms[roomId]) {
      return {
        success: false,
        message: 'Room already exists',
        room: this.rooms[roomId],
      };
    }

    // 🔥 NEW: Add messages and code storage
    const room = {
      creator: userId,
      users: [{ userId, username }],
      messages: [],        // 🔥 Store messages
      code: '',           // 🔥 Store current code
      createdAt: Date.now(),
    };

    this.rooms[roomId] = room;

    console.log(`🏠 Room created: ${roomId} by ${username}`);
    return { success: true, message: 'Room created', room };
  }

  joinRoom(roomId, userId, username) {
    const room = this.rooms[roomId];

    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    const alreadyInRoom = room.users.some(u => u.userId === userId);
    if (alreadyInRoom) {
      return { success: true, message: 'User already in room', room };
    }

    room.users.push({ userId, username });

    console.log(`🚪 ${username} joined room: ${roomId}`);
    return { success: true, message: 'Joined room', room };
  }

  leaveRoom(roomId, userId) {
    const room = this.rooms[roomId];

    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    room.users = room.users.filter(user => user.userId !== userId);

    // If room becomes empty, delete it
    if (room.users.length === 0) {
      delete this.rooms[roomId];
      console.log(`🗑️ Room deleted (empty): ${roomId}`);
      return {
        success: true,
        message: 'User left. Room deleted as it became empty.',
      };
    }

    console.log(`👋 User left room: ${roomId}`);
    return { success: true, message: 'User left the room successfully.' };
  }

  getRoomUsers(roomId) {
    const room = this.rooms[roomId];

    if (!room) {
      return { success: false, message: 'Room not found', users: [] };
    }

    return { success: true, users: room.users };
  }

  // 🔥 NEW: Add message to room
  addMessage(roomId, messageData) {
    const room = this.rooms[roomId];

    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    room.messages.push(messageData);

    // Keep only last 100 messages
    if (room.messages.length > 100) {
      room.messages.shift();
    }

    console.log(`💬 [${roomId}] Message added (total: ${room.messages.length})`);
    return { success: true };
  }

  // 🔥 NEW: Get room messages
  getMessages(roomId) {
    const room = this.rooms[roomId];

    if (!room) {
      return { success: false, messages: [] };
    }

    return { success: true, messages: room.messages };
  }

  // 🔥 NEW: Update room code
  updateCode(roomId, code) {
    const room = this.rooms[roomId];

    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    room.code = code;
    console.log(`📝 [${roomId}] Code updated (${code.length} chars)`);
    return { success: true };
  }

  // 🔥 NEW: Get room code
  getCode(roomId) {
    const room = this.rooms[roomId];

    if (!room) {
      return { success: false, code: '' };
    }

    return { success: true, code: room.code };
  }

  // 🔥 NEW: Get complete room data
  getRoomData(roomId) {
    const room = this.rooms[roomId];

    if (!room) {
      return { success: false, message: 'Room not found' };
    }

    return {
      success: true,
      data: {
        users: room.users,
        messages: room.messages,
        code: room.code
      }
    };
  }
}

module.exports = new RoomManager();
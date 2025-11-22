// backend/src/socketHandler.js - FINAL VERSION WITH PERSISTENCE + FIXES
const roomManager = require('./roomManager');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.id}`);

    // ========================================
    // CREATE ROOM
    // ========================================
    socket.on('create-room', ({ roomId, username }) => {
      const result = roomManager.createRoom(roomId, socket.id, username);

      if (result.success) {
        socket.join(roomId);

        socket.emit('room-created', {
          roomId,
          users: result.room.users,
          messages: result.room.messages,
          code: result.room.code
        });

        console.log(`🏠 Room created: ${roomId}`);
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // ========================================
    // JOIN ROOM
    // ========================================
    socket.on('join-room', ({ roomId, username }) => {
      const result = roomManager.joinRoom(roomId, socket.id, username);

      if (!result.success) {
        socket.emit('error', { message: result.message });
        return;
      }

      socket.join(roomId);

      // 🔥 Get stored room data
      const roomData = roomManager.getRoomData(roomId);

      // 🔥 Send full saved data ONLY to the joining user
      socket.emit('room-joined', {
        roomId,
        users: roomData.data.users,
        messages: roomData.data.messages,
        code: roomData.data.code
      });

      // 🔥 Notify others + send updated user list
      socket.to(roomId).emit('user-joined', {
        username,
        users: roomData.data.users
      });

      console.log(`🚪 ${username} joined ${roomId}`);
    });

    // ========================================
    // LEAVE ROOM
    // ========================================
    socket.on('leave-room', ({ roomId, username }) => {
      const result = roomManager.leaveRoom(roomId, socket.id);

      socket.leave(roomId);

      if (result.success) {
        socket.to(roomId).emit('user-left', { username });

        // 🔥 Send updated user list after leaving
        const updated = roomManager.getRoomUsers(roomId);
        socket.to(roomId).emit('users-updated', updated.users);

        console.log(`👋 ${username} left ${roomId}`);
      }
    });

    // ========================================
    // CHAT MESSAGE
    // ========================================
    socket.on('chat-message', ({ roomId, username, message }) => {
      const messageData = {
        username,
        message,
        timestamp: Date.now(),
        isSystem: false
      };

      // 🔥 Store message history
      roomManager.addMessage(roomId, messageData);

      io.to(roomId).emit('receive-message', messageData);

      console.log(`💬 [${roomId}] ${username}: ${message}`);
    });

    // ========================================
    // CODE SYNC WITH PERSISTENCE
    // ========================================
    socket.on('code-change', ({ roomId, code }) => {
      // 🔥 Save latest code to memory
      roomManager.updateCode(roomId, code);

      // 🔥 Send ONLY to other clients
      socket.to(roomId).emit('code-receive', { code });

      // no console spam → uncomment if needed
      // console.log(`📝 Updated code in ${roomId}`);
    });

    // ========================================
    // VOICE CHAT EVENTS
    // ========================================
    socket.on('voice-start', ({ roomId, username }) => {
      socket.to(roomId).emit('voice-start', { username });
    });

    socket.on('voice-chunk', ({ roomId, username, chunk }) => {
      socket.to(roomId).emit('voice-chunk', { username, chunk });
    });

    socket.on('voice-stop', ({ roomId, username }) => {
      socket.to(roomId).emit('voice-stop', { username });
    });

    // ========================================
    // DISCONNECT
    // ========================================
    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.id}`);
    });
  });
};

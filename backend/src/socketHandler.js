const roomManager = require('./roomManager');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // EVENT 1: CREATE ROOM
    socket.on('create-room', ({ roomId, username }) => {
      console.log(`${username} requested to create room: ${roomId}`);

      const result = roomManager.createRoom(roomId, socket.id, username);

      if (result.success) {
        socket.join(roomId);
        socket.emit('room-created', {
          roomId,
          username,
          users: result.room.users,
        });
        console.log(`Room created: ${roomId} by ${username}`);
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // EVENT 2: JOIN ROOM
    socket.on('join-room', ({ roomId, username }) => {
      console.log(`${username} requested to join room: ${roomId}`);

      const result = roomManager.joinRoom(roomId, socket.id, username);

      if (result.success) {
        socket.join(roomId);
        socket.emit('room-joined', {
          roomId,
          users: result.room.users,
        });
        socket.to(roomId).emit('user-joined', { username });
        console.log(`${username} joined room ${roomId}`);
      } else {
        socket.emit('error', { message: result.message });
      }
    });

    // EVENT 3: SEND MESSAGE
    socket.on('send-message', ({ roomId, username, message }) => {
      console.log(`Message in ${roomId} from ${username}: ${message}`);

      io.to(roomId).emit('receive-message', {
        username,
        message,
        timestamp: Date.now(),
      });
    });

    // EVENT 4: LEAVE ROOM
    socket.on('leave-room', ({ roomId, username }) => {
      console.log(`${username} leaving room: ${roomId}`);

      const result = roomManager.leaveRoom(roomId, socket.id);

      socket.leave(roomId);
      socket.to(roomId).emit('user-left', { username });
      console.log(`${username} left room ${roomId}`);

      if (result.message.includes('Room deleted')) {
        console.log(`Room ${roomId} deleted as it became empty.`);
      }
    });

    // EVENT 5: DISCONNECT
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      // Optional: track room memberships for cleanup if needed
    });
  });
};

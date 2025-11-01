// src/roomManager.js

class RoomManager {
    constructor() {
      // Store all rooms as { roomId: { creator, users, createdAt } }
      this.rooms = {};
    }
  
    createRoom(roomId, userId, username) {
      if (!roomId || !userId) {
        return { success: false, message: 'roomId and userId are required' };
      }
  
      if (this.rooms[roomId]) {
        // Room already exists — do not overwrite
        return {
          success: false,
          message: 'Room already exists',
          room: this.rooms[roomId],
        };
      }
  
      const room = {
        creator: userId,
        users: [{ userId, username }],
        createdAt: Date.now(),
      };
  
      this.rooms[roomId] = room;
  
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
  
      return { success: true, message: 'Joined room', room };
    }
  
    leaveRoom(roomId, userId) {
      const room = this.rooms[roomId];
  
      // Check if room exists
      if (!room) {
        return { success: false, message: 'Room not found' };
      }
  
      // Filter out the user leaving
      room.users = room.users.filter(user => user.userId !== userId);
  
      // If room becomes empty, delete it
      if (room.users.length === 0) {
        delete this.rooms[roomId];
        return {
          success: true,
          message: 'User left. Room deleted as it became empty.',
        };
      }
  
      // Otherwise, return success
      return { success: true, message: 'User left the room successfully.' };
    }
  
    getRoomUsers(roomId) {
      const room = this.rooms[roomId];
  
      // Room doesn’t exist
      if (!room) {
        return { success: false, message: 'Room not found', users: [] };
      }
  
      // Return list of users
      return { success: true, users: room.users };
    }
  }
  
  module.exports = new RoomManager();
  
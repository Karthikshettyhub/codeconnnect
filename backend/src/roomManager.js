// src/roomManager.js

class RoomManager {
    constructor() {
      // TODO: Initialize a structure to store rooms
      // Think: What data do we need for each room?
      // - Room ID
      // - Users in room (array)
      // - Maybe room creator?
    }
  
    createRoom(roomId, userId, username) {
      // TODO: Create a new room
      // What should happen if room already exists?
    }
  
    joinRoom(roomId, userId, username) {
      // TODO: Add user to existing room
      // What if room doesn't exist?
    }
  
    leaveRoom(roomId, userId) {
      // TODO: Remove user from room
      // What if room becomes empty?
    }
  
    getRoomUsers(roomId) {
      // TODO: Return all users in a room
    }
  }
  
  module.exports = new RoomManager();
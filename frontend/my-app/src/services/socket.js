// src/services/socket.js
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL);
      
      this.socket.on('connect', () => {
        console.log('Connected to server:', this.socket.id);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });
    }
    return this.socket;
  }

  createRoom(roomId, username) {
    this.socket.emit('create-room', { roomId, username });
  }

  joinRoom(roomId, username) {
    this.socket.emit('join-room', { roomId, username });
  }

  sendMessage(roomId, username, message) {
    this.socket.emit('send-message', { roomId, username, message });
  }

  leaveRoom(roomId, username) {
    this.socket.emit('leave-room', { roomId, username });
  }

  // Event listeners
  onRoomCreated(callback) {
    this.socket.on('room-created', callback);
  }

  onRoomJoined(callback) {
    this.socket.on('room-joined', callback);
  }

  onUserJoined(callback) {
    this.socket.on('user-joined', callback);
  }

  onUserLeft(callback) {
    this.socket.on('user-left', callback);
  }

  onReceiveMessage(callback) {
    this.socket.on('receive-message', callback);
  }

  onError(callback) {
    this.socket.on('error', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();
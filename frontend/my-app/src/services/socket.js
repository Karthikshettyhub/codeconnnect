// frontend/src/services/socket.js

import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5001";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (!this.socket) {
      this.socket = io(SOCKET_URL, {
        transports: ["websocket"],
      });
    }
    return this.socket;
  }

  // ROOM EVENTS
  createRoom(roomId, username) {
    this.socket.emit("create-room", { roomId, username });
  }

  joinRoom(roomId, username) {
    this.socket.emit("join-room", { roomId, username });
  }

  leaveRoom(roomId, username) {
    this.socket.emit("leave-room", { roomId, username });
  }

  onRoomCreated(cb) { this.socket.on("room-created", cb); }
  onRoomJoined(cb) { this.socket.on("room-joined", cb); }
  onUserJoined(cb) { this.socket.on("user-joined", cb); }
  onUserLeft(cb) { this.socket.on("user-left", cb); }

  // CHAT EVENTS
  sendMessage(roomId, username, message) {
    this.socket.emit("send-message", { roomId, username, message });
  }

  onReceiveMessage(cb) {
    this.socket.on("receive-message", cb);
  }

  // CODE SYNC
  sendCode(roomId, code) {
    this.socket.emit("code-send", { roomId, code });
  }

  onCodeReceive(cb) {
    this.socket.on("code-receive", cb);
  }

  // ========= 🎤 VOICE EVENTS =========

  sendVoiceStart(roomId, username) {
    this.socket.emit("voice-start", { roomId, username });
  }

  sendVoiceChunk(roomId, username, chunk) {
    this.socket.emit("voice-chunk", { roomId, username, chunk });
  }

  sendVoiceStop(roomId, username) {
    this.socket.emit("voice-stop", { roomId, username });
  }

  onVoiceStart(cb) { this.socket.on("voice-start", cb); }
  onVoiceChunk(cb) { this.socket.on("voice-chunk", cb); }
  onVoiceStop(cb) { this.socket.on("voice-stop", cb); }

  // ERRORS
  onError(cb) { this.socket.on("error", cb); }

  disconnect() {
    this.socket.disconnect();
    this.socket = null;
  }
}

export default new SocketService();

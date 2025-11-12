// src/services/socket.js
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

      this.socket.on("connect", () => {
        console.log("✅ Connected to server:", this.socket.id);
      });

      this.socket.on("disconnect", () => {
        console.log("❌ Disconnected from server");
      });
    }
    return this.socket;
  }

  // -------------------- ROOM EVENTS --------------------
  createRoom(roomId, username) {
    this.socket?.emit("create-room", { roomId, username });
  }

  joinRoom(roomId, username) {
    this.socket?.emit("join-room", { roomId, username });
  }

  leaveRoom(roomId, username) {
    this.socket?.emit("leave-room", { roomId, username });
  }

  onRoomCreated(callback) {
    this.socket?.on("room-created", callback);
  }

  onRoomJoined(callback) {
    this.socket?.on("room-joined", callback);
  }

  onUserJoined(callback) {
    this.socket?.on("user-joined", callback);
  }

  onUserLeft(callback) {
    this.socket?.on("user-left", callback);
  }

  // -------------------- CHAT EVENTS --------------------
  sendMessage(roomId, username, message) {
    this.socket?.emit("send-message", { roomId, username, message });
  }

  onReceiveMessage(callback) {
    this.socket?.on("receive-message", callback);
  }

  // -------------------- CODE SYNC EVENTS --------------------
  sendCode(roomId, code) {
    this.socket?.emit("code-send", { roomId, code });
  }

  onCodeReceive(callback) {
    this.socket?.on("code-receive", callback);
  }

  // -------------------- ERRORS --------------------
  onError(callback) {
    this.socket?.on("error", callback);
  }

  // -------------------- DISCONNECT --------------------
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log("🔌 Socket disconnected & reset");
    }
  }
}

export default new SocketService();

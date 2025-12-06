// frontend/src/services/socket.js - WITH LANGUAGE SYNC + RUN CODE
import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) {
      console.log("⚠️ Socket already connected:", this.socket.id);
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";
    
    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("🟢 Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ Socket Connection Error:", error.message);
    });
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    console.log("🔌 Socket connection closed manually");
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  // ============================
  // EMIT EVENTS
  // ============================
  createRoom(roomId, username) {
    this.socket?.emit("create-room", { roomId, username });
  }

  joinRoom(roomId, username) {
    this.socket?.emit("join-room", { roomId, username });
  }

  leaveRoom(roomId, username) {
    this.socket?.emit("leave-room", { roomId, username });
  }

  sendMessage(roomId, username, message) {
    this.socket?.emit("chat-message", { roomId, username, message });
  }

  sendCode(roomId, code) {
    this.socket?.emit("code-change", { roomId, code });
  }

  // 🔥 NEW: Send language change
  sendLanguageChange(roomId, language) {
    this.socket?.emit("language-change", { roomId, language });
  }

  // 🔥 NEW: Send run code request
  sendRunCode(roomId, code, language, input) {
    this.socket?.emit("run-code", { roomId, code, language, input });
  }

  sendVoiceChunk(roomId, username, chunk) {
    this.socket?.emit("voice-chunk", { roomId, username, chunk });
  }

  sendVoiceStart(roomId, username) {
    this.socket?.emit("voice-start", { roomId, username });
  }

  sendVoiceStop(roomId, username) {
    this.socket?.emit("voice-stop", { roomId, username });
  }

  // ============================
  // LISTENERS
  // ============================
  listen(event, callback) {
    this.socket?.off(event);
    this.socket?.on(event, callback);
  }

  onRoomCreated(callback) {
    this.listen("room-created", callback);
  }

  onRoomJoined(callback) {
    this.listen("room-joined", callback);
  }

  onUserJoined(callback) {
    this.listen("user-joined", callback);
  }

  onUserLeft(callback) {
    this.listen("user-left", callback);
  }

  onReceiveMessage(callback) {
    this.listen("receive-message", callback);
  }

  onCodeReceive(callback) {
    this.listen("code-receive", callback);
  }

  // 🔥 NEW: Listen for language changes
  onLanguageReceive(callback) {
    this.listen("language-receive", callback);
  }

  // 🔥 NEW: Listen for code output
  onCodeOutput(callback) {
    this.listen("code-output", callback);
  }

  onError(callback) {
    this.listen("error", callback);
  }

  onVoiceChunk(callback) {
    this.listen("voice-chunk", callback);
  }

  onVoiceStart(callback) {
    this.listen("voice-start", callback);
  }

  onVoiceStop(callback) {
    this.listen("voice-stop", callback);
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

const socketService = new SocketService();
export default socketService;
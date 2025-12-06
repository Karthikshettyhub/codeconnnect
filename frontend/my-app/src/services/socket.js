// frontend/src/services/socket.js
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

    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

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

  // =================== EMIT EVENTS ===================

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

  sendLanguage(roomId, language, username) {
    this.socket?.emit("language-change", { roomId, language, username });
  }

  sendRunCode(roomId, code, language, input) {
    this.socket?.emit("run-code", { roomId, code, language, input });
  }

  // =================== LISTENERS ===================

  listen(event, callback) {
    this.socket?.off(event);
    this.socket?.on(event, callback);
  }

  onRoomCreated(cb) {
    this.listen("room-created", cb);
  }
  onRoomJoined(cb) {
    this.listen("room-joined", cb);
  }
  onUserJoined(cb) {
    this.listen("user-joined", cb);
  }
  onUserLeft(cb) {
    this.listen("user-left", cb);
  }
  onReceiveMessage(cb) {
    this.listen("receive-message", cb);
  }
  onCodeReceive(cb) {
    this.listen("code-receive", cb);
  }

  onLanguageReceive(cb) {
    this.listen("language-receive", cb);
  }

  onError(cb) {
    this.listen("error", cb);
  }
}

const socketService = new SocketService();
export default socketService;

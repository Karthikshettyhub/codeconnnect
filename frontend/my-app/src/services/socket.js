// frontend/src/services/socket.js
import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) {
      console.log("✅ Socket already connected");
      return;
    }

    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5005";
    
    console.log("🔌 Connecting to:", SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
      forceNew: false,
    });

    this.socket.on("connect", () => {
      console.log("🟢 Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("🔴 Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.log("❌ Connection error:", error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  createRoom(roomId, username) {
    console.log("📤 EMITTING create-room:", { roomId, username, connected: this.socket?.connected });
    
    if (!this.socket) {
      console.log("❌ Socket not initialized");
      return;
    }

    if (!this.socket.connected) {
      console.log("⚠️ Socket not connected, waiting...");
      this.socket.once("connect", () => {
        console.log("✅ Connected, now emitting create-room");
        this.socket.emit("create-room", { roomId, username });
      });
      return;
    }

    this.socket.emit("create-room", { roomId, username });
  }

  joinRoom(roomId, username) {
    console.log("📤 EMITTING join-room:", { roomId, username, connected: this.socket?.connected });
    
    if (!this.socket) {
      console.log("❌ Socket not initialized");
      return;
    }

    if (!this.socket.connected) {
      console.log("⚠️ Socket not connected, waiting...");
      this.socket.once("connect", () => {
        console.log("✅ Connected, now emitting join-room");
        this.socket.emit("join-room", { roomId, username });
      });
      return;
    }

    this.socket.emit("join-room", { roomId, username });
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
    if (!roomId || !language || !username) return;
    this.socket?.emit("language-change", { roomId, language, username });
  }

  listen(event, cb) {
    this.socket?.off(event);
    this.socket?.on(event, cb);
  }

  onRoomCreated(cb) {
    this.listen("room-created", cb);
  }

  onRoomJoined(cb) {
    this.listen("room-joined", cb);
  }

  onReceiveMessage(cb) {
    this.listen("receive-message", cb);
  }

  onCodeReceive(cb) {
    this.listen("code-receive", cb);
  }

  onLanguageChange(cb) {
    this.listen("language-change", cb);
  }

  onError(cb) {
    this.listen("error", cb);
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }

  emit(event, data) {
    this.socket?.emit(event, data);
  }

  onWebRTCOffer(cb) {
    this.listen("webrtc-offer", cb);
  }

  onWebRTCAnswer(cb) {
    this.listen("webrtc-answer", cb);
  }

  onWebRTCIce(cb) {
    this.listen("webrtc-ice", cb);
  }
}

export default new SocketService();
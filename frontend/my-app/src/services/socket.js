import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
  }

  // =====================
  // CONNECT
  // =====================
  connect() {
    if (this.socket?.connected) {
      console.log("✅ Socket already connected");
      return;
    }

    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5005";

    console.log("🔌 Connecting to:", SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
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
      console.error("❌ Socket connection error:", error.message);
    });
  }

  // =====================
  // DISCONNECT
  // =====================
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // =====================
  // EMIT EVENTS
  // =====================
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
    if (!roomId || !language || !username) return;
    this.socket?.emit("language-change", { roomId, language, username });
  }

  emit(event, data) {
    this.socket?.emit(event, data);
  }

  // =====================
  // LISTENERS
  // =====================
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

  onReceiveMessage(callback) {
    this.listen("receive-message", callback);
  }

  onCodeReceive(callback) {
    this.listen("code-receive", callback);
  }

  onLanguageChange(callback) {
    this.listen("language-change", callback);
  }

  onWebRTCOffer(callback) {
    this.listen("webrtc-offer", callback);
  }

  onWebRTCAnswer(callback) {
    this.listen("webrtc-answer", callback);
  }

  onWebRTCIce(callback) {
    this.listen("webrtc-ice", callback);
  }

  onError(callback) {
    this.listen("error", callback);
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export default new SocketService();

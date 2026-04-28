import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) return;
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5005";

    this.socket = io(BACKEND_URL, {
      transports: ["polling", "websocket"], // fallback first
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
  });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });
  }

  // FIX 1: added waitForConnection helper

  // socket.io connect() is async — if user clicks "Create Room" before
  // handshake completes, emit fires into void silently. this waits for it.
  waitForConnection() {
    return new Promise((resolve) => {
      if (this.socket?.connected) return resolve();
      this.socket.once("connect", resolve);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // FIX 1 applied: await connection before emitting
  async createRoom(roomId, username, passcode) {
    await this.waitForConnection();
    this.socket.emit("create-room", { roomId, username, passcode });
  }

  // FIX 1 applied: await connection before emitting
  async joinRoom(roomId, username, passcode) {
    await this.waitForConnection();
    this.socket.emit("join-room", { roomId, username, passcode });
  }

  leaveRoom(roomId, username) {
    this.socket?.emit("leave-room", { roomId, username });
  }

  async sendMessage(roomId, username, message) {
    await this.waitForConnection();
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

  listen(event, callback) {
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

  onUserJoined(callback) {
    this.listen("user-joined", callback);
  }

  onUserLeft(callback) {
    this.listen("user-left", callback);
  }

  onCodeReceive(callback) {
    this.listen("code-receive", callback);
  }

  onLanguageChange(callback) {
    this.listen("language-change", callback);
  }

  onError(callback) {
    this.listen("error", callback);
  }

  // FIX 3: removed unused WebRTC listener methods (onWebRTCOffer, onWebRTCAnswer, onWebRTCIce)
  // they were dead code — not used anywhere in the app

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
}

export default new SocketService();
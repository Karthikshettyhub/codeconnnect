// frontend/src/services/socket.js
import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) return;

    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5005";

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

    this.socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
    });
  }

  disconnect() {
    this.socket?.disconnect();
  }

  // ============ EMITS ============
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

  // ✅ ADD ONLY THIS
  sendLanguage(roomId, language, username) {
    if (!roomId || !language || !username) return;
    this.socket?.emit("language-change", { roomId, language, username });
  }

  // ============ LISTENERS ============
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

  // ✅ ADD ONLY THIS
  onLanguageChange(cb) {
    this.listen("language-change", cb);
  }

  removeAllListeners() {
    this.socket?.removeAllListeners();
  }
  onError(callback) {
    this.listen("error", callback);
  }
  // ADD AT BOTTOM
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

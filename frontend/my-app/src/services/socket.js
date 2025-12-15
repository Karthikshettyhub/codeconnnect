// frontend/src/services/socket.js
import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {
    if (this.socket?.connected) return;

<<<<<<< HEAD
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5005";
=======
    const SOCKET_URL =
      import.meta.env.VITE_SOCKET_URL || "http://localhost:5005";
>>>>>>> bugfix-working-version

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
<<<<<<< HEAD
    if (!this.socket) return;
    if (this.socket.connected || this.socket._connected) {
      this.socket.disconnect();
      console.log("🔌 Socket connection closed manually");
    }
  }

  isConnected() {
    return this.socket?.connected || false;
  }

  // emits...
=======
    this.socket?.disconnect();
  }

  // ============ EMITS ============
>>>>>>> bugfix-working-version
  createRoom(roomId, username) {
    this.socket?.emit("create-room", { roomId, username });
  }
  joinRoom(roomId, username) {
    this.socket?.emit("join-room", { roomId, username });
  }
  leaveRoom(roomId, username) {
    this.socket?.emit("leave-room", { roomId, username });
  }
<<<<<<< HEAD
=======

>>>>>>> bugfix-working-version
  sendMessage(roomId, username, message) {
    this.socket?.emit("chat-message", { roomId, username, message });
  }
  sendCode(roomId, code) {
    this.socket?.emit("code-change", { roomId, code });
  }
<<<<<<< HEAD
  sendLanguage(roomId, language, username) {
    this.socket?.emit("language-change", { roomId, language, username });
  }
  sendRunCode(roomId, code, language, input) {
    this.socket?.emit("run-code", { roomId, code, language, input });
  }

  listen(event, callback) {
=======

  // ✅ ADD ONLY THIS
  sendLanguage(roomId, language, username) {
    if (!roomId || !language || !username) return;
    this.socket?.emit("language-change", { roomId, language, username });
  }

  // ============ LISTENERS ============
  listen(event, cb) {
>>>>>>> bugfix-working-version
    this.socket?.off(event);
    this.socket?.on(event, cb);
  }

  onRoomCreated(cb) {
    this.listen("room-created", cb);
  }
<<<<<<< HEAD
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
=======

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
>>>>>>> bugfix-working-version
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

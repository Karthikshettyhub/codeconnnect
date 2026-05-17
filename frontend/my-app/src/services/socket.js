import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect() {

    // prevent duplicate connections
    if (this.socket) {
      return;
    }

    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL ||
      "http://localhost:5005";

    this.socket = io(BACKEND_URL, {
      transports: ["websocket"],

      withCredentials: true,

      reconnection: true,

      reconnectionAttempts: Infinity,

      reconnectionDelay: 1000,

      reconnectionDelayMax: 5000,

      timeout: 20000,
    });

    this.socket.on("connect", () => {
      console.log(
        "✅ Socket connected:",
        this.socket.id
      );
    });

    this.socket.on("disconnect", (reason) => {
      console.log(
        "❌ Socket disconnected:",
        reason
      );
    });

    this.socket.on("connect_error", (error) => {
      console.error(
        "❌ Socket connection error:",
        error.message
      );
    });
  }

  waitForConnection() {

    return new Promise((resolve) => {

      if (this.socket?.connected) {
        resolve();
        return;
      }

      this.socket.once(
        "connect",
        resolve
      );
    });
  }

  disconnect() {

    if (this.socket) {

      this.socket.removeAllListeners();

      this.socket.disconnect();

      this.socket = null;
    }
  }

  // =========================
  // CREATE ROOM
  // =========================

  async createRoom(
    roomId,
    username,
    passcode
  ) {

    await this.waitForConnection();

    return new Promise((resolve, reject) => {

      const handleCreated = (data) => {

        cleanup();

        resolve(data);
      };

      const handleError = (err) => {

        cleanup();

        reject(err);
      };

      const cleanup = () => {

        this.socket.off(
          "room-created",
          handleCreated
        );

        this.socket.off(
          "error",
          handleError
        );
      };

      this.socket.on(
        "room-created",
        handleCreated
      );

      this.socket.on(
        "error",
        handleError
      );

      this.socket.emit(
        "create-room",
        {
          roomId,
          username,
          passcode,
        }
      );
    });
  }

  // =========================
  // JOIN ROOM
  // =========================

  async joinRoom(
    roomId,
    username,
    passcode
  ) {

    await this.waitForConnection();

    return new Promise((resolve, reject) => {

      const handleJoined = (data) => {

        cleanup();

        resolve(data);
      };

      const handleError = (err) => {

        cleanup();

        reject(err);
      };

      const cleanup = () => {

        this.socket.off(
          "room-joined",
          handleJoined
        );

        this.socket.off(
          "error",
          handleError
        );
      };

      this.socket.on(
        "room-joined",
        handleJoined
      );

      this.socket.on(
        "error",
        handleError
      );

      this.socket.emit(
        "join-room",
        {
          roomId,
          username,
          passcode,
        }
      );
    });
  }

  // =========================
  // LEAVE ROOM
  // =========================

  leaveRoom(
    roomId,
    username
  ) {

    this.socket?.emit(
      "leave-room",
      {
        roomId,
        username,
      }
    );
  }

  // =========================
  // CHAT
  // =========================

  async sendMessage(
    roomId,
    username,
    message
  ) {

    await this.waitForConnection();

    if (!roomId) {

      console.error(
        "❌ roomId missing"
      );

      return;
    }

    this.socket.emit(
      "chat-message",
      {
        roomId,
        username,
        message,
      }
    );
  }

  // =========================
  // CODE
  // =========================

  sendCode(
    roomId,
    code
  ) {

    this.socket?.emit(
      "code-change",
      {
        roomId,
        code,
      }
    );
  }

  // =========================
  // LANGUAGE
  // =========================

  sendLanguage(
    roomId,
    language,
    username
  ) {

    if (
      !roomId ||
      !language ||
      !username
    ) {
      return;
    }

    this.socket?.emit(
      "language-change",
      {
        roomId,
        language,
        username,
      }
    );
  }

  // =========================
  // GENERIC
  // =========================

  emit(event, data) {

    this.socket?.emit(
      event,
      data
    );
  }

  listen(event, callback) {

    this.socket?.on(
      event,
      callback
    );
  }

  off(event, callback) {

    this.socket?.off(
      event,
      callback
    );
  }

  // =========================
  // ROOM EVENTS
  // =========================

  onRoomCreated(callback) {
    this.listen(
      "room-created",
      callback
    );
  }

  onRoomJoined(callback) {
    this.listen(
      "room-joined",
      callback
    );
  }

  onReceiveMessage(callback) {
    this.listen(
      "receive-message",
      callback
    );
  }

  onUserJoined(callback) {
    this.listen(
      "user-joined",
      callback
    );
  }

  onUserLeft(callback) {
    this.listen(
      "user-left",
      callback
    );
  }

  onCodeReceive(callback) {
    this.listen(
      "code-receive",
      callback
    );
  }

  onLanguageChange(callback) {
    this.listen(
      "language-change",
      callback
    );
  }

  onError(callback) {
    this.listen(
      "error",
      callback
    );
  }
}

export default new SocketService();
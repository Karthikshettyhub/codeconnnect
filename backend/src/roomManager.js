const Room = require("./models/Room");

class RoomManager {

  constructor() {
    console.log(
      "✅ [BACKEND] MongoDB RoomManager loaded."
    );
  }

  // =========================
  // CREATE ROOM
  // =========================

  async createRoom(
    roomId,
    socketId,
    username,
    userId
  ) {

    console.log(
      "CREATE ATTEMPT:",
      roomId,
      username,
      userId
    );

    let room =
      await Room.findOne({ roomId });

    // if room exists -> join room
    if (room) {

      return this.joinRoom(
        roomId,
        socketId,
        username,
        userId
      );
    }

    room = await Room.create({

      roomId,

      createdBy: userId,

      users: [
        {
          socketId,
          username
        }
      ],

      messages: [],

      code: "",

      language: "javascript",

      participants: [userId],

      createdAt: Date.now(),
    });

    console.log(
      "ROOM CREATED:",
      roomId
    );

    return {
      success: true
    };
  }

  // =========================
  // JOIN ROOM
  // =========================

  async joinRoom(
    roomId,
    socketId,
    username,
    userId
  ) {

    console.log(
      "JOIN ATTEMPT:",
      roomId,
      username
    );

    let room =
      await Room.findOne({ roomId });

    // auto create if missing
    if (!room) {

      console.log(
        "🔄 AUTO-CREATING MISSING ROOM:",
        roomId
      );

      room = await Room.create({

        roomId,

        createdBy: userId,

        users: [],

        messages: [],

        code: "",

        language: "javascript",

        participants: [userId],

        createdAt: Date.now(),
      });
    }

    // ====================================
    // IMPORTANT FIX
    // allow multiple users/tabs
    // ====================================

    room.users.push({
      socketId,
      username
    });

    // remove duplicate socket ids
    room.users =
      room.users.filter(
        (user, index, self) =>
          index ===
          self.findIndex(
            (u) =>
              u.socketId === user.socketId
          )
      );

    await Room.updateOne(
      { roomId },
      { $addToSet: { participants: userId } }
    );

    await room.save();

    console.log(
      "JOIN SUCCESS:",
      roomId,
      username
    );

    return {
      success: true
    };
  }

  // =========================
  // REMOVE USER
  // =========================

  async removeUserBySocketId(socketId) {

    const rooms = await Room.find();

    for (const room of rooms) {

      const initialLength =
        room.users.length;

      room.users =
        room.users.filter(
          (u) => u.socketId !== socketId
        );

      // save only if changed
      if (
        room.users.length !== initialLength
      ) {

        console.log(
          "❌ USER REMOVED:",
          socketId,
          "FROM",
          room.roomId
        );

        await room.save();
      }
    }
  }

  // =========================
  // LEAVE ROOM
  // =========================

  async leaveRoom(roomId, socketId) {

    const room =
      await Room.findOne({ roomId });

    if (!room) return true;

    room.users =
      room.users.filter(
        (u) => u.socketId !== socketId
      );

    await room.save();

    console.log(
      "👋 USER LEFT:",
      socketId,
      roomId
    );

    return true;
  }

  // =========================
  // GET ROOM DATA
  // =========================

  async getRoomData(roomId) {

    const room =
      await Room.findOne({ roomId });

    if (!room) return null;

    return {

      users: room.users,

      messages: room.messages,

      code: room.code,

      language: room.language,
    };
  }

  // =========================
  // ADD MESSAGE
  // =========================

  async addMessage(roomId, message) {

    await Room.updateOne(
      { roomId },
      {
        $push: {
          messages: message
        }
      }
    );
  }

  // =========================
  // UPDATE CODE
  // =========================

  async updateCode(roomId, code) {

    await Room.updateOne(
      { roomId },
      { code }
    );
  }

  // =========================
  // UPDATE LANGUAGE
  // =========================

  async updateLanguage(
    roomId,
    language
  ) {

    await Room.updateOne(
      { roomId },
      { language }
    );
  }
}

module.exports = new RoomManager();
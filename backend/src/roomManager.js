const Room = require("./models/room");

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

    // Check if a room with this ID already exists
    let room = await Room.findOne({ roomId });

    // If room exists and is active, reject creation
    if (room && room.isActive) {
      return { success: false, message: "Room ID already exists" };
    }

    // If room exists but is inactive, reactivate it
    if (room && !room.isActive) {
      // Add creator to users list
      room.users.push({ socketId, username });
      // Ensure creator is in participants array
      if (!room.participants.includes(userId)) {
        room.participants.push(userId);
      }
      // Mark room as active
      room.isActive = true;
      await room.save();
      console.log("✅ REACTIVATED ROOM:", roomId);
      return { success: true, reactivated: true };
    }

    // No existing room, create a new one
    room = await Room.create({
      roomId,
      createdBy: userId,
      users: [{ socketId, username }],
      messages: [],
      code: "",
      language: "javascript",
      participants: [userId],
      createdAt: Date.now(),
      isActive: true,
    });
    console.log("ROOM CREATED:", roomId);
    return { success: true };

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

      isActive: true,
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

    // =========================
    // BLOCK INACTIVE ROOMS
    // =========================

    if (
      !room ||
      !room.isActive
    ) {

      console.log(
        "❌ ROOM NOT ACTIVE:",
        roomId
      );

      return {
        success: false,
        message: "Room does not exist",
      };
    }

    // =========================
    // ADD USER
    // =========================

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
              u.socketId ===
              user.socketId
          )
      );

    // IMPORTANT
    // keep room active
    // when user reconnects

    room.isActive = true;

    await Room.updateOne(
      { roomId },
      {
        $addToSet: {
          participants: userId
        }
      }
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

  async removeUserBySocketId(
    socketId
  ) {

    const rooms =
      await Room.find();

    for (const room of rooms) {

      const initialLength =
        room.users.length;

      room.users =
        room.users.filter(
          (u) =>
            u.socketId !==
            socketId
        );

      // only if changed
      if (
        room.users.length !==
        initialLength
      ) {

        console.log(
          "❌ USER REMOVED:",
          socketId,
          "FROM",
          room.roomId
        );

        await room.save();

        // =========================
        // DISCONNECT GRACE
        // =========================

        if (
          room.users.length === 0
        ) {

          console.log(
            "⏳ WAITING BEFORE ROOM DEACTIVATION:",
            room.roomId
          );

          setTimeout(
            async () => {

              try {

                const latestRoom =
                  await Room.findOne({
                    roomId:
                      room.roomId
                  });

                if (
                  !latestRoom
                ) {
                  return;
                }

                // reconnect happened
                if (
                  latestRoom
                    .users
                    .length > 0
                ) {

                  console.log(
                    "✅ USER REJOINED ROOM:",
                    latestRoom.roomId
                  );

                  return;
                }

                latestRoom.isActive =
                  false;

                await latestRoom.save();

                console.log(
                  "🛑 ROOM AUTO-DEACTIVATED:",
                  latestRoom.roomId
                );

              } catch (err) {

                console.log(
                  "❌ ROOM DEACTIVATE ERROR:",
                  err
                );
              }

            },

            10000
          );
        }
      }
    }
  }

  // =========================
  // LEAVE ROOM
  // =========================

  async leaveRoom(
    roomId,
    socketId
  ) {

    const room =
      await Room.findOne({
        roomId
      });

    if (!room) return true;

    room.users =
      room.users.filter(
        (u) =>
          u.socketId !==
          socketId
      );

    console.log(
      "👋 USER LEFT:",
      socketId,
      roomId
    );

    // =========================
    // INSTANT ROOM CLOSE
    // =========================

    if (
      room.users.length === 0
    ) {

      room.isActive = false;

      console.log(
        "🛑 ROOM INSTANTLY DEACTIVATED:",
        room.roomId
      );
    }

    await room.save();

    return true;
  }

  // =========================
  // GET ROOM DATA
  // =========================

  async getRoomData(roomId) {

    const room =
      await Room.findOne({
        roomId
      });

    if (!room) return null;

    return {

      users: room.users,

      messages:
        room.messages,

      code: room.code,

      language:
        room.language,
    };
  }

  // =========================
  // ADD MESSAGE
  // =========================

  async addMessage(
    roomId,
    message
  ) {

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

  async updateCode(
    roomId,
    code
  ) {

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

module.exports =
  new RoomManager();
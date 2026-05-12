const mongoose = require("mongoose");

// =========================
// MESSAGE SCHEMA
// =========================

const messageSchema =
  new mongoose.Schema({

    userId: {
      type:
        mongoose.Schema.Types.ObjectId,

      ref: "User",
    },

    username: {
      type: String,
    },

    message: {
      type: String,
      required: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },
  });

// =========================
// ROOM USER SCHEMA
// =========================

const roomUserSchema =
  new mongoose.Schema({

    userId: {
      type:
        mongoose.Schema.Types.ObjectId,

      ref: "User",
    },

    username: {
      type: String,
    },

    // IMPORTANT FIX
    socketId: {
      type: String,
    },

    joinedAt: {
      type: Date,
      default: Date.now,
    },

  });

// =========================
// ROOM SCHEMA
// =========================

const roomSchema =
  new mongoose.Schema({

    roomId: {
      type: String,
      required: true,
      unique: true,
    },

    createdBy: {
      type:
        mongoose.Schema.Types.ObjectId,

      ref: "User",
    },

    // IMPORTANT
    users: [roomUserSchema],

    messages: [messageSchema],

    code: {
      type: String,
      default: "",
    },

    language: {
      type: String,
      default: "javascript",
    },

  }, {
    timestamps: true
  });

module.exports =
  mongoose.model(
    "Room",
    roomSchema
  );
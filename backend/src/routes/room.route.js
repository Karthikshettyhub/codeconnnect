const express = require("express");
const jwt = require("jsonwebtoken");
const Room = require("../models/Room");
const router = express.Router();

// 🔐 Middleware to protect routes
const authMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Please login first" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid session, please login again" });
  }
};

// ⚡ GET ALL ROOMS (Created or Joined by user)
router.get("/my-rooms", authMiddleware, async (req, res) => {
  try {
    const rooms = await Room.find({
      $or: [
        { createdBy: req.user.id },
        { participants: req.user.id }
      ]
    }).sort({ updatedAt: -1 });

    const formattedRooms = rooms.map(room => ({
      roomId: room.roomId,
      createdAt: room.createdAt,
      messageCount: room.messages.length,
      userCount: room.users.length, // Active users
    }));

    res.json(formattedRooms);
  } catch (err) {
    res.status(500).json({ message: "Error fetching rooms" });
  }
});

// ⚡ GET ROOM CHAT HISTORY
router.get("/history/:roomId", authMiddleware, async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    // Optional: Check if user was a participant
    // if (!room.participants.includes(req.user.id) && room.createdBy.toString() !== req.user.id) {
    //   return res.status(403).json({ message: "Access denied" });
    // }

    res.json(room.messages);
  } catch (err) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

module.exports = router;

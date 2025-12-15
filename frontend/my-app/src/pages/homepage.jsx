import React, { useState, useEffect } from "react";
import { useRoom } from "../contexts/roomcontext";
import { useNavigate } from "react-router-dom";
import "./homepage.css";

const Homepage = () => {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState("join");

  const { createRoom, joinRoom, currentRoom } = useRoom();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomId.trim() || !username.trim()) {
      alert("Enter both room ID and username");
      return;
    }

    if (mode === "create") {
      createRoom(roomId, username);
    } else {
      joinRoom(roomId, username);
    }
  };

  // ✅ REDIRECT FIX (KEEP THIS)
  useEffect(() => {
    if (currentRoom) {
      navigate(`/room/${currentRoom}`);
    }
  }, [currentRoom, navigate]);

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  return (
    <div className="homepage-container">
      {/* ---------- NAVBAR ---------- */}
      <nav className="navbar">
        <h2 className="nav-logo">CodeCollab</h2>
        <div className="nav-right" />
      </nav>

      {/* ---------- MAIN CARD ---------- */}
      <div className="home-card">
        <h1 className="home-title">Start Collaborating</h1>
        <p className="home-subtitle">Create or join a room in seconds</p>

        <form className="home-form" onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <label>Room ID</label>
          <div className="room-input-wrap">
            <input
              type="text"
              placeholder={
                mode === "create"
                  ? "Generate or enter room ID"
                  : "Enter room ID"
              }
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            {mode === "create" && (
              <button
                type="button"
                className="gen-btn"
                onClick={generateRoomId}
              >
                Generate
              </button>
            )}
          </div>

          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-btn ${mode === "join" ? "active" : ""}`}
              onClick={() => setMode("join")}
            >
              Join Room
            </button>
            <button
              type="button"
              className={`mode-btn ${mode === "create" ? "active" : ""}`}
              onClick={() => setMode("create")}
            >
              Create Room
            </button>
          </div>

          <button className="submit-btn" type="submit">
            {mode === "create" ? "Create Room" : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Homepage;

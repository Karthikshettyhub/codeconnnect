import React, { useState, useEffect } from "react";
import { useRoom } from "../contexts/roomcontext";
import { useNavigate } from "react-router-dom";
import "./homepage.css";

const Homepage = () => {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState("");
  const [mode, setMode] = useState("join");

  const { createRoom, joinRoom } = useRoom();
  const navigate = useNavigate();

  useEffect(() => {
    // No auto navigation
  }, []);

  // ✅ FIXED: make async + await
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!roomId.trim() || !username.trim()) {
      alert("Enter both Room ID and Username");
      return;
    }

    const finalRoomId = roomId.trim().toUpperCase();

    // Save user identity
    localStorage.setItem("username", username.trim());
    if (passcode) {
      localStorage.setItem("passcode", passcode.trim());
    }

    try {
      // ✅ WAIT for backend confirmation
      if (mode === "create") {
        await createRoom(finalRoomId, username.trim(), passcode.trim());
      } else {
        await joinRoom(finalRoomId, username.trim(), passcode.trim());
      }

      console.log("✅ Room ready → Navigating:", finalRoomId);

      // ✅ Navigate ONLY after success
      navigate(`/room/${finalRoomId}`);
    } catch (err) {
      console.error("❌ Failed to join/create room:", err);
      alert("Unable to join room. Please try again.");
    }
  };

  const generateRoomId = () => {
    const id = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    setRoomId(id);
  };

  return (
    <div className="homepage-container">
      <nav className="navbar">
        <h2 className="nav-logo">CodeCollab</h2>
      </nav>

      <div className="home-card">
        <h1 className="home-title">Start Collaborating</h1>
        <p className="home-subtitle">Create or join a room in seconds</p>

        <form className="home-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Who are you?"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Room ID</label>
            <div className="room-input-wrap">
              <input
                type="text"
                placeholder={mode === "create" ? "Ex: PRO-DEV" : "Enter ID"}
                value={roomId}
                onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                required
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
          </div>

          <div className="input-group">
            <label>Passcode (Optional)</label>
            <input
              type="password"
              placeholder="Secret key"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
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
import React, { useState, useEffect } from "react";
import { useRoom } from "../contexts/roomcontext";
import { useNavigate } from "react-router-dom";
import "./homepage.css";
// import { signInWithPopup, signOut } from "firebase/auth";

const Homepage = () => {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState("join");
  const [user, setUser] = useState(null);

  const { createRoom, joinRoom, currentRoom, leaveRoom } = useRoom();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("🔍 currentRoom changed:", currentRoom);
    if (currentRoom) {
      console.log("🚀 Redirecting to:", `/room/${currentRoom}`);
      navigate(`/room/${currentRoom}`);
    }
  }, [currentRoom, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomId.trim() || !username.trim()) {
      alert("Enter both room ID and username");
      return;
    }

    console.log("📝 Form submitted - Mode:", mode, "Room:", roomId, "User:", username);

    if (mode === "create") {
      createRoom(roomId, username);
    } else {
      joinRoom(roomId, username);
    }
  };

  const generateRoomId = () => {
    const id = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    setRoomId(id);
  };

  const handleLogout = async () => {
    try {
      leaveRoom();

      sessionStorage.clear();
      localStorage.clear();

      setUser(null);
      setUsername("");
      setRoomId("");

      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
      alert("Logout failed");
    }
  };

  return (
    <div className="homepage-container">
      <nav className="navbar">
        <h2 className="nav-logo">CodeCollab</h2>

        <div className="nav-right">
          {user && (
            <>
              <span className="nav-user">
                👋 {user.displayName}
              </span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="home-card">
        <h1 className="home-title">Start Collaborating</h1>
        <p className="home-subtitle">Create or join a room in seconds</p>

        {!user && (
          <button
            className="submit-btn"
            style={{
              marginBottom: "20px",
              background: "#4285F4",
              color: "#fff",
            }}
          >
            Login with Google
          </button>
        )}

        <form className="home-form" onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={!!user}
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

import React, { useState, useEffect } from "react";
import { useRoom } from "../contexts/roomcontext";
import { useNavigate } from "react-router-dom";
import "./homepage.css";

const Homepage = () => {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState("join");

  const [user, setUser] = useState(null);

  const { createRoom, joinRoom } = useRoom();
  const navigate = useNavigate();

  // 🔥 CHECK LOGIN
  useEffect(() => {
    fetch("http://localhost:5005/auth/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);

        // 🔥 AUTO FILL USERNAME (ONLY IF EMPTY)
        if (data.user && !username) {
          setUsername(data.user.username);
        }
      })
      .catch(() => setUser(null));
  }, []);

  // 🔥 LOGOUT
  const handleLogout = async () => {
    await fetch("http://localhost:5005/auth/logout", {
      method: "GET",
      credentials: "include",
    });

    setUser(null);
    window.location.reload();
  };

  // 🔥 SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("⚠️ Please login first to continue");
      return;
    }

    if (!roomId.trim() || !username.trim()) {
      alert("Enter both Room ID and Username");
      return;
    }

    const finalRoomId = roomId.trim().toUpperCase();

    localStorage.setItem("username", username.trim());

    try {
      if (mode === "create") {
        await createRoom(finalRoomId, username.trim());
      } else {
        await joinRoom(finalRoomId, username.trim());
      }

      navigate(`/room/${finalRoomId}`);
    } catch (err) {
      alert("Unable to join room. Please try again.");
    }
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  return (
    <div className="homepage-container">
      <nav className="navbar">
        <h2 className="nav-logo">CodeCollab</h2>

        <div className="nav-right">
          {user && (
            <>
              <span className="nav-user">{user.username}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </nav>

      <div className="home-card">

        {!user ? (
          <button
            className="google-btn"
            onClick={() => {
              window.location.href = "http://localhost:5005/auth/google";
            }}
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="google"
            />
            Continue with Google
          </button>
        ) : (
          <div className="logged-in-box">
            <p>Welcome, <b>{user.username}</b> 👋</p>
          </div>
        )}

        <div className="divider">
          <span>OR</span>
        </div>

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
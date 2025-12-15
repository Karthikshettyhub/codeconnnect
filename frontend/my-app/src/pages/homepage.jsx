import React, { useState, useEffect } from "react";
import { useRoom } from "../contexts/roomcontext";
import { useNavigate } from "react-router-dom";
import "./homepage.css";

const Homepage = () => {
<<<<<<< HEAD
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState('join');
  
=======
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState("join");

>>>>>>> bugfix-working-version
  const { createRoom, joinRoom, currentRoom } = useRoom();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomId.trim() || !username.trim()) {
<<<<<<< HEAD
      alert('Please enter both room ID and username');
=======
      alert("Enter both room ID and username");
>>>>>>> bugfix-working-version
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

<<<<<<< HEAD
  // ✅ Navigate once room created / joined
  useEffect(() => {
    if (currentRoom) {
      navigate(`/room/${currentRoom}`);
    }
  }, [currentRoom, navigate]);

  return (
    <div className="home-wrapper">
=======
  return (
    <div className="homepage-container">
      {/* ---------- NAVBAR ---------- */}
      <nav className="navbar">
        <h2 className="nav-logo">CodeCollab</h2>
        <div className="nav-right" />
      </nav>

      {/* ---------- MAIN CARD ---------- */}
>>>>>>> bugfix-working-version
      <div className="home-card">

        <h1 className="home-title">CodeCollab</h1>
        <p className="home-subtitle">Real-time collaborative coding</p>

        <div className="mode-toggle">
          <button 
            className={`mode-btn ${mode === 'join' ? 'active' : ''}`} 
            onClick={() => setMode('join')}
          >
            Join Room
          </button>
          <button 
            className={`mode-btn ${mode === 'create' ? 'active' : ''}`} 
            onClick={() => setMode('create')}
          >
            Create Room
          </button>
        </div>

        <form className="home-form" onSubmit={handleSubmit}>
          <label>Username</label>
          <input
            type="text"
<<<<<<< HEAD
            value={username}
            onChange={(e)=>setUsername(e.target.value)} 
            placeholder="Enter your username"
=======
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
>>>>>>> bugfix-working-version
          />

          <label>Room ID</label>
          <div className="room-input-wrap">
<<<<<<< HEAD
            <input 
              type="text" 
              value={roomId} 
              onChange={(e)=>setRoomId(e.target.value)} 
              placeholder={mode==='create' ? 'Generate or enter room ID' : 'Enter room ID'}
=======
            <input
              type="text"
              placeholder={
                mode === "create"
                  ? "Generate or enter room ID"
                  : "Enter room ID"
              }
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
>>>>>>> bugfix-working-version
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

<<<<<<< HEAD
=======
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

>>>>>>> bugfix-working-version
          <button className="submit-btn" type="submit">
            {mode === "create" ? "Create Room" : "Join Room"}
          </button>
        </form>
<<<<<<< HEAD

=======
>>>>>>> bugfix-working-version
      </div>
    </div>
  );
};

export default Homepage;

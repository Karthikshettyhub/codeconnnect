import React, { useState, useEffect } from 'react';
import { useRoom } from '../contexts/roomcontext';
import { useNavigate } from 'react-router-dom';
import './homepage.css';

const Homepage = () => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('join');
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState('');

  const { createRoom, joinRoom, currentRoom } = useRoom();
  const navigate = useNavigate();

  // ---------------- LOGIN ----------------
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('token', data.token);
      setUsername(data.username);
      setIsLoggedIn(true);
      setShowLogin(false);
    } catch {
      setError('Error occurred, try again.');
    }
  };

  // --------------- JOIN / CREATE ROOM ----------------
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!roomId.trim() || !username.trim()) {
      alert('Enter both room ID and username');
      return;
    }

    if (mode === 'create') {
      createRoom(roomId, username);
    } else {
      joinRoom(roomId, username);
    }
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  useEffect(() => {
    if (currentRoom) navigate(`/room/${currentRoom}`);
  }, [currentRoom, navigate]);

  const logout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUsername('');
  };

  return (
    <div className="homepage-container">

      {/* ---------- NAVBAR ---------- */}
      <nav className="navbar">
        <h2 className="nav-logo">CodeCollab</h2>

        <div className="nav-right">
          {!isLoggedIn ? (
            <button className="nav-login-btn" onClick={() => setShowLogin(!showLogin)}>
              Login
            </button>
          ) : (
            <div className="nav-user">
              <span>👋 {username}</span>
              <button className="logout-btn" onClick={logout}>Logout</button>
            </div>
          )}
        </div>
      </nav>

      {/* ---------- LOGIN FORM DROPDOWN ---------- */}
      {showLogin && !isLoggedIn && (
        <form onSubmit={handleLogin} className="dropdown-login">
          <input 
            type="text" 
            placeholder="Username"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            required
          />
          <input 
            type="password" 
            placeholder="Password"
            value={password}
            onChange={(e)=>setPassword(e.target.value)}
            required
          />
          <button type="submit">Submit</button>
          {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}
        </form>
      )}

      {/* ---------- MAIN ROOM UI ---------- */}
      <div className="home-card">
        <h1 className="home-title">Start Collaborating</h1>
        <p className="home-subtitle">Create or join a room in seconds</p>

        <form onSubmit={handleSubmit} className="home-form">
          <label>Username</label>
          <input 
            type="text"
            value={username}
            onChange={(e)=>setUsername(e.target.value)}
            placeholder="Enter your name"
          />

          <label>Room ID</label>
          <div className="room-input-wrap">
            <input 
              type="text"
              value={roomId}
              onChange={(e)=>setRoomId(e.target.value)}
              placeholder={mode==='create' ? 'Generate or enter room ID' : 'Enter room ID'}
            />
            {mode === 'create' && (
              <button type="button" className="gen-btn" onClick={generateRoomId}>
                Generate
              </button>
            )}
          </div>

          <div className="mode-toggle">
            <button 
              type="button"
              className={`mode-btn ${mode === 'join' ? 'active' : ''}`} 
              onClick={() => setMode('join')}
            >
              Join Room
            </button>
            <button 
              type="button"
              className={`mode-btn ${mode === 'create' ? 'active' : ''}`} 
              onClick={() => setMode('create')}
            >
              Create Room
            </button>
          </div>

          <button className="submit-btn" type="submit">
            {mode === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </form>
      </div>

    </div>
  );
};

export default Homepage;

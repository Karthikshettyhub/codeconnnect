import React, { useState, useEffect } from 'react';
import { useRoom } from '../contexts/roomcontext';
import { useNavigate } from 'react-router-dom';
import './homepage.css';

const Homepage = () => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState('join');
  
  const { createRoom, joinRoom, currentRoom } = useRoom();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!roomId.trim() || !username.trim()) {
      alert('Please enter both room ID and username');
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

  // ✅ Navigate once room created / joined
  useEffect(() => {
    if (currentRoom) {
      navigate(`/room/${currentRoom}`);
    }
  }, [currentRoom, navigate]);

  return (
    <div className="home-wrapper">
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

        <form onSubmit={handleSubmit} className="home-form">
          <label>Username</label>
          <input 
            type="text"
            value={username}
            onChange={(e)=>setUsername(e.target.value)} 
            placeholder="Enter your username"
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

          <button className="submit-btn" type="submit">
            {mode === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Homepage;

import React, { useState } from 'react';
import { useRoom } from '../contexts/roomcontext';
import './homepage.css';

const Homepage = ({ onJoinRoom, onCreateRoom }) => {
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('');
  const [mode, setMode] = useState('join'); // 'join' or 'create'
  const { createRoom, joinRoom } = useRoom();

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!roomId.trim() || !username.trim()) {
      alert('Please enter both room ID and username');
      return;
    }

    if (mode === 'create') {
      createRoom(roomId, username);
      onCreateRoom(roomId);
    } else {
      joinRoom(roomId, username);
      onJoinRoom(roomId);
    }
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  return (
    <div className="homepage">
      <div className="homepage-container">
        <h1>CodeCollab</h1>
        <p>Real-time collaborative coding platform</p>

        <div className="mode-selector">
          <button
            className={mode === 'join' ? 'active' : ''}
            onClick={() => setMode('join')}
          >
            Join Room
          </button>
          <button
            className={mode === 'create' ? 'active' : ''}
            onClick={() => setMode('create')}
          >
            Create Room
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label>Room ID</label>
            <div className="room-id-input">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder={mode === 'create' ? 'Generate or enter room ID' : 'Enter room ID'}
              />
              {mode === 'create' && (
                <button type="button" onClick={generateRoomId}>
                  Generate
                </button>
              )}
            </div>
          </div>

          <button type="submit" className="submit-button">
            {mode === 'create' ? 'Create Room' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Homepage;
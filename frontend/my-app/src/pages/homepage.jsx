import React, { useState } from 'react';
import './homepage.css';

const Homepage = ({ onJoinRoom, onCreateRoom }) => {
  const [roomId, setRoomId] = useState('');

  const handleJoin = () => {
    if (roomId.trim()) {
      onJoinRoom(roomId.trim());
    }
  };

  const handleCreate = () => {
    // Generate random room ID
    const newRoomId = Math.random().toString(36).substring(2, 10).toUpperCase();
    onCreateRoom(newRoomId);
  };

  return (
    <div className="homepage">
      <div className="homepage-content">
        <h1 className="homepage-title">CodeCollab</h1>
        <p className="homepage-subtitle">
          Code together in real-time with voice, video, and collaborative editing.
          Perfect for pair programming, interviews, and team projects.
        </p>

        <div className="homepage-actions">
          <button 
            className="homepage-btn homepage-btn-primary"
            onClick={handleCreate}
          >
            Create Room
          </button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleJoin()}
              style={{
                padding: '16px',
                fontSize: '16px',
                borderRadius: '8px',
                border: '2px solid var(--bg-tertiary)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                minWidth: '200px'
              }}
            />
            <button 
              className="homepage-btn homepage-btn-secondary"
              onClick={handleJoin}
              disabled={!roomId.trim()}
              style={{ opacity: roomId.trim() ? 1 : 0.5 }}
            >
              Join
            </button>
          </div>
        </div>

        <div className="homepage-features">
          <div className="feature-card">
            <div className="feature-icon">💻</div>
            <div className="feature-title">Live Code Editor</div>
            <div className="feature-description">
              Real-time collaborative code editing with syntax highlighting
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <div className="feature-title">Team Chat</div>
            <div className="feature-description">
              Communicate with your team while coding together
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📹</div>
            <div className="feature-title">Video & Voice</div>
            <div className="feature-description">
              High-quality video calls and voice chat built-in
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <div className="feature-title">Instant Setup</div>
            <div className="feature-description">
              No downloads needed. Create a room and start coding
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
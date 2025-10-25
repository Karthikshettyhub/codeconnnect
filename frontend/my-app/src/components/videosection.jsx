import React, { useState } from 'react';
import './videosection.css';

const VideoSection = ({ users }) => {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const getInitials = (name) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      'linear-gradient(135deg, #5865f2, #7289da)',
      'linear-gradient(135deg, #3ba55d, #2d7d46)',
      'linear-gradient(135deg, #faa61a, #f26522)',
      'linear-gradient(135deg, #ed4245, #c93a3c)',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="video-section">
      <div className="video-section-header">
        <div className="video-section-title">
          <span>📹</span>
          <span>Video Call</span>
        </div>
        <div className="video-controls">
          <button
            className={`video-control-btn ${isMicOn ? 'active' : 'muted'}`}
            onClick={() => setIsMicOn(!isMicOn)}
            title={isMicOn ? 'Mute' : 'Unmute'}
          >
            {isMicOn ? '🎤' : '🔇'}
          </button>
          <button
            className={`video-control-btn ${isCameraOn ? 'active' : ''}`}
            onClick={() => setIsCameraOn(!isCameraOn)}
            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isCameraOn ? '📹' : '📷'}
          </button>
          <button
            className={`video-control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
          >
            🖥️
          </button>
        </div>
      </div>

      {users.length > 0 ? (
        <div className="video-grid">
          {users.map((user) => (
            <div key={user.id} className="video-item">
              <div className="video-placeholder">
                <div 
                  className="video-avatar"
                  style={{ background: getAvatarColor(user.name) }}
                >
                  {getInitials(user.name)}
                </div>
                <div className="video-name">{user.name}</div>
              </div>
              <div className="video-overlay">
                <span className="video-user-name">{user.name}</span>
                <div className="video-status">
                  <span className="status-icon">🎤</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="video-section-empty">
          No one is in the call yet
        </div>
      )}
    </div>
  );
};

export default VideoSection;
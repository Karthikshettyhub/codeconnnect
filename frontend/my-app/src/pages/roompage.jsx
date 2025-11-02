import React from 'react';
import { useRoom } from '../contexts/roomcontext';
import ChatBox from '../components/chatbox';
import CodeEditor from '../components/codeeditor';
import './roompage.css';

const RoomPage = ({ roomId, onLeave }) => {
  const { users, username, leaveRoom } = useRoom();

  const handleLeave = () => {
    leaveRoom();
    onLeave();
  };

  return (
    <div className="roompage">
      <div className="roompage-header">
        <div className="room-info">
          <h2>Room: {roomId}</h2>
          <span className="user-count">{users.length} user(s) online</span>
        </div>
        <button className="leave-button" onClick={handleLeave}>
          Leave Room
        </button>
      </div>

      <div className="roompage-content">
        <div className="editor-section">
          <CodeEditor />
        </div>
        
        <div className="sidebar">
          <div className="users-list">
            <h3>Users</h3>
            {users.map((user, index) => (
              <div key={index} className="user-item">
                <span className="user-indicator"></span>
                {user.username}
                {user.username === username && ' (You)'}
              </div>
            ))}
          </div>
          
          <ChatBox />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
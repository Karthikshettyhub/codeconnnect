import React, { useState } from 'react';
import './roompage.css';
import CodeEditor from '../components/codeeditor';
import ChatBox from '../components/chatbox';
import VideoSection from '../components/videosection';

const RoomPage = ({ roomId, onLeave }) => {
  const [showChat, setShowChat] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [users, setUsers] = useState([
    { id: 1, name: 'You', role: 'Host', online: true },
    { id: 2, name: 'User2', role: 'Member', online: true },
    { id: 3, name: 'User3', role: 'Member', online: false },
  ]);

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    alert('Room ID copied to clipboard!');
  };

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const getInitials = (name) => {
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="room-page">
      {/* Left Sidebar - User List */}
      <div className="room-sidebar">
        <div className="room-header">
          <div className="room-name">Coding Room</div>
          <div className="room-id">
            Room: {roomId}
            <button className="copy-btn" onClick={copyRoomId}>
              Copy
            </button>
          </div>
        </div>

        <div className="user-list">
          <div className="user-list-title">
            Members — {users.filter(u => u.online).length}
          </div>
          {users.map(user => (
            <div key={user.id} className="user-item">
              <div className="user-avatar">
                {getInitials(user.name)}
                <div className={`user-status ${user.online ? 'online' : 'offline'}`}></div>
              </div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="room-main">
        {/* Top Bar */}
        <div className="room-topbar">
          <div className="room-topbar-left">
            <div className="room-topbar-title"># code-editor</div>
            <select 
              className="language-selector"
              value={selectedLanguage}
              onChange={handleLanguageChange}
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="typescript">TypeScript</option>
            </select>
          </div>

          <div className="room-topbar-right">
            <button className="topbar-btn" onClick={() => setShowChat(!showChat)}>
              {showChat ? '📝 Hide Chat' : '💬 Show Chat'}
            </button>
            <button className="topbar-btn danger" onClick={onLeave}>
              🚪 Leave Room
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="room-content">
          <CodeEditor language={selectedLanguage} />
          
          {showChat && (
            <div className="room-right-sidebar">
              <VideoSection users={users.filter(u => u.online)} />
              <ChatBox roomId={roomId} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
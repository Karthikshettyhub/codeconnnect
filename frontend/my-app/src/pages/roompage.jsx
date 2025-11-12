import React from 'react';
import { useRoom } from '../contexts/roomcontext';
import { useNavigate } from "react-router-dom";
import ChatBox from '../components/chatbox';
import CodeEditor from '../components/codeeditor';
import './roompage.css';

const RoomPage = () => {
  const { leaveRoom } = useRoom();
  const navigate = useNavigate();

  const handleLeave = () => {
    leaveRoom();
    navigate("/");
  };

  return (
    <div className="roompage">
      {/* --- Main content (Editor + Chat) --- */}
      <div className="roompage-content">
        <div className="editor-section">
          <CodeEditor />
        </div>

        <div className="chat-section">
          <ChatBox onLeave={handleLeave} />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;

// src/components/RoomPage.jsx
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
      <div className="roompage-content">

        {/* LEFT SIDE: EDITOR */}
        <div className="editor-side">
          <CodeEditor />
        </div>

        {/* RIGHT SIDE: CHAT */}
        <div className="chat-side">
          <ChatBox onLeave={handleLeave} />
        </div>

      </div>
    </div>
  );
};

export default RoomPage;

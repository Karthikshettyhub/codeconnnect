// src/components/RoomPage.jsx
import React, { useEffect } from 'react';
import { useRoom } from '../contexts/roomcontext';
import { useNavigate, useParams } from "react-router-dom";
import ChatBox from '../components/chatbox';
import CodeEditor from '../components/codeeditor';
import './roompage.css';

const RoomPage = () => {
  const { leaveRoom, currentRoom, joinRoom } = useRoom();
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    const savedUsername = sessionStorage.getItem("username");

    // 🔴 Case 1: No roomId at all → go home
    if (!roomId) {
      navigate("/");
      return;
    }

    // 🔴 Case 2: No username → go home
    if (!savedUsername) {
      navigate("/");
      return;
    }

    // 🟢 Case 3: Refresh → restore room
    if (!currentRoom) {
      joinRoom(roomId, savedUsername);
    }
  }, [roomId, currentRoom, joinRoom, navigate]);

  const handleLeave = () => {
    leaveRoom();          // full cleanup
    navigate("/");        // manual redirect
  };

  return (
    <div className="roompage">
      <div className="roompage-content">
        <div className="editor-side">
          <CodeEditor />
        </div>
        <div className="chat-side">
          <ChatBox onLeave={handleLeave} />
        </div>
      </div>
    </div>
  );
};

export default RoomPage;

// src/components/RoomPage.jsx
import React, { useEffect } from "react";
import { useRoom } from "../contexts/roomcontext";
import { useNavigate, useParams } from "react-router-dom";
import ChatBox from "../components/chatbox";
import CodeEditor from "../components/codeeditor";
import "./roompage.css";

const RoomPage = () => {
  const { leaveRoom, currentRoom, joinRoom } = useRoom();
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    const savedUsername = sessionStorage.getItem("username");
    const intentionalLeave = sessionStorage.getItem("intentionalLeave");

    // 🚫 user clicked Leave → DO NOT auto-join
    if (intentionalLeave === "true") {
      navigate("/");
      return;
    }

    if (!roomId || !savedUsername) {
      navigate("/");
      return;
    }

    // ✅ auto-join ONLY on refresh
    if (!currentRoom) {
      joinRoom(roomId, savedUsername);
    }
  }, [roomId, currentRoom, joinRoom, navigate]);

  const handleLeave = () => {
    leaveRoom();
    navigate("/");
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

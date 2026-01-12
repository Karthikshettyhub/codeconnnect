import React, { useEffect } from "react";
import { useRoom } from "../contexts/roomcontext";
import { useNavigate, useParams } from "react-router-dom";
import ChatBox from "../components/chatbox";
import CodeEditor from "../components/codeeditor";
import "./roompage.css";

const RoomPage = () => {
  const { currentRoom, joinRoom, leaveRoom } = useRoom();
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    const username = sessionStorage.getItem("username");
    const intentionalLeave = sessionStorage.getItem("intentionalLeave");

    if (intentionalLeave === "true") {
      navigate("/");
      return;
    }

    if (!roomId || !username) {
      navigate("/");
      return;
    }

    // ✅ SAVE ROOM ID FOR REFRESH
    sessionStorage.setItem("roomId", roomId);

    // ✅ AUTO REJOIN ONLY IF NOT IN ROOM
    if (!currentRoom) {
      joinRoom(roomId, username);
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

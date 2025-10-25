import React from "react";
import CodeEditor from "../components/codeeditor";
import ChatBox from "../components/chatbox";
import VideoSection from "../components/videosection";
import "./RoomPage.css";

export default function RoomPage() {
  return (
    <div className="room-page">
      <div className="main-area">
        <CodeEditor />
        <VideoSection />
      </div>
      <ChatBox />
    </div>
  );
}

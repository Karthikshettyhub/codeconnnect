import React, { useContext } from "react";
import { RoomContext } from "../contexts/roomcontext";
import "./VideoSection.css";

export default function VideoSection() {
  const { roomData, toggleVideo, toggleAudio } = useContext(RoomContext);

  return (
    <div className="video-section">
      <div className="video-placeholder">
        {roomData.videoEnabled ? "📹 Video On" : "📷 Video Off"}
      </div>
      <div className="video-controls">
        <button onClick={toggleVideo}>{roomData.videoEnabled ? "Turn Off Video" : "Turn On Video"}</button>
        <button onClick={toggleAudio}>{roomData.audioEnabled ? "Mute" : "Unmute"}</button>
      </div>
    </div>
  );
}

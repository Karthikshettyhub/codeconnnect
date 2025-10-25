import React, { useContext, useState } from "react";
import { RoomContext } from "../contexts/roomcontext";
import Button from "../components/button";
import "./HomePage.css";

export default function HomePage() {
  const { createRoom, joinRoom } = useContext(RoomContext);
  const [joinId, setJoinId] = useState("");

  return (
    <div className="home-container">
      <h1>Welcome to CollabRoom</h1>
      <div className="home-card">
        <Button text="Create Room" onClick={createRoom} />
        <div className="join-section">
          <input
            type="text"
            placeholder="Enter Room ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
          />
          <Button text="Join Room" onClick={() => joinRoom(joinId)} />
        </div>
      </div>
    </div>
  );
}

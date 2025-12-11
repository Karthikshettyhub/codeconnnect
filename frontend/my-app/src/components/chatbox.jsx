// frontend/src/components/chatbox.jsx
import React, { useState, useEffect, useRef } from "react";
import { useRoom } from "../contexts/roomcontext";
import socketService from "../services/socket";
import webrtcService from "../services/webrtc";
import "./chatbox.css";

/* 
  NOTE: original MediaRecorder chunk-based approach commented out below.
  We now use WebRTC local stream via webrtcService.startLocalStream()
*/

const ChatBox = ({ onLeave }) => {
  const { currentRoom, messages, sendMessage, username, isConnected } = useRoom();
  const [inputMessage, setInputMessage] = useState("");
  const [micOn, setMicOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Start WebRTC local audio (replaces MediaRecorder chunk method)
  const startLocalAudio = async () => {
    try {
      await webrtcService.startLocalStream();
      setIsRecording(true);
      console.log("🎤 WebRTC local audio started");
    } catch (err) {
      console.error("Mic error:", err);
      alert("Could not access microphone");
      setMicOn(false);
      setIsRecording(false);
    }
  };

  const stopLocalAudio = () => {
    webrtcService.stopLocalStream();
    setIsRecording(false);
    console.log("🎤 WebRTC local audio stopped");
  };

  const handleMicClick = () => {
    const newState = !micOn;
    setMicOn(newState);
    if (newState) startLocalAudio();
    else stopLocalAudio();
  };

  // keep cleanup on unmount
  useEffect(() => {
    return () => {
      if (micOn || isRecording) {
        stopLocalAudio();
      }
    };
  }, []);

  const handleSend = (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;
    if (!currentRoom) {
      alert("You must be in a room to send messages");
      return;
    }

    console.log("📤 Sending message:", inputMessage);
    sendMessage(inputMessage.trim());
    setInputMessage("");
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="chatbox">
      {/* Header */}
      <div className="chatbox-header">
        <div className="header-info">
          <h3>💬 Chat</h3>
          <span className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
            {isConnected ? "🟢" : "🔴"}
          </span>
        </div>
        <button className="leave-button" onClick={onLeave}>
          Leave
        </button>
      </div>

      {/* Messages */}
      <div className="chatbox-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet 👋</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div
              key={`${msg.username}-${msg.timestamp}-${idx}`}
              className={`message ${msg.isSystem ? "system-message" : ""} ${msg.username === username ? "own-message" : ""}`}
            >
              {msg.isSystem ? (
                <div className="system-content">{msg.message}</div>
              ) : (
                <>
                  <div className="message-header">
                    <span className="message-username">{msg.username}</span>
                    <span className="message-time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <div className="message-content">{msg.message}</div>
                </>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form className="chatbox-input" onSubmit={handleSend}>
        <input
          ref={inputRef}
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          disabled={!isConnected}
          maxLength={500}
        />

        <button type="button" className={`mic-button ${micOn ? "recording" : ""}`} onClick={handleMicClick}>
          {micOn ? "⏹️" : "🎤"}
        </button>

        <button type="submit" className="send-button" disabled={!isConnected || !inputMessage.trim()}>
          Send
        </button>
      </form>

      {/* Recording indicator */}
      {isRecording && (
        <div className="recording-indicator">
          <span className="recording-dot"></span>
          Recording...
        </div>
      )}

      {/* Optional: local preview audio element to confirm mic working (muted) */}
      <audio id="local-audio-preview" style={{ display: "none" }} />
    </div>
  );
};

export default ChatBox;

<<<<<<< HEAD
// frontend/src/components/chatbox.jsx
import React, { useState, useEffect, useRef } from "react";
import { useRoom } from "../contexts/roomcontext";
=======
// src/components/chatbox.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../contexts/roomcontext';
>>>>>>> bugfix-working-version
import socketService from "../services/socket";
import webrtcService from "../services/webrtc";
import "./chatbox.css";

<<<<<<< HEAD
/* 
  NOTE: original MediaRecorder chunk-based approach commented out below.
  We now use WebRTC local stream via webrtcService.startLocalStream()
*/

const ChatBox = ({ onLeave }) => {
  const { currentRoom, messages, sendMessage, username, isConnected } = useRoom();
  const [inputMessage, setInputMessage] = useState("");
  const [micOn, setMicOn] = useState(false);
=======
// =====================
// 🔊 WebRTC refs
// =====================
let pc = null;
let localStream = null;

const ChatBox = ({ onLeave }) => {
  const { currentRoom, messages, sendMessage, username, isConnected } = useRoom();
  const [inputMessage, setInputMessage] = useState('');
>>>>>>> bugfix-working-version
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

<<<<<<< HEAD
  // Auto-scroll
=======
  // =====================
  // AUTO SCROLL
  // =====================
>>>>>>> bugfix-working-version
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

<<<<<<< HEAD
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
=======
  // =====================
  // WEBRTC SOCKET LISTENERS
  // =====================
  useEffect(() => {
    socketService.listen("webrtc-offer", async ({ roomId, offer }) => {
      console.log("📩 WebRTC OFFER received");

      pc = createPeer(roomId);

      await pc.setRemoteDescription(offer);

      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log("📤 Sending WebRTC ANSWER");
      socketService.emit("webrtc-answer", { roomId, answer });
    });

    socketService.listen("webrtc-answer", async ({ answer }) => {
      console.log("✅ WebRTC ANSWER received");
      await pc.setRemoteDescription(answer);
    });

    socketService.listen("webrtc-ice", async ({ candidate }) => {
      if (candidate) {
        console.log("🧊 ICE candidate received");
        await pc.addIceCandidate(candidate);
      }
    });
  }, []);

  // =====================
  // CREATE PEER
  // =====================
  const createPeer = (roomId) => {
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 Sending ICE candidate");
        socketService.emit("webrtc-ice", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
      console.log("🔊 Remote audio stream received");
      const audio = document.createElement("audio");
      audio.srcObject = event.streams[0];
      audio.autoplay = true;
    };

    return peer;
  };

  // =====================
  // 🎤 MIC TOGGLE
  // =====================
  const toggleMic = async () => {
    if (!currentRoom) {
      alert("Join a room first");
      return;
    }

    if (!isRecording) {
      console.log("🎤 MIC STARTED");

      pc = createPeer(currentRoom);

      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      console.log("📨 Sending WebRTC OFFER");
      socketService.emit("webrtc-offer", {
        roomId: currentRoom,
        offer,
      });

      setIsRecording(true);
    } else {
      console.log("🔇 MIC STOPPED");

      localStream?.getTracks().forEach(t => t.stop());
      pc?.close();

      pc = null;
      localStream = null;

>>>>>>> bugfix-working-version
      setIsRecording(false);
    }
  };

<<<<<<< HEAD
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

=======
  // =====================
  // SEND MESSAGE
  // =====================
>>>>>>> bugfix-working-version
  const handleSend = (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;
    if (!currentRoom) {
      alert("You must be in a room to send messages");
      return;
    }

<<<<<<< HEAD
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
=======
    sendMessage(inputMessage.trim());
    setInputMessage('');
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
>>>>>>> bugfix-working-version
  };

  return (
    <div className="chatbox">
      <div className="chatbox-header">
<<<<<<< HEAD
        <div className="header-info">
          <h3>💬 Chat</h3>
          <span className={`connection-status ${isConnected ? "connected" : "disconnected"}`}>
            {isConnected ? "🟢" : "🔴"}
          </span>
        </div>
        <button className="leave-button" onClick={onLeave}>
          Leave
        </button>
=======
        <h3>💬 Chat</h3>
        <button onClick={onLeave}>Leave</button>
>>>>>>> bugfix-working-version
      </div>

      <div className="chatbox-messages">
<<<<<<< HEAD
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
=======
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.username === username ? 'own-message' : ''}`}
          >
            <div className="message-header">
              <span className="message-username">
                {msg.username || "Anonymous"}
              </span>
              <span className="message-time">
                {formatTime(msg.timestamp)}
              </span>
>>>>>>> bugfix-working-version
            </div>
            <div className="message-content">{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* ===================== */}
      {/* INPUT + MIC */}
      {/* ===================== */}
      <form className="chatbox-input" onSubmit={handleSend}>
        <input
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
        />

<<<<<<< HEAD
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
=======
        <button type="submit">Send</button>

        {/* 🎤 MIC BUTTON */}
        <button type="button" onClick={toggleMic}>
          {isRecording ? "🔴 Mic On" : "🎤 Mic"}
        </button>
      </form>
>>>>>>> bugfix-working-version
    </div>
  );
};

export default ChatBox;

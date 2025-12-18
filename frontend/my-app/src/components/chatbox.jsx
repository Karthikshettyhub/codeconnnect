// src/components/chatbox.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../contexts/roomcontext';
import socketService from "../services/socket";
import * as webrtcService from "../services/webrtc";
import "./chatbox.css";

// =====================
// 🔊 WebRTC refs
// =====================
let pc = null;
let localStream = null;

const ChatBox = ({ onLeave }) => {
  const { currentRoom, messages, sendMessage, username, isConnected } = useRoom();
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // =====================
  // AUTO SCROLL
  // =====================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

      setIsRecording(false);
    }
  };

  // =====================
  // SEND MESSAGE
  // =====================
  const handleSend = (e) => {
    e.preventDefault();

    if (!inputMessage.trim()) return;
    if (!currentRoom) {
      alert("You must be in a room to send messages");
      return;
    }

    sendMessage(inputMessage.trim());
    setInputMessage('');
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <h3>💬 Chat</h3>
        <button onClick={onLeave}>Leave</button>
      </div>

      <div className="chatbox-messages">
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

        <button type="submit">Send</button>

        {/* 🎤 MIC BUTTON */}
        <button type="button" onClick={toggleMic}>
          {isRecording ? "🔴 Mic On" : "🎤 Mic"}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
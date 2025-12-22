// src/components/chatbox.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../contexts/roomcontext';
import socketService from "../services/socket";
import "./chatbox.css";

// =====================
// 🔊 WebRTC refs
// =====================
let pc = null;
let localStream = null;

const ChatBox = ({ onLeave }) => {
  const { currentRoom, messages, sendMessage, username } = useRoom();
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
  // WEBRTC SOCKET LISTENERS (LOCAL ONLY)
  // =====================
  useEffect(() => {
    const handleOffer = async ({ roomId, offer }) => {
      pc = createPeer(roomId);

      await pc.setRemoteDescription(offer);

      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.getTracks().forEach(track =>
        pc.addTrack(track, localStream)
      );

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketService.emit("webrtc-answer", { roomId, answer });
    };

    const handleAnswer = async ({ answer }) => {
      if (pc) await pc.setRemoteDescription(answer);
    };

    const handleIce = async ({ candidate }) => {
      if (candidate && pc) await pc.addIceCandidate(candidate);
    };

    socketService.listen("webrtc-offer", handleOffer);
    socketService.listen("webrtc-answer", handleAnswer);
    socketService.listen("webrtc-ice", handleIce);

    // ✅ CLEANUP ONLY WEBRTC (NOT GLOBAL SOCKET)
    return () => {
      localStream?.getTracks().forEach(t => t.stop());
      pc?.close();

      pc = null;
      localStream = null;
      setIsRecording(false);
    };
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
        socketService.emit("webrtc-ice", {
          roomId,
          candidate: event.candidate,
        });
      }
    };

    peer.ontrack = (event) => {
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
    if (!currentRoom) return;

    if (!isRecording) {
      pc = createPeer(currentRoom);

      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.getTracks().forEach(track =>
        pc.addTrack(track, localStream)
      );

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketService.emit("webrtc-offer", {
        roomId: currentRoom,
        offer,
      });

      setIsRecording(true);
    } else {
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
    sendMessage(inputMessage.trim());
    setInputMessage('');
  };

  const formatTime = (timestamp) =>
    new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

  // =====================
  // 🔥 LEAVE ROOM (FIXED)
  // =====================
  const handleLeaveClick = () => {
    localStream?.getTracks().forEach(t => t.stop());
    pc?.close();

    pc = null;
    localStream = null;
    setIsRecording(false);

    onLeave(); // ✅ redirect works now
  };

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <h3>💬 Chat</h3>
        <button onClick={handleLeaveClick}>Leave</button>
      </div>

      <div className="chatbox-messages">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${
              msg.username === username ? 'own-message' : ''
            }`}
          >
            <div className="message-header">
              <span>{msg.username}</span>
              <span>{formatTime(msg.timestamp)}</span>
            </div>
            <div>{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chatbox-input" onSubmit={handleSend}>
        <input
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
        <button type="button" onClick={toggleMic}>
          {isRecording ? "🔴 Mic On" : "🎤 Mic"}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;

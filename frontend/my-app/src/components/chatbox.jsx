import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../contexts/roomcontext';
import socketService from "../services/socket";
import './chatbox.css';

let mediaRecorder = null;
let audioContext = new AudioContext();

const ChatBox = ({ onLeave }) => {
  const { currentRoom, messages, sendMessage, username } = useRoom();
  const [inputMessage, setInputMessage] = useState('');
  const [micOn, setMicOn] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ========= 🎤 START VOICE =========
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm"
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          event.data.arrayBuffer().then((buffer) => {
            socketService.sendVoiceChunk(
              currentRoom,
              username,
              Array.from(new Uint8Array(buffer))
            );
          });
        }
      };

      mediaRecorder.start(200);
      socketService.sendVoiceStart(currentRoom, username);

    } catch (err) {
      console.log("Mic error:", err);
    }
  };

  // ========= ❌ STOP VOICE =========
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder = null;
    }
    socketService.sendVoiceStop(currentRoom, username);
  };

  // MIC BUTTON
  const handleMicClick = () => {
    const newState = !micOn;
    setMicOn(newState);

    if (newState) startRecording();
    else stopRecording();
  };

  // SEND MESSAGE
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    sendMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="chatbox">

      <div className="chatbox-header">
        <h3>💬 Chat</h3>
        <button className="leave-button" onClick={onLeave}>Leave</button>
      </div>

      <div className="chatbox-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.username === username ? "own-message" : ""}`}>
            <div className="message-header">
              <span>{msg.username}</span>
              <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
            </div>
            <div className="message-content">{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="chatbox-input" onSubmit={handleSend}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
        />

        <button type="button" className="mic-button" onClick={handleMicClick}>
          {micOn ? "❌" : "🎤"}
        </button>

        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatBox;

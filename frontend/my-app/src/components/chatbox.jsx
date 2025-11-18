// src/components/chatbox.jsx - FIXED DUPLICATES
import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../contexts/roomcontext';
import socketService from "../services/socket";
import './chatbox.css';

let mediaRecorder = null;
let audioContext = null;

const ChatBox = ({ onLeave }) => {
  const { currentRoom, messages, sendMessage, username, isConnected } = useRoom();
  const [inputMessage, setInputMessage] = useState('');
  const [micOn, setMicOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize audio context
  const initAudioContext = () => {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      initAudioContext();
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") 
          ? "audio/webm" 
          : "audio/ogg"
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && currentRoom && username) {
          event.data.arrayBuffer().then((buffer) => {
            socketService.sendVoiceChunk(
              currentRoom,
              username,
              Array.from(new Uint8Array(buffer))
            );
          });
        }
      };

      mediaRecorder.onerror = (error) => {
        console.error("MediaRecorder error:", error);
        stopRecording();
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      socketService.sendVoiceStart(currentRoom, username);
      console.log("🎤 Recording started");
    } catch (err) {
      console.error("Mic error:", err);
      alert("Could not access microphone");
      setMicOn(false);
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      if (mediaRecorder.stream) {
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
      }
      mediaRecorder = null;
    }
    setIsRecording(false);
    if (currentRoom && username) {
      socketService.sendVoiceStop(currentRoom, username);
    }
    console.log("🎤 Recording stopped");
  };

  const handleMicClick = () => {
    const newState = !micOn;
    setMicOn(newState);
    if (newState) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  // ⭐ CRITICAL: Just send message, don't add locally
  const handleSend = (e) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    if (!currentRoom) {
      alert("You must be in a room to send messages");
      return;
    }

    console.log('📤 Sending message:', inputMessage);
    
    // IMPORTANT: Only send to server
    // Server will broadcast to everyone (including sender)
    // Do NOT add to messages array here!
    sendMessage(inputMessage.trim());
    
    // Clear input
    setInputMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (micOn || isRecording) {
        stopRecording();
      }
    };
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chatbox">
      {/* Header */}
      <div className="chatbox-header">
        <div className="header-info">
          <h3>💬 Chat</h3>
          <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢' : '🔴'}
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
              className={`message ${msg.isSystem ? 'system-message' : ''} ${msg.username === username ? 'own-message' : ''}`}
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
        
        <button 
          type="button" 
          className={`mic-button ${micOn ? 'recording' : ''}`}
          onClick={handleMicClick}
        >
          {micOn ? "⏹️" : "🎤"}
        </button>
        
        <button 
          type="submit" 
          className="send-button"
          disabled={!isConnected || !inputMessage.trim()}
        >
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
    </div>
  );
};

export default ChatBox;
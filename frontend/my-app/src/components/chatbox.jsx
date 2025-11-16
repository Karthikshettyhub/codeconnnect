import React, { useState, useEffect, useRef } from 'react';
import { useRoom } from '../contexts/roomcontext';
import './chatbox.css';

const ChatBox = ({ onLeave }) => {
  const { messages, sendMessage, username } = useRoom();
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    sendMessage(inputMessage);
    setInputMessage('');
  };

  return (
    <div className="chatbox">
      {/* === Header with Leave Button === */}
      <div className="chatbox-header">
        <h3> Chat</h3>
        <button className="leave-button" onClick={onLeave}>
          Leave
        </button>
      </div>

      {/* === Chat Messages === */}
      <div className="chatbox-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message 
              ${msg.isSystem ? 'system-message' : ''} 
              ${msg.username === username ? 'own-message' : ''}`}
          >
            {!msg.isSystem && (
              <div className="message-header">
                <span className="message-username">{msg.username}</span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            )}
            <div className="message-content">{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* === Input Box === */}
      <form className="chatbox-input" onSubmit={handleSend}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatBox;

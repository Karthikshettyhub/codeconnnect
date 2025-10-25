import React, { useState, useRef, useEffect } from 'react';
import './chatbox.css';

const ChatBox = ({ roomId }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      author: 'System',
      text: 'Welcome to the chat! Start collaborating with your team.',
      timestamp: new Date().toISOString(),
      isSystem: true
    },
    {
      id: 2,
      author: 'You',
      text: 'Hey everyone! Ready to code?',
      timestamp: new Date().toISOString(),
      isSystem: false
    },
    {
      id: 3,
      author: 'User2',
      text: 'Yes! Let\'s get started.',
      timestamp: new Date().toISOString(),
      isSystem: false
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      const newMessage = {
        id: messages.length + 1,
        author: 'You',
        text: inputValue,
        timestamp: new Date().toISOString(),
        isSystem: false
      };
      setMessages([...messages, newMessage]);
      setInputValue('');
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getInitials = (name) => {
    return name.substring(0, 2).toUpperCase();
  };

  const getAvatarColor = (name) => {
    const colors = [
      'linear-gradient(135deg, #5865f2, #7289da)',
      'linear-gradient(135deg, #3ba55d, #2d7d46)',
      'linear-gradient(135deg, #faa61a, #f26522)',
      'linear-gradient(135deg, #ed4245, #c93a3c)',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="chatbox-container">
      <div className="chatbox-header">
        <div className="chatbox-title">
          <span>💬</span>
          <span>Chat</span>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id}>
            {message.isSystem ? (
              <div className="message-date-divider">
                <div className="divider-line"></div>
                <div className="divider-text">{message.text}</div>
                <div className="divider-line"></div>
              </div>
            ) : (
              <div className="chat-message">
                <div 
                  className="message-avatar"
                  style={{ background: getAvatarColor(message.author) }}
                >
                  {getInitials(message.author)}
                </div>
                <div className="message-content">
                  <div className="message-header">
                    <span className="message-author">{message.author}</span>
                    <span className="message-timestamp">
                      {formatTimestamp(message.timestamp)}
                    </span>
                  </div>
                  <div className="message-text">{message.text}</div>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-container">
        <div className="chat-actions">
          <button className="chat-action-btn">📎 File</button>
          <button className="chat-action-btn">😊 Emoji</button>
        </div>
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message in room ${roomId}`}
            rows="1"
          />
          <button
            className="chat-send-btn"
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatBox;
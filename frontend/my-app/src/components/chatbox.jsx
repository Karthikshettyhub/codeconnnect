import React, { useContext, useState, useRef, useEffect } from "react";
import { RoomContext } from "../contexts/roomcontext";
import "./ChatBox.css";

export default function ChatBox() {
  const { roomData, addMessage } = useContext(RoomContext);
  const [messageText, setMessageText] = useState(""); // ✅ string
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [roomData.messages]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      addMessage("You", messageText);
      setMessageText("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="chat-box">
      <div className="chat-header">
        <h3>Chat</h3>
      </div>
      <div className="chat-messages">
        {roomData.messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${msg.user === "You" ? "own" : "other"}`}
          >
            <div className="message-user">{msg.user}</div>
            <div className="message-text">{msg.text}</div>
            <div className="message-time">
              {msg.timestamp.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chat-input-area">
        <textarea
          className="chat-input"
          placeholder="Type a message..."
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={handleKeyPress}
          rows="2"
        />
        <button className="send-btn" onClick={handleSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
}

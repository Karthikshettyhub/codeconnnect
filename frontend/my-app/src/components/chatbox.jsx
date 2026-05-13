import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import { useRoom } from "../contexts/roomcontext";

import "./chatbox.css";

const ChatBox = () => {

  const {
    messages,
    sendMessage,
    username,
  } = useRoom();

  const [
    inputMessage,
    setInputMessage,
  ] = useState("");

  const messagesEndRef =
    useRef(null);

  // AUTO SCROLL
  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);

  // SEND MESSAGE
  const handleSend = (e) => {

    e.preventDefault();

    if (
      !inputMessage.trim()
    ) {
      return;
    }

    sendMessage(
      inputMessage.trim()
    );

    setInputMessage("");
  };

  return (

    <div className="chatbox">

      <div className="chatbox-header">
        <h3>💬 Chat</h3>
      </div>

      <div className="chatbox-messages">

        {messages.map(
          (msg, idx) => {

            const isOwn =
              username &&
              msg.username ===
                username;

            return (

              <div
                key={idx}
                className={`message ${
                  isOwn
                    ? "own-message"
                    : ""
                }`}
              >

                <div className="message-header">

                  <span className="message-username">
                    {msg.username}
                  </span>

                </div>

                <div className="message-content">
                  {msg.message}
                </div>

              </div>
            );
          }
        )}

        <div ref={messagesEndRef} />

      </div>

      <form
        onSubmit={handleSend}
        className="chatbox-input"
      >

        <input
          value={inputMessage}
          onChange={(e) =>
            setInputMessage(
              e.target.value
            )
          }
          placeholder="Type a message..."
        />

        <button type="submit">
          Send
        </button>

      </form>

    </div>
  );
};

export default ChatBox;
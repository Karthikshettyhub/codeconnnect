import React, {
  useState,
  useEffect,
  useRef,
} from "react";

import { useRoom } from "../contexts/roomcontext";

import socketService from "../services/socket";

import "./chatbox.css";

const ChatBox = () => {

  const {
    messages,
    sendMessage,
    username,
    currentRoom,
  } = useRoom();

  const [
    inputMessage,
    setInputMessage,
  ] = useState("");

  const messagesEndRef =
    useRef(null);

  // =========================
  // DEBUG LOGS
  // =========================

  useEffect(() => {

    console.log(
      "🟢 CHATBOX RENDER"
    );

    console.log(
      "currentRoom:",
      currentRoom
    );

    console.log(
      "username:",
      username
    );

    console.log(
      "socket connected:",
      socketService.socket?.connected
    );

    console.log(
      "socket id:",
      socketService.socket?.id
    );

    console.log(
      "messages length:",
      messages?.length
    );

  }, [
    currentRoom,
    username,
    messages,
  ]);

  // =========================
  // AUTO SCROLL
  // =========================

  useEffect(() => {

    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [messages]);

  // =========================
  // SEND MESSAGE
  // =========================

  const handleSend = async (e) => {

    e.preventDefault();

    console.log(
      "📤 SEND CLICKED"
    );

    console.log(
      "INPUT:",
      inputMessage
    );

    console.log(
      "ROOM:",
      currentRoom
    );

    console.log(
      "USERNAME:",
      username
    );

    console.log(
      "SOCKET CONNECTED:",
      socketService.socket?.connected
    );

    console.log(
      "SOCKET ID:",
      socketService.socket?.id
    );

    if (
      !inputMessage.trim()
    ) {

      console.log(
        "❌ EMPTY MESSAGE"
      );

      return;
    }

    try {

      await sendMessage(
        inputMessage.trim()
      );

      console.log(
        "✅ MESSAGE SENT FUNCTION CALLED"
      );

      setInputMessage("");

    } catch (err) {

      console.error(
        "❌ SEND ERROR:",
        err
      );
    }
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
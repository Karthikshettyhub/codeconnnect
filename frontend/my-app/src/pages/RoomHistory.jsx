import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./RoomHistory.css";

const RoomHistory = () => {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch(`http://localhost:5005/api/rooms/history/${roomId}`, {
          credentials: "include",
        });

        if (res.status === 401) {
          setError("Please login first");
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch history");

        const data = await res.json();
        setMessages(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [roomId]);

  if (loading) return <div className="loading-state">Loading chat history...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div className="history-container">
      <nav className="navbar">
        <h2 className="nav-logo" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>CodeCollab</h2>
        <div className="nav-title">History: #{roomId}</div>
        <div className="nav-right">
          <button className="back-btn" onClick={() => navigate("/my-rooms")}>Back to Rooms</button>
        </div>
      </nav>

      <div className="history-chat-box">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages found in this room.</p>
          </div>
        ) : (
          <div className="message-list">
            {messages.map((msg, index) => (
              <div key={index} className="message-item">
                <div className="message-header">
                  <span className="msg-user">{msg.username}</span>
                  <span className="msg-time">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <div className="msg-content">{msg.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoomHistory;

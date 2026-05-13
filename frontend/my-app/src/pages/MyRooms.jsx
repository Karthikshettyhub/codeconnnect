import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./MyRooms.css";

const MyRooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await fetch("http://localhost:5005/api/rooms/my-rooms", {
          credentials: "include",
        });
        
        if (res.status === 401) {
          setError("Please login first");
          setLoading(false);
          return;
        }

        if (!res.ok) throw new Error("Failed to fetch rooms");

        const data = await res.json();
        setRooms(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  if (loading) return <div className="loading-state">Loading your rooms...</div>;
  if (error) return <div className="error-state">{error}</div>;

  return (
    <div className="my-rooms-container">
      <nav className="navbar">
        <h2 className="nav-logo" onClick={() => navigate("/")} style={{ cursor: 'pointer' }}>CodeCollab</h2>
        <div className="nav-title">My Rooms</div>
        <div className="nav-right">
          <button className="back-btn" onClick={() => navigate("/")}>Back to Home</button>
        </div>
      </nav>

      <div className="rooms-grid">
        {rooms.length === 0 ? (
          <div className="empty-state">
            <h3>No rooms found</h3>
            <p>You haven't created or joined any rooms yet.</p>
            <button className="create-btn" onClick={() => navigate("/")}>Create a Room</button>
          </div>
        ) : (
          rooms.map((room) => (
            <div 
              key={room.roomId} 
              className="room-card"
              onClick={() => navigate(`/room-history/${room.roomId}`)}
            >
              <div className="room-card-header">
                <span className="room-id">#{room.roomId}</span>
                <span className="room-date">{new Date(room.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="room-card-body">
                <div className="room-stat">
                  <span className="stat-label">Messages</span>
                  <span className="stat-value">{room.messageCount}</span>
                </div>
                <div className="room-stat">
                  <span className="stat-label">Active Users</span>
                  <span className="stat-value">{room.userCount}</span>
                </div>
              </div>
              <div className="room-card-footer">
                View Chat History ➔
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default MyRooms;

import React, { useState } from 'react';
import './App.css';
import Homepage from './pages/homepage';
import RoomPage from './pages/roompage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [currentRoomId, setCurrentRoomId] = useState(null);

  const handleJoinRoom = (roomId) => {
    setCurrentRoomId(roomId);
    setCurrentPage('room');
  };

  const handleCreateRoom = (roomId) => {
    setCurrentRoomId(roomId);
    setCurrentPage('room');
  };

  const handleLeaveRoom = () => {
    setCurrentRoomId(null);
    setCurrentPage('home');
  };

  return (
    <RoomProvider>
      {/* <Homepage /> */}
      <RoomPage />
    </RoomProvider>

  )
    <div className="app">
      {currentPage === 'home' ? (
        <Homepage 
          onJoinRoom={handleJoinRoom}
          onCreateRoom={handleCreateRoom}
        />
      ) : (
        <RoomPage 
          roomId={currentRoomId}
          onLeave={handleLeaveRoom}
        />
      )}
    </div>
  );
}

export default App;
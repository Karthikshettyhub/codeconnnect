import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/homepage";
import RoomPage from "./pages/roompage";
import MyRooms from "./pages/MyRooms";
import RoomHistory from "./pages/RoomHistory";
import { RoomProvider } from "./contexts/roomcontext";

function App() {
  return (
      <Router>
        <RoomProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
            <Route path="/my-rooms" element={<MyRooms />} />
            <Route path="/room-history/:roomId" element={<RoomHistory />} />
          </Routes>
        </div>
        </RoomProvider>
      </Router>
  );
}

export default App;

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./pages/homepage";
import RoomPage from "./pages/roompage";
import { RoomProvider } from "./contexts/roomcontext";

function App() {
  return (
    <RoomProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/room/:roomId" element={<RoomPage />} />
          </Routes>
        </div>
      </Router>
    </RoomProvider>
  );
}

export default App;

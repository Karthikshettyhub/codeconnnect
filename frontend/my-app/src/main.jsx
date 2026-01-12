import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  
    <App />
  
);

// Note: When integrating with backend later:
// 1. Add Socket.IO client for real-time collaboration
// 2. Add WebRTC for video/audio streaming
// 3. Add state management (Context API or Redux)
// 4. Add authentication
// 5. Connect API endpoints for room management
import React, { createContext, useContext, useState, useEffect } from 'react';
import socketService from '../services/socket';

const RoomContext = createContext();

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within RoomProvider');
  }
  return context;
};

export const RoomProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [code, setCode] = useState('');

  useEffect(() => {
    // Connect to socket
    socketService.connect();
    setIsConnected(true);

    // --------------------------------------------
    // ⭐ AUTO REJOIN ROOM AFTER REFRESH
    // --------------------------------------------
    const savedRoom = localStorage.getItem("currentRoom");
    const savedUser = localStorage.getItem("username");

    if (savedRoom && savedUser) {
      console.log("🔄 Auto-Rejoining room after refresh:", savedRoom);

      setCurrentRoom(savedRoom);
      setUsername(savedUser);

      socketService.joinRoom(savedRoom, savedUser); // IMPORTANT
    }
    // --------------------------------------------

    // Room created event
    socketService.onRoomCreated((data) => {
      setCurrentRoom(data.roomId);
      setUsers(data.users);

      // Save for refresh
      localStorage.setItem("currentRoom", data.roomId);
      localStorage.setItem("username", data.username);
    });

    // Room joined event
    socketService.onRoomJoined((data) => {
      setCurrentRoom(data.roomId);
      setUsers(data.users);

      // Save for refresh
      localStorage.setItem("currentRoom", data.roomId);
    });

    // User joined room
    socketService.onUserJoined((data) => {
      setUsers((prev) => [...prev, { username: data.username }]);
      addSystemMessage(`${data.username} joined the room`);
    });

    socketService.onUserLeft((data) => {
      setUsers((prev) => prev.filter((u) => u.username !== data.username));
      addSystemMessage(`${data.username} left the room`);
    });

    // Chat message received
    socketService.onReceiveMessage((data) => {
      setMessages((prev) => [...prev, data]);
    });

    // Code received
    socketService.onCodeReceive((data) => {
      setCode(data.code);
    });

    socketService.onError((data) => {
      console.error('Socket error:', data.message);
      alert(data.message);
    });

    // Cleanup
    return () => {
      socketService.disconnect();
      setIsConnected(false);
    };
  }, []);

  // System message
  const addSystemMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        username: 'System',
        message: text,
        timestamp: Date.now(),
        isSystem: true,
      },
    ]);
  };

  // Create room
  const createRoom = (roomId, userName) => {
    setUsername(userName);
    setCurrentRoom(roomId);

    localStorage.setItem("currentRoom", roomId);
    localStorage.setItem("username", userName);

    socketService.createRoom(roomId, userName);
  };

  // Join room
  const joinRoom = (roomId, userName) => {
    setUsername(userName);
    setCurrentRoom(roomId);

    localStorage.setItem("currentRoom", roomId);
    localStorage.setItem("username", userName);

    socketService.joinRoom(roomId, userName);
  };

  // Leave room
  const leaveRoom = () => {
    if (currentRoom && username) {
      socketService.leaveRoom(currentRoom, username);
    }

    localStorage.removeItem("currentRoom");
    localStorage.removeItem("username");

    setCurrentRoom(null);
    setUsers([]);
    setMessages([]);
  };

  // Send chat message
  const sendMessage = (message) => {
    if (!message.trim()) return;

    socketService.sendMessage(currentRoom, username, message);
  };

  // Send realtime code
  const sendCode = (newCode) => {
    if (currentRoom) {
      socketService.sendCode(currentRoom, newCode);
    }
  };

  const value = {
    currentRoom,
    users,
    messages,
    username,
    isConnected,
    createRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    code,
    sendCode,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

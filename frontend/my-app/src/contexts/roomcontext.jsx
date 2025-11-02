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

  useEffect(() => {
    // Connect to socket when component mounts
    socketService.connect();
    setIsConnected(true);

    // Setup event listeners
    socketService.onRoomCreated((data) => {
      console.log('Room created:', data);
      setCurrentRoom(data.roomId);
      setUsers(data.users);
    });

    socketService.onRoomJoined((data) => {
      console.log('Room joined:', data);
      setCurrentRoom(data.roomId);
      setUsers(data.users);
    });

    socketService.onUserJoined((data) => {
      console.log('User joined:', data.username);
      setUsers((prev) => [...prev, { username: data.username }]);
      addSystemMessage(`${data.username} joined the room`);
    });

    socketService.onUserLeft((data) => {
      console.log('User left:', data.username);
      setUsers((prev) => prev.filter((u) => u.username !== data.username));
      addSystemMessage(`${data.username} left the room`);
    });

    socketService.onReceiveMessage((data) => {
      console.log('Message received:', data);
      setMessages((prev) => [...prev, data]);
    });

    socketService.onError((data) => {
      console.error('Socket error:', data.message);
      alert(data.message);
    });

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
      setIsConnected(false);
    };
  }, []);

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

  const createRoom = (roomId, userName) => {
    setUsername(userName);
    socketService.createRoom(roomId, userName);
  };

  const joinRoom = (roomId, userName) => {
    setUsername(userName);
    socketService.joinRoom(roomId, userName);
  };

  const leaveRoom = () => {
    if (currentRoom && username) {
      socketService.leaveRoom(currentRoom, username);
      setCurrentRoom(null);
      setUsers([]);
      setMessages([]);
    }
  };

  const sendMessage = (message) => {
    if (currentRoom && username && message.trim()) {
      socketService.sendMessage(currentRoom, username, message);
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
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};
// src/contexts/roomcontext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import socketService from '../services/socket';

const RoomContext = createContext();

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRoom must be used within RoomProvider');
  return context;
};

export const RoomProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [code, setCode] = useState('');

  const listenersSetup = useRef(false);

  useEffect(() => {
    if (listenersSetup.current) return;
    listenersSetup.current = true;

    socketService.connect();
    setIsConnected(true);

    // Restore only on page refresh (same tab)
    const savedRoom = sessionStorage.getItem("currentRoom");
    const savedUser = sessionStorage.getItem("username");

    if (savedRoom && savedUser) {
      setCurrentRoom(savedRoom);
      setUsername(savedUser);

      setTimeout(() => {
        socketService.joinRoom(savedRoom, savedUser);
      }, 400);
    }

    // ================================
    // SOCKET LISTENERS
    // ================================

    const handleRoomCreated = (data) => {
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);

      sessionStorage.setItem("currentRoom", data.roomId);
      sessionStorage.setItem("username", data.username);
    };

    const handleRoomJoined = (data) => {
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);

      sessionStorage.setItem("currentRoom", data.roomId);
    };

    const handleUserJoined = (data) => {
      setUsers(prev => {
        if (prev.some(u => u.username === data.username)) return prev;
        return [...prev, { username: data.username }];
      });

      setMessages(prev => [
        ...prev,
        {
          username: "System",
          message: `${data.username} joined`,
          timestamp: Date.now(),
          isSystem: true
        }
      ]);
    };

    const handleUserLeft = (data) => {
      setUsers(prev => prev.filter(u => u.username !== data.username));
      setMessages(prev => [
        ...prev,
        {
          username: "System",
          message: `${data.username} left`,
          timestamp: Date.now(),
          isSystem: true
        }
      ]);
    };

    const handleReceiveMessage = (data) => {
      setMessages(prev => {
        const id = `${data.username}-${data.timestamp}-${data.message}`;
        if (prev.some(msg => `${msg.username}-${msg.timestamp}-${msg.message}` === id))
          return prev;
        return [...prev, data];
      });
    };

    const handleCodeReceive = (data) => setCode(data.code);

    const handleError = (data) => {
      alert(data.message);
    };

    socketService.onRoomCreated(handleRoomCreated);
    socketService.onRoomJoined(handleRoomJoined);
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);
    socketService.onReceiveMessage(handleReceiveMessage);
    socketService.onCodeReceive(handleCodeReceive);
    socketService.onError(handleError);

    return () => {
      socketService.disconnect();
      listenersSetup.current = false;
      setIsConnected(false);
    };
  }, []);

  // ================================
  // FIXED FUNCTIONS
  // ================================

  const createRoom = (roomId, userName) => {
    setUsername(userName);

    // ❌ DO NOT setCurrentRoom here
    // Wait for server confirmation

    socketService.createRoom(roomId, userName);
  };

  const joinRoom = (roomId, userName) => {
    setUsername(userName);

    // ❌ DO NOT setCurrentRoom here
    // If room doesn't exist → No redirect

    socketService.joinRoom(roomId, userName);
  };

  const leaveRoom = () => {
    if (currentRoom && username) {
      socketService.leaveRoom(currentRoom, username);
    }

    sessionStorage.clear();

    setCurrentRoom(null);
    setUsers([]);
    setMessages([]);
    setCode('');
  };

  const sendMessage = (message) => {
    if (!message.trim()) return;
    socketService.sendMessage(currentRoom, username, message);
  };

  const sendCodeTimeout = useRef(null);
  const sendCode = (newCode) => {
    setCode(newCode);

    if (sendCodeTimeout.current) clearTimeout(sendCodeTimeout.current);

    sendCodeTimeout.current = setTimeout(() => {
      socketService.sendCode(currentRoom, newCode);
    }, 300);
  };

  return (
    <RoomContext.Provider
      value={{
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
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

// src/contexts/roomcontext.jsx - FINAL MERGED VERSION
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

    const savedRoom = sessionStorage.getItem("currentRoom");
    const savedUser = sessionStorage.getItem("username");

    if (savedRoom && savedUser) {
      setCurrentRoom(savedRoom);
      setUsername(savedUser);

      setTimeout(() => {
        socketService.joinRoom(savedRoom, savedUser);
      }, 400);
    }

    const handleRoomCreated = (data) => {
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || '');

      sessionStorage.setItem("currentRoom", data.roomId);
      sessionStorage.setItem("username", data.username);
    };

    const handleRoomJoined = (data) => {
      console.log('📥 Restored history:', {
        messages: data.messages?.length || 0,
        codeLength: data.code?.length || 0
      });

      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || '');

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
    const handleError = (data) => alert(data.message);

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

  const createRoom = (roomId, userName) => {
    setUsername(userName);
    socketService.createRoom(roomId, userName);
  };

  const joinRoom = (roomId, userName) => {
    setUsername(userName);
    socketService.joinRoom(roomId, userName);
  };

  const leaveRoom = () => {
    sessionStorage.removeItem("currentRoom");
    sessionStorage.removeItem("username");
    socketService.leaveRoom(currentRoom, username);
    setCurrentRoom(null);
    setMessages([]);
    setUsers([]);
  };

  const sendMessage = (message) => {
    if (!currentRoom) return;
    socketService.sendMessage(currentRoom, username, message);
  };

  const updateCodeRemote = (updatedCode) => {
    setCode(updatedCode);
    socketService.sendCode(currentRoom, updatedCode);
  };

  return (
    <RoomContext.Provider value={{
      currentRoom,
      users,
      messages,
      username,
      createRoom,
      joinRoom,
      leaveRoom,
      sendMessage,
      code,
      updateCodeRemote,
      isConnected
    }}>
      {children}
    </RoomContext.Provider>
  );
};

import React, { createContext, useContext, useState, useEffect } from 'react';

const RoomContext = createContext();

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
};

export const RoomProvider = ({ children }) => {
  const [roomId, setRoomId] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [isConnected, setIsConnected] = useState(false);

  // Placeholder for Socket.IO connection
  useEffect(() => {
    if (roomId) {
      // TODO: Connect to Socket.IO server
      // const socket = io('your-backend-url');
      
      // socket.on('connect', () => {
      //   setIsConnected(true);
      //   socket.emit('join-room', roomId);
      // });
      
      // socket.on('user-joined', (user) => {
      //   setUsers(prev => [...prev, user]);
      // });
      
      // socket.on('user-left', (userId) => {
      //   setUsers(prev => prev.filter(u => u.id !== userId));
      // });
      
      // socket.on('code-change', (newCode) => {
      //   setCode(newCode);
      // });
      
      // socket.on('new-message', (message) => {
      //   setMessages(prev => [...prev, message]);
      // });
      
      // return () => socket.disconnect();
    }
  }, [roomId]);

  const joinRoom = (id) => {
    setRoomId(id);
  };

  const leaveRoom = () => {
    setRoomId(null);
    setUsers([]);
    setMessages([]);
    setCode('');
    setIsConnected(false);
  };

  const sendMessage = (message) => {
    // TODO: Emit to socket
    // socket.emit('send-message', { roomId, message });
    setMessages(prev => [...prev, message]);
  };

  const updateCode = (newCode) => {
    // TODO: Emit to socket
    // socket.emit('code-change', { roomId, code: newCode });
    setCode(newCode);
  };

  const changeLanguage = (newLanguage) => {
    // TODO: Emit to socket
    // socket.emit('language-change', { roomId, language: newLanguage });
    setLanguage(newLanguage);
  };

  const value = {
    roomId,
    users,
    messages,
    code,
    language,
    isConnected,
    joinRoom,
    leaveRoom,
    sendMessage,
    updateCode,
    changeLanguage,
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

export default RoomContext;
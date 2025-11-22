<<<<<<< HEAD
// src/contexts/roomcontext.jsx - FIXED WITH HISTORY LOADING
=======
// src/contexts/roomcontext.jsx
>>>>>>> 985c544244c31a0970545564036a76a881d76c5b
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
<<<<<<< HEAD
  
  const listenersSetup = useRef(false);

  useEffect(() => {
    if (listenersSetup.current) {
      console.log('⚠️ Listeners already setup, skipping...');
      return;
    }
    
=======

  const listenersSetup = useRef(false);

  useEffect(() => {
    if (listenersSetup.current) return;
>>>>>>> 985c544244c31a0970545564036a76a881d76c5b
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

<<<<<<< HEAD
    // ========================================
    // SOCKET EVENT LISTENERS
    // ========================================
=======
    // ================================
    // SOCKET LISTENERS
    // ================================
>>>>>>> 985c544244c31a0970545564036a76a881d76c5b

    const handleRoomCreated = (data) => {
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
<<<<<<< HEAD
      
      // 🔥 Initialize with empty messages/code (new room)
      setMessages(data.messages || []);
      setCode(data.code || '');
      
      localStorage.setItem("currentRoom", data.roomId);
      localStorage.setItem("username", data.username);
=======

      sessionStorage.setItem("currentRoom", data.roomId);
      sessionStorage.setItem("username", data.username);
>>>>>>> 985c544244c31a0970545564036a76a881d76c5b
    };

    const handleRoomJoined = (data) => {
<<<<<<< HEAD
      console.log('✅ Room joined:', data.roomId);
      console.log('📥 Received history:', {
        messages: data.messages?.length || 0,
        codeLength: data.code?.length || 0,
        users: data.users?.length || 0
      });
      
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      
      // 🔥 Load message history from backend
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
        console.log('✅ Loaded', data.messages.length, 'messages from backend');
      } else {
        setMessages([]);
      }
      
      // 🔥 Load code from backend
      if (data.code) {
        setCode(data.code);
        console.log('✅ Loaded code from backend (', data.code.length, 'chars)');
      } else {
        setCode('');
      }
      
      localStorage.setItem("currentRoom", data.roomId);
=======
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);

      sessionStorage.setItem("currentRoom", data.roomId);
>>>>>>> 985c544244c31a0970545564036a76a881d76c5b
    };

    const handleUserJoined = (data) => {
      setUsers(prev => {
        if (prev.some(u => u.username === data.username)) return prev;
        return [...prev, { username: data.username }];
      });

<<<<<<< HEAD
    // User left
    const handleUserLeft = (data) => {
      console.log('👋 User left:', data.username);
      setUsers((prev) => prev.filter((u) => u.username !== data.username));
      
      setMessages((prev) => [...prev, {
        username: 'System',
        message: `${data.username} left the room`,
        timestamp: Date.now(),
        isSystem: true,
      }]);
    };

    // Message received
    const handleReceiveMessage = (data) => {
      console.log('💬 Message received:', data);
      
      setMessages((prev) => {
        const messageId = `${data.username}-${data.timestamp}-${data.message}`;
        const isDuplicate = prev.some(msg => {
          const existingId = `${msg.username}-${msg.timestamp}-${msg.message}`;
          return existingId === messageId;
        });
        
        if (isDuplicate) {
          console.log('⚠️ Duplicate message prevented:', messageId);
          return prev;
=======
      setMessages(prev => [
        ...prev,
        {
          username: "System",
          message: `${data.username} joined`,
          timestamp: Date.now(),
          isSystem: true
>>>>>>> 985c544244c31a0970545564036a76a881d76c5b
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

<<<<<<< HEAD
    // Code received
    const handleCodeReceive = (data) => {
      console.log('📝 Code received:', data.code?.length || 0, 'chars');
      setCode(data.code);
    };
=======
    const handleCodeReceive = (data) => setCode(data.code);
>>>>>>> 985c544244c31a0970545564036a76a881d76c5b

    const handleError = (data) => {
      alert(data.message);
    };

<<<<<<< HEAD
    // Register listeners
=======
>>>>>>> 985c544244c31a0970545564036a76a881d76c5b
    socketService.onRoomCreated(handleRoomCreated);
    socketService.onRoomJoined(handleRoomJoined);
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);
    socketService.onReceiveMessage(handleReceiveMessage);
    socketService.onCodeReceive(handleCodeReceive);
    socketService.onError(handleError);

<<<<<<< HEAD
    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socketService.disconnect();
      setIsConnected(false);
      listenersSetup.current = false;
=======
    return () => {
      socketService.disconnect();
      listenersSetup.current = false;
      setIsConnected(false);
>>>>>>> 985c544244c31a0970545564036a76a881d76c5b
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
<<<<<<< HEAD
    console.log('📤 Sending message:', message);
=======
>>>>>>> 985c544244c31a0970545564036a76a881d76c5b
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

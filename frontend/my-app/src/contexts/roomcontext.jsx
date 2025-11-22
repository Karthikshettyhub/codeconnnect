// src/contexts/roomcontext.jsx - FIXED WITH HISTORY LOADING
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
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
  
  const listenersSetup = useRef(false);

  useEffect(() => {
    if (listenersSetup.current) {
      console.log('⚠️ Listeners already setup, skipping...');
      return;
    }
    
    listenersSetup.current = true;
    console.log('✅ Setting up socket listeners (ONCE)');

    socketService.connect();
    setIsConnected(true);

    // Auto-rejoin after refresh
    const savedRoom = localStorage.getItem("currentRoom");
    const savedUser = localStorage.getItem("username");

    if (savedRoom && savedUser) {
      console.log("🔄 Auto-Rejoining room:", savedRoom);
      setCurrentRoom(savedRoom);
      setUsername(savedUser);
      
      setTimeout(() => {
        socketService.joinRoom(savedRoom, savedUser);
      }, 500);
    }

    // ========================================
    // SOCKET EVENT LISTENERS
    // ========================================

    // Room created
    const handleRoomCreated = (data) => {
      console.log('✅ Room created:', data.roomId);
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      
      // 🔥 Initialize with empty messages/code (new room)
      setMessages(data.messages || []);
      setCode(data.code || '');
      
      localStorage.setItem("currentRoom", data.roomId);
      localStorage.setItem("username", data.username);
    };

    // Room joined
    const handleRoomJoined = (data) => {
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
    };

    // User joined
    const handleUserJoined = (data) => {
      console.log('👋 User joined:', data.username);
      setUsers((prev) => {
        if (prev.some(u => u.username === data.username)) {
          return prev;
        }
        return [...prev, { username: data.username }];
      });
      
      setMessages((prev) => [...prev, {
        username: 'System',
        message: `${data.username} joined the room`,
        timestamp: Date.now(),
        isSystem: true,
      }]);
    };

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
        }
        
        console.log('✅ Adding new message:', messageId);
        return [...prev, data];
      });
    };

    // Code received
    const handleCodeReceive = (data) => {
      console.log('📝 Code received:', data.code?.length || 0, 'chars');
      setCode(data.code);
    };

    // Error
    const handleError = (data) => {
      console.error('❌ Socket error:', data.message);
      alert(data.message);
    };

    // Register listeners
    socketService.onRoomCreated(handleRoomCreated);
    socketService.onRoomJoined(handleRoomJoined);
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);
    socketService.onReceiveMessage(handleReceiveMessage);
    socketService.onCodeReceive(handleCodeReceive);
    socketService.onError(handleError);

    // Cleanup
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      socketService.disconnect();
      setIsConnected(false);
      listenersSetup.current = false;
    };
  }, []);

  // ========================================
  // CONTEXT FUNCTIONS
  // ========================================

  const createRoom = (roomId, userName) => {
    console.log('🏠 Creating room:', roomId);
    setUsername(userName);
    setCurrentRoom(roomId);
    localStorage.setItem("currentRoom", roomId);
    localStorage.setItem("username", userName);
    socketService.createRoom(roomId, userName);
  };

  const joinRoom = (roomId, userName) => {
    console.log('🚪 Joining room:', roomId);
    setUsername(userName);
    setCurrentRoom(roomId);
    localStorage.setItem("currentRoom", roomId);
    localStorage.setItem("username", userName);
    socketService.joinRoom(roomId, userName);
  };

  const leaveRoom = () => {
    console.log('👋 Leaving room:', currentRoom);
    if (currentRoom && username) {
      socketService.leaveRoom(currentRoom, username);
    }
    localStorage.removeItem("currentRoom");
    localStorage.removeItem("username");
    setCurrentRoom(null);
    setUsers([]);
    setMessages([]);
    setCode('');
  };

  const sendMessage = (message) => {
    if (!message.trim()) return;
    console.log('📤 Sending message:', message);
    socketService.sendMessage(currentRoom, username, message);
  };

  const sendCodeTimeout = useRef(null);
  const sendCode = (newCode) => {
    if (!currentRoom) return;
    setCode(newCode);
    
    if (sendCodeTimeout.current) {
      clearTimeout(sendCodeTimeout.current);
    }
    
    sendCodeTimeout.current = setTimeout(() => {
      socketService.sendCode(currentRoom, newCode);
    }, 300);
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
// src/contexts/roomcontext.jsx - DUPLICATE MESSAGES FIXED
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
  
  // CRITICAL: Prevent duplicate listener setup
  const listenersSetup = useRef(false);

  useEffect(() => {
    // ⚠️ IMPORTANT: Only setup listeners ONCE
    if (listenersSetup.current) {
      console.log('⚠️ Listeners already setup, skipping...');
      return;
    }
    
    listenersSetup.current = true;
    console.log('✅ Setting up socket listeners (ONCE)');

    // Connect to socket
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
    // SOCKET EVENT LISTENERS (Setup ONCE)
    // ========================================

    // Room created
    const handleRoomCreated = (data) => {
      console.log('✅ Room created:', data.roomId);
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      localStorage.setItem("currentRoom", data.roomId);
      localStorage.setItem("username", data.username);
    };

    // Room joined
    const handleRoomJoined = (data) => {
      console.log('✅ Room joined:', data.roomId);
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
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

    // ⭐ CRITICAL: Message received handler with deduplication
    const handleReceiveMessage = (data) => {
      console.log('💬 Message received:', data);
      
      setMessages((prev) => {
        // Create unique ID for message
        const messageId = `${data.username}-${data.timestamp}-${data.message}`;
        
        // Check if this exact message already exists
        const isDuplicate = prev.some(msg => {
          const existingId = `${msg.username}-${msg.timestamp}-${msg.message}`;
          return existingId === messageId;
        });
        
        if (isDuplicate) {
          console.log('⚠️ Duplicate message prevented:', messageId);
          return prev; // Don't add duplicate
        }
        
        console.log('✅ Adding new message:', messageId);
        return [...prev, data];
      });
    };

    // Code received
    const handleCodeReceive = (data) => {
      console.log('📝 Code received');
      setCode(data.code);
    };

    // Error
    const handleError = (data) => {
      console.error('❌ Socket error:', data.message);
      alert(data.message);
    };

    // ========================================
    // REGISTER LISTENERS (Do NOT use arrow functions directly)
    // ========================================
    socketService.onRoomCreated(handleRoomCreated);
    socketService.onRoomJoined(handleRoomJoined);
    socketService.onUserJoined(handleUserJoined);
    socketService.onUserLeft(handleUserLeft);
    socketService.onReceiveMessage(handleReceiveMessage);
    socketService.onCodeReceive(handleCodeReceive);
    socketService.onError(handleError);

    // ========================================
    // CLEANUP: Remove listeners when unmounting
    // ========================================
    return () => {
      console.log('🧹 Cleaning up socket listeners');
      
      // Remove all listeners (if your socket service supports it)
      // This prevents duplicate listeners on hot reload
      socketService.disconnect();
      
      setIsConnected(false);
      listenersSetup.current = false; // Reset for next mount
    };
  }, []); // ⚠️ CRITICAL: Empty dependency array = runs ONCE

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

  // ⭐ IMPROVED: Send message (don't add locally, let server broadcast)
  const sendMessage = (message) => {
    if (!message.trim()) return;
    
    console.log('📤 Sending message:', message);
    
    // Send to server - server will broadcast to everyone (including sender)
    socketService.sendMessage(currentRoom, username, message);
  };

  // Send code with debouncing
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
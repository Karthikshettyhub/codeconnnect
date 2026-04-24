import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import socketService from "../services/socket";
import { getStarterCode } from "../services/compilerService";

const RoomContext = createContext();

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
  return ctx;
};

export const RoomProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
  const [code, setCode] = useState(() => localStorage.getItem("code") || "");
  const [language, setLanguage] = useState(() => localStorage.getItem("language") || "javascript");
  const [pendingLanguage, setPendingLanguage] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const usernameRef = useRef("");
  const retryCount = useRef(0);

  useEffect(() => {
    socketService.connect();

    socketService.onRoomCreated((data) => {
      console.log("✅ Room created:", data.roomId);
      retryCount.current = 0;
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      if (data.code) setCode(data.code);
      if (data.language) setLanguage(data.language);
    });

    socketService.onRoomJoined((data) => {
      console.log("🚀 [ROOM] Successfully joined:", data.roomId);
      retryCount.current = 0;
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      if (data.code) setCode(data.code);
      if (data.language) setLanguage(data.language);
    });

    socketService.onUserJoined((data) => {
      setUsers((prev) => {
        const exists = prev.find((u) => u.username === data.username);
        if (exists) return prev.map((u) => u.username === data.username ? { ...u, socketId: data.socketId } : u);
        return [...prev, data];
      });
    });

    socketService.onUserLeft((data) => {
      setUsers((prev) => prev.filter((u) => u.username !== data.username));
    });

    socketService.onReceiveMessage((data) => {
      console.log("📥 Received [CHAT]:", data);
      setMessages((prev) => {
        const isDuplicate = prev.some(m => m.timestamp === data.timestamp && m.username === data.username && m.message === data.message);
        if (isDuplicate) return prev;
        return [...prev, data];
      });
    });

    socketService.onCodeReceive((data) => {
      if (data?.code !== undefined) setCode(data.code);
    });

    socketService.onLanguageChange((data) => {
      if (data?.language) setPendingLanguage(data.language);
    });

    socketService.onError((err) => {
      // FIX: Retry join instead of failing
      if (err?.message === "Room not found" && retryCount.current < 3) {
        console.log("🔁 Retrying room join...");
        retryCount.current++;
        
        const storedRoomId = localStorage.getItem("roomId");
        const storedUsername = localStorage.getItem("username");
        const storedPasscode = localStorage.getItem("passcode");

        if (storedRoomId && storedUsername) {
          socketService.joinRoom(storedRoomId, storedUsername, storedPasscode);
        }
        return; // DO NOT reset state
      }

      console.error("🚫 Fatal error:", err?.message);
    });

    setIsInitialized(true);
    return () => socketService.removeAllListeners();
  }, []);

  useEffect(() => {
    if (!currentRoom) return;
    localStorage.setItem("roomId", currentRoom);
    localStorage.setItem("code", code);
    localStorage.setItem("language", language);
  }, [currentRoom, code, language]);

  const createRoom = (roomId, userName, passcode) => {
    setUsername(userName);
    usernameRef.current = userName;
    socketService.createRoom(roomId, userName, passcode);
  };

  const joinRoom = (roomId, userName, passcode) => {
    setUsername(userName);
    usernameRef.current = userName;
    socketService.joinRoom(roomId, userName, passcode);
  };

  const leaveRoom = () => {
    if (currentRoom && usernameRef.current) socketService.leaveRoom(currentRoom, usernameRef.current);
    localStorage.clear();
    setCurrentRoom(null);
    setUsers([]);
    setMessages([]);
    setCode("");
    setUsername("");
  };

  const sendMessage = (msg) => {
    if (currentRoom && usernameRef.current) {
      console.log("📤 Sending [CHAT]:", currentRoom, usernameRef.current, msg);
      socketService.sendMessage(currentRoom, usernameRef.current, msg);
    }
  };

  return (
    <RoomContext.Provider
      value={{
        currentRoom, users, messages, username, code, language, pendingLanguage, isInitialized,
        createRoom, joinRoom, leaveRoom, sendMessage,
        updateCodeRemote: (c) => { setCode(c); socketService.sendCode(currentRoom, c); },
        updateLanguageRemote: (l) => { setLanguage(l); socketService.sendLanguage(currentRoom, l, usernameRef.current); },
        acceptLanguageChange: () => { if (pendingLanguage) { setLanguage(pendingLanguage); setPendingLanguage(null); } },
        rejectLanguageChange: () => setPendingLanguage(null),
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

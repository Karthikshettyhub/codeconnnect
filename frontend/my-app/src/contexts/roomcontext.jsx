// src/contexts/roomcontext.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import socketService from "../services/socket";
import { getStarterCode } from "../services/pistonService";

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

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [pendingLanguage, setPendingLanguage] = useState(null);

  const listenersSetup = useRef(false);
  const usernameRef = useRef("");

  // ======================
  // INIT SOCKET (ONCE)
  // ======================
  useEffect(() => {
    if (listenersSetup.current) return;
    listenersSetup.current = true;

    socketService.connect();

    socketService.onRoomCreated((data) => {
      if (!data?.roomId) return;
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || "");
      if (data.language) setLanguage(data.language);
    });

    socketService.onRoomJoined((data) => {
      if (!data?.roomId) return;
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || "");
      if (data.language) setLanguage(data.language);
    });

    socketService.onReceiveMessage((data) => {
      if (!data) return;
      setMessages((prev) => [...prev, data]);
    });

    socketService.onCodeReceive((data) => {
      if (data?.code !== undefined) setCode(data.code);
    });

    socketService.onLanguageChange((data) => {
      if (!data || !data.language || !data.username) return;
      if (data.username === usernameRef.current) return;
      setPendingLanguage(data.language);
    });
  }, []);

  // ======================
  // STARTER CODE
  // ======================
  useEffect(() => {
    if (!currentRoom) return;
    if (language && code === "") {
      const starter = getStarterCode(language);
      if (starter) {
        setCode(starter);
        socketService.sendCode(currentRoom, starter);
      }
    }
  }, [currentRoom, language]);

  // ======================
  // ACTIONS
  // ======================
  const createRoom = (roomId, userName) => {
    if (!roomId || !userName) return;
    sessionStorage.removeItem("intentionalLeave");
    setUsername(userName);
    usernameRef.current = userName;
    sessionStorage.setItem("username", userName);
    socketService.createRoom(roomId, userName);
  };

  const joinRoom = (roomId, userName) => {
    if (!roomId || !userName) return;
    sessionStorage.removeItem("intentionalLeave");
    setUsername(userName);
    usernameRef.current = userName;
    sessionStorage.setItem("username", userName);
    socketService.joinRoom(roomId, userName);
  };

  const leaveRoom = () => {
    if (currentRoom && usernameRef.current) {
      socketService.leaveRoom(currentRoom, usernameRef.current);
    }

    // 🔥 THIS IS THE KEY
    sessionStorage.setItem("intentionalLeave", "true");

    setCurrentRoom(null);
    setUsers([]);
    setMessages([]);
    setCode("");
    setPendingLanguage(null);
    setUsername("");
    usernameRef.current = "";
  };

  return (
    <RoomContext.Provider
      value={{
        currentRoom,
        users,
        messages,
        username,
        code,
        language,
        pendingLanguage,
        createRoom,
        joinRoom,
        leaveRoom,
        sendMessage: (msg) =>
          currentRoom &&
          usernameRef.current &&
          socketService.sendMessage(currentRoom, usernameRef.current, msg),
        updateCodeRemote: (c) =>
          currentRoom && socketService.sendCode(currentRoom, c),
        updateLanguageRemote: (l) =>
          currentRoom &&
          usernameRef.current &&
          socketService.sendLanguage(currentRoom, l, usernameRef.current),
        acceptLanguageChange: () => {
          setLanguage(pendingLanguage);
          setPendingLanguage(null);
        },
        rejectLanguageChange: () => setPendingLanguage(null),
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

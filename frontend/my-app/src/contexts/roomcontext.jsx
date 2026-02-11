import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
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

  const usernameRef = useRef("");

  // =====================
  // 🔌 SOCKET INIT + AUTO REJOIN
  // =====================
  useEffect(() => {
    socketService.connect();

    const savedRoom = sessionStorage.getItem("roomId");
    const savedUsername = sessionStorage.getItem("username");
    const savedPasscode = sessionStorage.getItem("passcode");
    const intentionalLeave = sessionStorage.getItem("intentionalLeave");

    // ✅ AUTO REJOIN ON REFRESH
    if (savedRoom && savedUsername && intentionalLeave !== "true") {
      usernameRef.current = savedUsername;
      setUsername(savedUsername);
      socketService.joinRoom(savedRoom, savedUsername, savedPasscode);
    }

    // =====================
    // SOCKET LISTENERS
    // =====================
    socketService.onRoomCreated((data) => {
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || "");
      if (data.language) setLanguage(data.language);
    });

    socketService.onRoomJoined((data) => {
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || "");
      if (data.language) setLanguage(data.language);
    });

    socketService.onReceiveMessage((data) => {
      setMessages((prev) => [...prev, data]);
    });

    socketService.onCodeReceive((data) => {
      if (data?.code !== undefined) setCode(data.code);
    });

    socketService.onLanguageChange((data) => {
      if (data?.language) setPendingLanguage(data.language);
    });

    socketService.onError((err) => {
      alert(err?.message || "Socket error");
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  // =====================
  // DEFAULT STARTER CODE
  // =====================
  useEffect(() => {
    if (!currentRoom) return;
    if (code === "" && language) {
      const starter = getStarterCode(language);
      setCode(starter);
      socketService.sendCode(currentRoom, starter);
    }
  }, [currentRoom, language]);

  // =====================
  // ROOM ACTIONS
  // =====================
  const createRoom = (roomId, userName, passcode) => {
    sessionStorage.removeItem("intentionalLeave");
    sessionStorage.setItem("roomId", roomId);
    sessionStorage.setItem("username", userName);
    if (passcode) sessionStorage.setItem("passcode", passcode);

    setUsername(userName);
    usernameRef.current = userName;

    socketService.createRoom(roomId, userName, passcode);
  };

  const joinRoom = (roomId, userName, passcode) => {
    sessionStorage.removeItem("intentionalLeave");
    sessionStorage.setItem("roomId", roomId);
    sessionStorage.setItem("username", userName);
    if (passcode) sessionStorage.setItem("passcode", passcode);

    setUsername(userName);
    usernameRef.current = userName;

    socketService.joinRoom(roomId, userName, passcode);
  };

  const leaveRoom = () => {
    if (currentRoom && usernameRef.current) {
      socketService.leaveRoom(currentRoom, usernameRef.current);
    }

    sessionStorage.setItem("intentionalLeave", "true");
    sessionStorage.removeItem("roomId");

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
          socketService.sendLanguage(currentRoom, l, usernameRef.current),

        acceptLanguageChange: () => {
          if (!pendingLanguage) return;
          const starter = getStarterCode(pendingLanguage);
          setLanguage(pendingLanguage);
          setCode(starter);
          socketService.sendCode(currentRoom, starter);
          setPendingLanguage(null);
        },

        rejectLanguageChange: () => setPendingLanguage(null),
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

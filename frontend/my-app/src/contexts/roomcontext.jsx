// frontend/src/contexts/roomcontext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import socketService from "../services/socket";
import webrtcService from "../services/webrtc";

const RoomContext = createContext(null);

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoom must be used inside RoomProvider");
  return ctx;
};

export const RoomProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");

  const [isConnected, setIsConnected] = useState(false);
  const listenersSetup = useRef(false);

  const languageRef = useRef(language);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // INIT SOCKET
  useEffect(() => {
    if (listenersSetup.current) return;
    listenersSetup.current = true;

    socketService.connect();
    setIsConnected(true);

    // Initialize webrtc service (it will attach socket listeners)
    webrtcService.init();

    const savedRoom = sessionStorage.getItem("currentRoom");
    const savedUser = sessionStorage.getItem("username");

    if (savedRoom && savedUser) {
      setCurrentRoom(savedRoom);
      setUsername(savedUser);

      // ensure webrtc has the identity
      webrtcService.setRoom(savedRoom);
      webrtcService.setUsername(savedUser);

      setTimeout(() => {
        socketService.joinRoom(savedRoom, savedUser);
      }, 400);
    }

    // handlers
    const handleRoomCreated = (data) => {
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || "");
      setLanguage(data.language || "javascript");
      sessionStorage.setItem("currentRoom", data.roomId);
      sessionStorage.setItem("username", data.username);

      // update webrtc identity
      webrtcService.setRoom(data.roomId);
      webrtcService.setUsername(data.username);
    };

    const handleRoomJoined = (data) => {
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || "");
      setLanguage(data.language || "javascript");
      sessionStorage.setItem("currentRoom", data.roomId);

      // update webrtc identity
      webrtcService.setRoom(data.roomId);
    };

    const handleReceiveMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const handleUserJoined = (data) => {
      setUsers(data.users);
    };

    const handleCodeReceive = (data) => {
      setCode(data.code);
    };

    const handleLanguageReceive = ({ username: changedBy, language: newLang }) => {
      if (languageRef.current === newLang) return;
      alert(`⚠️ ${changedBy} changed language to ${newLang.toUpperCase()}`);
      setLanguage(newLang);
    };

    // register listeners
    socketService.onRoomCreated(handleRoomCreated);
    socketService.onRoomJoined(handleRoomJoined);
    socketService.onReceiveMessage(handleReceiveMessage);
    socketService.onUserJoined(handleUserJoined);
    socketService.onCodeReceive(handleCodeReceive);
    socketService.onLanguageReceive(handleLanguageReceive);
    socketService.onError((err) => alert(err.message));

    return () => {
      socketService.disconnect();
      listenersSetup.current = false;
      setIsConnected(false);
      webrtcService.cleanupAll();
    };
  }, []);

  // ACTIONS
  const createRoom = (roomId, userName) => {
    setUsername(userName);

    // tell webrtc about identity too
    webrtcService.setUsername(userName);
    webrtcService.setRoom(roomId);

    socketService.createRoom(roomId, userName);
  };

  const joinRoom = (roomId, userName) => {
    setUsername(userName);

    webrtcService.setUsername(userName);
    webrtcService.setRoom(roomId);

    socketService.joinRoom(roomId, userName);
  };

  const leaveRoom = () => {
    socketService.leaveRoom(currentRoom, username);
    sessionStorage.clear();
    setCurrentRoom(null);
    setUsers([]);
    setMessages([]);
    setCode("");
    setLanguage("javascript");

    webrtcService.cleanupAll();
  };

  const sendMessage = (message) => {
    socketService.sendMessage(currentRoom, username, message);
  };

  const sendCode = (updatedCode) => {
    setCode(updatedCode);
    socketService.sendCode(currentRoom, updatedCode);
  };

  const sendLanguage = (lang) => {
    setLanguage(lang);
    socketService.sendLanguage(currentRoom, lang, username);
  };

  return (
    <RoomContext.Provider
      value={{
        currentRoom,
        users,
        messages,
        username,
        setUsername,
        code,
        setCode,
        sendCode,
        language,
        sendLanguage,
        createRoom,
        joinRoom,
        leaveRoom,
        sendMessage,
        isConnected,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

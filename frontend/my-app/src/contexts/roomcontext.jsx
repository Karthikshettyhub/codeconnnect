import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import socketService from "../services/socket";

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
  const [isConnected, setIsConnected] = useState(false);

  // 🔥 Language states (removed duplicates)
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [pendingLanguage, setPendingLanguage] = useState(null);

  const listenersSetup = useRef(false);
  const usernameRef = useRef("");

  // ✅ NEW: hydration guard (VERY IMPORTANT)
  const isHydratingRef = useRef(true);

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

    const savedUser = sessionStorage.getItem("username");
    if (savedUser) {
      setUsername(savedUser);
      usernameRef.current = savedUser;
    }

    // ======================
    // ROOM CREATED
    // ======================
    socketService.onRoomCreated((data) => {
      if (!data?.roomId) return;

      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || "");

      // 🔥 FIX: restore language on create
      if (data.language) {
        console.log("♻️ restore language (create):", data.language);
        setLanguage(data.language);
      }

      isHydratingRef.current = false;
    });

    // ======================
    // ROOM JOINED (REFRESH)
    // ======================
    socketService.onRoomJoined((data) => {
      if (!data?.roomId) return;

      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || "");

      // 🔥 FIX: restore language on refresh
      if (data.language) {
        console.log("♻️ restore language (join):", data.language);
        setLanguage(data.language);
      }

      isHydratingRef.current = false;
    });

    socketService.onReceiveMessage((data) => {
      if (!data) return;
      setMessages((prev) => [...prev, data]);
    });

    socketService.onCodeReceive((data) => {
      if (data?.code !== undefined) {
        setCode(data.code);
      }
    });

    // ======================
    // LANGUAGE CHANGE (POPUP)
    // ======================
    socketService.onLanguageChange((data) => {
      console.log("🌐 Language event received:", data);

      if (!data || !data.language || !data.username) return;

      // ❌ ignore own change
      if (data.username === usernameRef.current) return;

      // ❌ ignore refresh / hydration
      if (isHydratingRef.current) {
        console.log("⏭️ skip popup (hydration)");
        return;
      }

      console.log("🔔 Showing popup for language:", data.language);
      setPendingLanguage(data.language);
    });

    socketService.onError((data) => alert(data.message));

    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
      listenersSetup.current = false;
      setIsConnected(false);
    };
  }, []);

  // ======================
  // ACTIONS (UNCHANGED)
  // ======================
  const createRoom = (roomId, userName) => {
    if (!roomId || !userName) return;
    setUsername(userName);
    usernameRef.current = userName;
    sessionStorage.setItem("username", userName);
    socketService.createRoom(roomId, userName);
  };

  const joinRoom = (roomId, userName) => {
    if (!roomId || !userName) return;
    setUsername(userName);
    usernameRef.current = userName;
    sessionStorage.setItem("username", userName);
    socketService.joinRoom(roomId, userName);
  };

  const leaveRoom = () => {
    if (currentRoom && usernameRef.current) {
      socketService.leaveRoom(currentRoom, usernameRef.current);
    }

    socketService.removeAllListeners();
    socketService.disconnect();
    sessionStorage.clear();

    setCurrentRoom(null);
    setUsers([]);
    setMessages([]);
    setCode("");
    setUsername("");
    setPendingLanguage(null);
    setIsConnected(false);
  };

  const sendMessage = (message) => {
    if (!currentRoom || !usernameRef.current || !message) return;
    socketService.sendMessage(currentRoom, usernameRef.current, message);
  };

  const updateCodeRemote = (updatedCode) => {
    if (!currentRoom) return;
    setCode(updatedCode);
    socketService.sendCode(currentRoom, updatedCode);
  };

  // 🔥 sender only
  const updateLanguageRemote = (newLang) => {
    if (!currentRoom || !newLang || !usernameRef.current) return;
    setLanguage(newLang);
    socketService.sendLanguage(currentRoom, newLang, usernameRef.current);
  };

  const acceptLanguageChange = () => {
    if (!pendingLanguage) return;
    setLanguage(pendingLanguage);
    setPendingLanguage(null);
  };

  const rejectLanguageChange = () => {
    setPendingLanguage(null);
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
        sendMessage,
        updateCodeRemote,
        updateLanguageRemote,
        acceptLanguageChange,
        rejectLanguageChange,
        isConnected,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};
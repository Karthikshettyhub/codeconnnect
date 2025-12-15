<<<<<<< HEAD
// frontend/src/contexts/roomcontext.jsx
=======
>>>>>>> bugfix-working-version
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import socketService from "../services/socket";
<<<<<<< HEAD
import webrtcService from "../services/webrtc";
=======
>>>>>>> bugfix-working-version

const RoomContext = createContext(null);

export const useRoom = () => {
  const ctx = useContext(RoomContext);
<<<<<<< HEAD
  if (!ctx) throw new Error("useRoom must be used inside RoomProvider");
=======
  if (!ctx) throw new Error("useRoom must be used within RoomProvider");
>>>>>>> bugfix-working-version
  return ctx;
};

export const RoomProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");
<<<<<<< HEAD
=======
  const [isConnected, setIsConnected] = useState(false);
  const [code, setCode] = useState("");

  // 🔥 Language states
  const [language, setLanguage] = useState("javascript");
  const [pendingLanguage, setPendingLanguage] = useState(null);
>>>>>>> bugfix-working-version

  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");

  const [isConnected, setIsConnected] = useState(false);
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

<<<<<<< HEAD
    // Initialize webrtc service (it will attach socket listeners)
    webrtcService.init();

    const savedRoom = sessionStorage.getItem("currentRoom");
=======
>>>>>>> bugfix-working-version
    const savedUser = sessionStorage.getItem("username");
    if (savedUser) {
      setUsername(savedUser);
<<<<<<< HEAD

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
=======
      usernameRef.current = savedUser;
    }

    // ======================
    // ROOM CREATED
    // ======================
    socketService.onRoomCreated((data) => {
      if (!data?.roomId) return;

>>>>>>> bugfix-working-version
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || "");
<<<<<<< HEAD
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
=======

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
>>>>>>> bugfix-working-version

    return () => {
      socketService.removeAllListeners();
      socketService.disconnect();
      listenersSetup.current = false;
      setIsConnected(false);
      webrtcService.cleanupAll();
    };
  }, []);

<<<<<<< HEAD
  // ACTIONS
=======
  // ======================
  // ACTIONS (UNCHANGED)
  // ======================
>>>>>>> bugfix-working-version
  const createRoom = (roomId, userName) => {
    if (!roomId || !userName) return;
    setUsername(userName);
<<<<<<< HEAD

    // tell webrtc about identity too
    webrtcService.setUsername(userName);
    webrtcService.setRoom(roomId);

=======
    usernameRef.current = userName;
    sessionStorage.setItem("username", userName);
>>>>>>> bugfix-working-version
    socketService.createRoom(roomId, userName);
  };

  const joinRoom = (roomId, userName) => {
    if (!roomId || !userName) return;
    setUsername(userName);
<<<<<<< HEAD

    webrtcService.setUsername(userName);
    webrtcService.setRoom(roomId);

=======
    usernameRef.current = userName;
    sessionStorage.setItem("username", userName);
>>>>>>> bugfix-working-version
    socketService.joinRoom(roomId, userName);
  };

  const leaveRoom = () => {
<<<<<<< HEAD
    socketService.leaveRoom(currentRoom, username);
    sessionStorage.clear();
=======
    if (currentRoom && usernameRef.current) {
      socketService.leaveRoom(currentRoom, usernameRef.current);
    }

    socketService.removeAllListeners();
    socketService.disconnect();
    sessionStorage.clear();

>>>>>>> bugfix-working-version
    setCurrentRoom(null);
    setUsers([]);
    setMessages([]);
    setCode("");
<<<<<<< HEAD
    setLanguage("javascript");

    webrtcService.cleanupAll();
  };

  const sendMessage = (message) => {
    socketService.sendMessage(currentRoom, username, message);
  };

  const sendCode = (updatedCode) => {
=======
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
>>>>>>> bugfix-working-version
    setCode(updatedCode);
    socketService.sendCode(currentRoom, updatedCode);
  };

<<<<<<< HEAD
  const sendLanguage = (lang) => {
    setLanguage(lang);
    socketService.sendLanguage(currentRoom, lang, username);
=======
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
>>>>>>> bugfix-working-version
  };

  return (
    <RoomContext.Provider
      value={{
        currentRoom,
        users,
        messages,
        username,
<<<<<<< HEAD
        setUsername,
        code,
        setCode,
        sendCode,
        language,
        sendLanguage,
=======
        code,
        language,
        pendingLanguage,
>>>>>>> bugfix-working-version
        createRoom,
        joinRoom,
        leaveRoom,
        sendMessage,
<<<<<<< HEAD
=======
        updateCodeRemote,
        updateLanguageRemote,
        acceptLanguageChange,
        rejectLanguageChange,
>>>>>>> bugfix-working-version
        isConnected,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

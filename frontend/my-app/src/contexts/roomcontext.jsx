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

export const STARTER_CODE = {
  javascript: `// JavaScript\nconsole.log("Hello, World!");`,
  python: `# Python\nprint("Hello, World!")`,
  java: `// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  cpp: `// C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
  c: `// C\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  csharp: `// C#\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}`,
  go: `// Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}`,
  rust: `// Rust\nfn main() {\n    println!("Hello, World!");\n}`,
  typescript: `// TypeScript\nconst message: string = "Hello, World!";\nconsole.log(message);`,
  ruby: `# Ruby\nputs "Hello, World!"`,
  php: `<?php\necho "Hello, World!";\n?>`,
};

export const RoomProvider = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [username, setUsername] = useState("");

  const [code, setCode] = useState(STARTER_CODE.javascript);
  const [language, setLanguage] = useState("javascript");
  const [pendingLanguage, setPendingLanguage] = useState(null);

  const usernameRef = useRef("");

  useEffect(() => {
    socketService.connect();

    const savedRoom = sessionStorage.getItem("roomId");
    const savedUsername = sessionStorage.getItem("username");
    const savedPasscode = sessionStorage.getItem("passcode");
    const intentionalLeave = sessionStorage.getItem("intentionalLeave");

    if (savedRoom && savedUsername && intentionalLeave !== "true") {
      usernameRef.current = savedUsername;
      setUsername(savedUsername);
      socketService.joinRoom(savedRoom, savedUsername, savedPasscode);
    }

    socketService.onRoomCreated((data) => {
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || STARTER_CODE.javascript);
      if (data.language) setLanguage(data.language);
    });

    socketService.onRoomJoined((data) => {
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || STARTER_CODE.javascript);
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

  const updateCodeLocal = (c) => setCode(c);
  const updateLanguageLocal = (l) => setLanguage(l);

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

        updateCodeLocal,
        updateLanguageLocal,

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
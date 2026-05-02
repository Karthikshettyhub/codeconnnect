import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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
      setCode(data.code || STARTER_CODE.javascript);
      if (data.language) setLanguage(data.language);
    });

    socketService.onRoomJoined((data) => {
      console.log("🚀 [ROOM] Successfully joined:", data.roomId);
      retryCount.current = 0;
      setCurrentRoom(data.roomId);
      setUsers(data.users || []);
      setMessages(data.messages || []);
      setCode(data.code || STARTER_CODE.javascript);
      if (data.language) setLanguage(data.language);
    });

    socketService.onUserJoined((data) => {
      setUsers((prev) => {
        const exists = prev.find((u) => u.username === data.username);
        if (exists) {
          return prev.map((u) =>
            u.username === data.username ? { ...u, socketId: data.socketId } : u
          );
        }
        return [...prev, data];
      });
    });

    socketService.onUserLeft((data) => {
      setUsers((prev) => prev.filter((u) => u.username !== data.username));
    });

    socketService.onReceiveMessage((data) => {
      console.log("📥 Received [CHAT]:", data);
      setMessages((prev) => {
        const isDuplicate = prev.some(
          (m) =>
            m.timestamp === data.timestamp &&
            m.username === data.username &&
            m.message === data.message
        );
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
      if (err?.message === "Room not found" && retryCount.current < 3) {
        console.log("🔁 Retrying room join...");
        retryCount.current++;

        const storedRoomId = localStorage.getItem("roomId");
        const storedUsername = localStorage.getItem("username");
        const storedPasscode = localStorage.getItem("passcode");

        if (storedRoomId && storedUsername) {
          setTimeout(() => {
            socketService.joinRoom(storedRoomId, storedUsername, storedPasscode);
          }, 1000);
        }
        return;
      }

      console.error("🚫 Fatal error:", err?.message);
    });

    setIsInitialized(true);

    return () => socketService.removeAllListeners();
  }, []);

  // ✅ FIX: Restore username after refresh
  useEffect(() => {
    const storedUsername = localStorage.getItem("username");

    if (storedUsername) {
      console.log("🔄 Restoring username:", storedUsername);
      setUsername(storedUsername);
      usernameRef.current = storedUsername;
    }
  }, []);

  const createRoom = (roomId, userName, passcode) => {
    sessionStorage.removeItem("intentionalLeave");
    sessionStorage.setItem("roomId", roomId);
    sessionStorage.setItem("username", userName);
    if (passcode) sessionStorage.setItem("passcode", passcode);

  const createRoom = async (roomId, userName, passcode) => {
    setUsername(userName);
    usernameRef.current = userName;

    localStorage.setItem("roomId", roomId);
    localStorage.setItem("username", userName);
    localStorage.setItem("passcode", passcode);

    return socketService.createRoom(roomId, userName, passcode);
  };

  const joinRoom = async (roomId, userName, passcode) => {
    setUsername(userName);
    usernameRef.current = userName;

    localStorage.setItem("roomId", roomId);
    localStorage.setItem("username", userName);
    localStorage.setItem("passcode", passcode);

    return socketService.joinRoom(roomId, userName, passcode);
  };

  const leaveRoom = () => {
    if (currentRoom && usernameRef.current) {
      socketService.leaveRoom(currentRoom, usernameRef.current);
    }

    localStorage.clear();
    setCurrentRoom(null);
    setUsers([]);
    setMessages([]);
    setCode("");
    setUsername("");
  };

  const sendMessage = (msg) => {
    if (!currentRoom || !usernameRef.current) {
      console.error("❌ Cannot send: room not ready");
      return;
    }

    console.log("📤 Sending [CHAT]:", currentRoom, usernameRef.current, msg);

    socketService.sendMessage(currentRoom, usernameRef.current, msg);
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
        isInitialized,
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
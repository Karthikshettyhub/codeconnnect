import { createContext, useState } from "react";

export const RoomContext = createContext();

export function RoomProvider({ children }) {
  const [roomData, setRoomData] = useState({
    username: "Guest",
    roomId: "",
    isCreator: false,
    messages: [], // ✅ add messages array
  });

  // Add a new message
  const addMessage = (user, text) => {
    setRoomData((prev) => ({
      ...prev,
      messages: [
        ...prev.messages,
        { id: prev.messages.length + 1, user, text, timestamp: new Date() },
      ],
    }));
  };

  // Create a new room
  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8);
    setRoomData((prev) => ({ ...prev, roomId: newRoomId, isCreator: true }));
    alert("Room created: " + newRoomId); // placeholder
  };

  // Join an existing room
  const joinRoom = (id) => {
    setRoomData((prev) => ({ ...prev, roomId: id, isCreator: false }));
    alert("Joining room: " + id); // placeholder
  };

  return (
    <RoomContext.Provider value={{ roomData, createRoom, joinRoom, addMessage }}>
      {children}
    </RoomContext.Provider>
  );
}

import React, { useState, useEffect, useRef } from "react";
import { useRoom } from "../contexts/roomcontext";
import socketService from "../services/socket";
import "./chatbox.css";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const ChatBox = ({ onLeave }) => {
  const { currentRoom, messages, sendMessage, username, users } = useRoom();

  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const peersRef = useRef({});           // socketId -> RTCPeerConnection
  const localStreamRef = useRef(null);   // MediaStream
  const audioRefs = useRef({});          // socketId -> audio element

  const messagesEndRef = useRef(null);

  // =====================
  // AUTO SCROLL
  // =====================
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =====================
  // CREATE PEER CONNECTION
  // =====================
  const createPeer = (remoteSocketId) => {
    if (peersRef.current[remoteSocketId]) {
      return peersRef.current[remoteSocketId];
    }

    console.log("🧠 Creating peer for:", remoteSocketId);

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("🧊 ICE candidate →", remoteSocketId);
        socketService.emit("webrtc-ice", {
          target: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log("🔊 Incoming audio from:", remoteSocketId);

      if (!audioRefs.current[remoteSocketId]) {
        const audio = document.createElement("audio");
        audio.autoplay = true;
        audio.srcObject = event.streams[0];
        document.body.appendChild(audio);
        audioRefs.current[remoteSocketId] = audio;
      }
    };

    peersRef.current[remoteSocketId] = pc;
    return pc;
  };

  // =====================
  // SOCKET LISTENERS
  // =====================
  useEffect(() => {
    const handleOffer = async ({ from, offer }) => {
      console.log("📥 Received OFFER from:", from);

      if (!offer) {
        console.warn("⚠️ Offer is null, ignoring");
        return;
      }

      const pc = createPeer(from);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      localStreamRef.current?.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      console.log("📤 Sending ANSWER to:", from);

      socketService.emit("webrtc-answer", {
        target: from,
        answer,
      });
    };

    const handleAnswer = async ({ from, answer }) => {
      console.log("📥 Received ANSWER from:", from);
      const pc = peersRef.current[from];
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIce = async ({ from, candidate }) => {
      console.log("🧊 ICE received from:", from);
      const pc = peersRef.current[from];
      if (pc && candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    socketService.listen("webrtc-offer", handleOffer);
    socketService.listen("webrtc-answer", handleAnswer);
    socketService.listen("webrtc-ice", handleIce);

    return () => {
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
    };
  }, [currentRoom]);

  // =====================
  // 🎤 TOGGLE MICROPHONE
  // =====================
  const toggleMic = async () => {
    if (!currentRoom) return;

    if (!isRecording) {
      console.log("🎤 Requesting microphone access...");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      console.log("✅ Mic started:", stream);

      // Create offer for every other user
      users.forEach(async (user) => {
        if (!user.socketId) return;
        if (user.username === username) return;

        console.log("📡 Connecting to peer:", user.socketId);

        const pc = createPeer(user.socketId);

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        console.log("📤 Sending OFFER to:", user.socketId);

        socketService.emit("webrtc-offer", {
          target: user.socketId,
          offer,
        });
      });

      setIsRecording(true);
    } else {
      console.log("🛑 Stopping microphone");

      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};

      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;

      setIsRecording(false);
    }
  };

  // =====================
  // SEND CHAT MESSAGE
  // =====================
  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    sendMessage(inputMessage.trim());
    setInputMessage("");
  };

  return (
    <div className="chatbox">
      <div className="chatbox-header">
        <h3>💬 Chat</h3>
        <button onClick={onLeave}>Leave</button>
      </div>

      <div className="chatbox-messages">
        {messages.map((msg, idx) => (
          <div key={idx}>
            <b>{msg.username}</b>: {msg.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chatbox-input">
        <input
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>

        <button type="button" onClick={toggleMic}>
          {isRecording ? "🔴 Mic ON" : "🎤 Mic"}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;

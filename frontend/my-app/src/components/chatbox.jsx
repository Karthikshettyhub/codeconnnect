import React, { useState, useEffect, useRef } from "react";
import { useRoom } from "../contexts/roomcontext";
import socketService from "../services/socket";
import "./chatbox.css";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

const ChatBox = () => {
  const { currentRoom, messages, sendMessage, username, users } = useRoom();

  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const audioRefs = useRef({});
  const audioUnlockedRef = useRef(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =====================
  // 🔓 UNLOCK AUDIO ON JOIN (CRITICAL)
  // =====================
  useEffect(() => {
    if (audioUnlockedRef.current) return;

    const audio = document.createElement("audio");
    audio.autoplay = true;
    audio.muted = true;
    audio.srcObject = new MediaStream();

    audio
      .play()
      .then(() => {
        audioUnlockedRef.current = true;
        console.log("🔓 Audio unlocked");
      })
      .catch(() => {
        console.warn("🔒 Audio locked until user gesture");
      });
  }, []);

  // =====================
  // CREATE PEER (WITH RECVONLY TRANSCEIVER)
  // =====================
  const createPeer = (remoteSocketId) => {
    if (peersRef.current[remoteSocketId]) {
      return peersRef.current[remoteSocketId];
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // 🔥 IMPORTANT: tell browser we expect audio
    pc.addTransceiver("audio", { direction: "recvonly" });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketService.emit("webrtc-ice", {
          target: remoteSocketId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      if (!audioRefs.current[remoteSocketId]) {
        const audio = document.createElement("audio");
        audio.autoplay = true;
        audio.playsInline = true;
        audio.srcObject = e.streams[0];
        document.body.appendChild(audio);
        audioRefs.current[remoteSocketId] = audio;
        audio.play().catch(() => { });
      }
    };

    peersRef.current[remoteSocketId] = pc;
    return pc;
  };

  // =====================
  // SIGNALING
  // =====================
  useEffect(() => {
    const handleOffer = async ({ from, offer }) => {
      const pc = createPeer(from);

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          pc.addTrack(track, localStreamRef.current);
        });
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketService.emit("webrtc-answer", {
        target: from,
        answer,
      });
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    };

    const handleIce = async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc && candidate) {
        await pc.addIceCandidate(candidate);
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
  // 🎤 MIC TOGGLE (UNCHANGED)
  // =====================
  const toggleMic = async () => {
    if (!localStreamRef.current) {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;

      users.forEach(async (user) => {
        if (!user.socketId || user.username === username) return;

        const pc = createPeer(user.socketId);

        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socketService.emit("webrtc-offer", {
          target: user.socketId,
          offer,
        });
      });

      setIsRecording(true);
      return;
    }

    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !isRecording;
    });

    setIsRecording(!isRecording);
  };

  // =====================
  // CHAT
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
      </div>

      <div className="chatbox-messages">
        {messages.map((msg, idx) => {
          const isOwn = msg.username === username;

          return (
            <div
              key={idx}
              className={`message ${isOwn ? "own-message" : ""}`}
            >
              <div className="message-header">
                <span className="message-username">{msg.username}</span>
              </div>
              <div className="message-content">{msg.message}</div>
            </div>
          );
        })}

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
          {isRecording ? "🔇 Mic OFF" : "🎤 Mic ON"}
        </button>
      </form>
    </div>
  );
};

export default ChatBox;

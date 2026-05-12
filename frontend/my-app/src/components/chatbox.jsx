import React, { useState, useEffect, useRef } from "react";
import { useRoom } from "../contexts/roomcontext";
import socketService from "../services/socket";
import "./chatbox.css";

// 🔥 PRODUCTION ICE SERVERS
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },

    // ✅ FREE PUBLIC TURN (for testing)
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject",
    },
  ],
};

const ChatBox = () => {
  const { currentRoom, messages, sendMessage, username, users } = useRoom();

  const [inputMessage, setInputMessage] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const peersRef = useRef({});
  const localStreamRef = useRef(null);
  const audioRefs = useRef({});
  const iceCandidatesQueue = useRef({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 🔗 CREATE PEER
  const createPeer = (remoteSocketId) => {
    if (peersRef.current[remoteSocketId]) {
      return peersRef.current[remoteSocketId];
    }

    console.log("🔗 Creating peer:", remoteSocketId);

    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketService.emit("webrtc-ice", {
          target: remoteSocketId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      console.log("🎧 TRACK RECEIVED from:", remoteSocketId);

      const stream = e.streams[0];
      if (!stream) return;

      let audio = audioRefs.current[remoteSocketId];

      if (!audio) {
        audio = document.createElement("audio");
        audio.autoplay = true;
        audio.controls = false;
        document.body.appendChild(audio);
        audioRefs.current[remoteSocketId] = audio;
      }

      audio.srcObject = stream;

      audio.play().then(() => {
        console.log("🔊 Playing audio from:", remoteSocketId);
      }).catch((err) => {
        console.error("❌ Audio play failed:", err);
      });
    };

    pc.onconnectionstatechange = () => {
      console.log("📡 Connection:", remoteSocketId, pc.connectionState);
    };

    peersRef.current[remoteSocketId] = pc;
    return pc;
  };

  // 🔥 SEND OFFER
  const sendOffer = async (targetSocketId) => {
    try {
      const pc = createPeer(targetSocketId);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (!pc.getSenders().some((s) => s.track === track)) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socketService.emit("webrtc-offer", {
        target: targetSocketId,
        offer,
      });

      console.log("📤 Offer sent to:", targetSocketId);
    } catch (err) {
      console.error("❌ Offer error:", err);
    }
  };

  // 📥 LISTENERS
  useEffect(() => {
    const handleOffer = async ({ from, offer }) => {
      console.log("📥 Offer from:", from);

      const pc = createPeer(from);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          if (!pc.getSenders().some((s) => s.track === track)) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketService.emit("webrtc-answer", {
        target: from,
        answer,
      });
    };

    const handleAnswer = async ({ from, answer }) => {
      console.log("📥 Answer from:", from);

      const pc = peersRef.current[from];
      if (!pc) return;

      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIce = async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.addIceCandidate(candidate).catch(() => {});
      }
    };

    socketService.listen("webrtc-offer", handleOffer);
    socketService.listen("webrtc-answer", handleAnswer);
    socketService.listen("webrtc-ice", handleIce);

    return () => {
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
    };
  }, []);

  // 🎤 MIC
  const toggleMic = async () => {
    if (!localStreamRef.current) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current = stream;
        setIsRecording(true);

        console.log("🎤 Mic ON");

        users.forEach((user) => {
          if (!user.socketId || user.username === username) return;
          sendOffer(user.socketId);
        });

      } catch (err) {
        console.error("❌ Mic error:", err);
      }
    } else {
      const enabled = !isRecording;
      localStreamRef.current.getAudioTracks().forEach((t) => t.enabled = enabled);
      setIsRecording(enabled);

      if (enabled) {
        users.forEach((user) => {
          if (!user.socketId || user.username === username) return;
          sendOffer(user.socketId);
        });
      }
    }
  };

  // 🔥 NEW USER FIX
  useEffect(() => {
    if (!localStreamRef.current) return;

    users.forEach((user) => {
      if (!user.socketId || user.username === username) return;
      sendOffer(user.socketId);
    });
  }, [users]);

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
          const isOwn = username && msg.username === username;

          return (
            <div key={idx} className={`message ${isOwn ? "own-message" : ""}`}>
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
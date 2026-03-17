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
  const iceCandidatesQueue = useRef({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (audioUnlockedRef.current) return;

    const audio = document.createElement("audio");
    audio.autoplay = true;
    audio.muted = true;
    audio.srcObject = new MediaStream();

    const unlock = () => {
      audio
        .play()
        .then(() => {
          audioUnlockedRef.current = true;

          Object.values(audioRefs.current).forEach((a) => {
            if (a.paused) a.play().catch(() => {});
          });

          document.removeEventListener("click", unlock);
          document.removeEventListener("touchstart", unlock);
          document.removeEventListener("keydown", unlock);
        })
        .catch(() => {});
    };

    unlock();

    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
    document.addEventListener("keydown", unlock);

    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  const createPeer = (remoteSocketId) => {
    if (peersRef.current[remoteSocketId]) {
      return peersRef.current[remoteSocketId];
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketService.emit("webrtc-ice", {
          target: remoteSocketId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      const stream = e.streams[0];
      if (!stream) return;

      if (!audioRefs.current[remoteSocketId]) {
        const audio = document.createElement("audio");
        audio.autoplay = true;
        audio.playsInline = true;
        audio.srcObject = stream;
        document.body.appendChild(audio);
        audioRefs.current[remoteSocketId] = audio;
        audio.play().catch(() => {});
      } else if (audioRefs.current[remoteSocketId].srcObject !== stream) {
        audioRefs.current[remoteSocketId].srcObject = stream;
        audioRefs.current[remoteSocketId].play().catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
      }
    };

    peersRef.current[remoteSocketId] = pc;
    return pc;
  };

  useEffect(() => {
    const handleOffer = async ({ from, offer }) => {
      const pc = createPeer(from);

      if (localStreamRef.current && isRecording) {
        localStreamRef.current.getTracks().forEach((track) => {
          const senders = pc.getSenders();
          const hasTrack = senders.some((s) => s.track === track);
          if (!hasTrack) {
            pc.addTrack(track, localStreamRef.current);
          }
        });
      }

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      if (iceCandidatesQueue.current[from]) {
        for (const candidate of iceCandidatesQueue.current[from]) {
          await pc.addIceCandidate(candidate).catch(() => {});
        }
        delete iceCandidatesQueue.current[from];
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socketService.emit("webrtc-answer", { target: from, answer });
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peersRef.current[from];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        if (iceCandidatesQueue.current[from]) {
          for (const candidate of iceCandidatesQueue.current[from]) {
            await pc.addIceCandidate(candidate).catch(() => {});
          }
          delete iceCandidatesQueue.current[from];
        }
      }
    };

    const handleIce = async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(candidate).catch(() => {});
      } else {
        if (!iceCandidatesQueue.current[from]) {
          iceCandidatesQueue.current[from] = [];
        }
        iceCandidatesQueue.current[from].push(candidate);
      }
    };

    socketService.listen("webrtc-offer", handleOffer);
    socketService.listen("webrtc-answer", handleAnswer);
    socketService.listen("webrtc-ice", handleIce);

    return () => {
      Object.values(peersRef.current).forEach((pc) => pc.close());
      peersRef.current = {};
    };
  }, [currentRoom, isRecording]);

  const initiateCall = async (targetSocketId, stream) => {
    const pc = createPeer(targetSocketId);

    stream.getTracks().forEach((track) => {
      const senders = pc.getSenders();
      const hasTrack = senders.some((s) => s.track === track);
      if (!hasTrack) {
        pc.addTrack(track, stream);
      }
    });

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketService.emit("webrtc-offer", { target: targetSocketId, offer });
  };

  const toggleMic = async () => {
    if (localStreamRef.current) {
      const enabled = !isRecording;
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
      setIsRecording(enabled);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setIsRecording(true);

      users.forEach((user) => {
        if (!user.socketId || user.username === username) return;
        initiateCall(user.socketId, stream);
      });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone");
    }
  };

  useEffect(() => {
    if (isRecording && localStreamRef.current) {
      users.forEach((user) => {
        if (!user.socketId || user.username === username) return;
        if (!peersRef.current[user.socketId]) {
          initiateCall(user.socketId, localStreamRef.current);
        }
      });
    }
  }, [users, isRecording]);

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

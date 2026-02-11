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

  // Queue for ICE candidates that arrive before remote description is set
  const iceCandidatesQueue = useRef({});

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // =====================
  // 🔓 UNLOCK AUDIO ON JOIN (CRITICAL)
  // =====================
  useEffect(() => {
    if (audioUnlockedRef.current) return;

    // Create a dummy audio context / element to try and unlock audio
    const audio = document.createElement("audio");
    audio.autoplay = true;
    audio.muted = true;
    audio.srcObject = new MediaStream(); // empty stream

    const unlock = () => {
      audio
        .play()
        .then(() => {
          audioUnlockedRef.current = true;
          console.log("🔓 Audio unlocked globally");

          // Try to play any pending audio elements
          Object.values(audioRefs.current).forEach((a) => {
            if (a.paused) a.play().catch((e) => console.warn("Retry play failed", e));
          });

          document.removeEventListener("click", unlock);
          document.removeEventListener("touchstart", unlock);
          document.removeEventListener("keydown", unlock);
        })
        .catch((e) => {
          console.warn("🔒 Audio locked until user gesture", e);
        });
    };

    // Attempt auto-play immediately
    unlock();

    // Add multiple interaction listeners for mobile/desktop support
    document.addEventListener("click", unlock);
    document.addEventListener("touchstart", unlock);
    document.addEventListener("keydown", unlock);

    return () => {
      document.removeEventListener("click", unlock);
      document.removeEventListener("touchstart", unlock);
      document.removeEventListener("keydown", unlock);
    }
  }, []);

  // =====================
  // CREATE PEER (WITH RECVONLY TRANSCEIVER)
  // =====================
  const createPeer = (remoteSocketId) => {
    if (peersRef.current[remoteSocketId]) {
      return peersRef.current[remoteSocketId];
    }

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    // 🔥 IMPORTANT: ensure we are always ready to send/receive
    // If we don't add a transceiver, the other side might not offer audio
    // "sendrecv" is default if we don't specify direction, but good to be explicit
    // REMOVED manual addTransceiver to let addTrack/setRemoteDescription handle it naturally
    // pc.addTransceiver("audio", { direction: "sendrecv" });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketService.emit("webrtc-ice", {
          target: remoteSocketId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      console.log(`🎤 Received track from ${remoteSocketId}`, e.streams);

      const stream = e.streams[0];
      if (!stream) return;

      if (!audioRefs.current[remoteSocketId]) {
        const audio = document.createElement("audio");
        audio.autoplay = true;
        audio.playsInline = true;
        audio.srcObject = stream;
        document.body.appendChild(audio);
        audioRefs.current[remoteSocketId] = audio;

        audio.play().catch((err) => {
          console.error("Error playing audio stream:", err);
        });
      } else {
        // Ensure srcObject is updated if stream changes (though unlikely with simple peer)
        if (audioRefs.current[remoteSocketId].srcObject !== stream) {
          audioRefs.current[remoteSocketId].srcObject = stream;
          audioRefs.current[remoteSocketId].play().catch(console.error);
        }
      }
    };

    // Connection state logging
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${remoteSocketId}: ${pc.connectionState}`);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        // potentially clean up?
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

      // If we have a local stream and are recording, add tracks now
      // This is crucial for bidirectional audio on answer
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

      // Process queued ICE candidates
      if (iceCandidatesQueue.current[from]) {
        for (const candidate of iceCandidatesQueue.current[from]) {
          await pc.addIceCandidate(candidate).catch(console.error);
        }
        delete iceCandidatesQueue.current[from];
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

        // 🔥 CRITICAL FIX: Flush ICE candidates queue for this peer
        if (iceCandidatesQueue.current[from]) {
          for (const candidate of iceCandidatesQueue.current[from]) {
            await pc.addIceCandidate(candidate).catch((err) => {
              console.error("Error adding queued ICE candidate:", err);
            });
          }
          delete iceCandidatesQueue.current[from];
        }

        console.log(`Transceivers after Answer from ${from}:`, pc.getTransceivers().map(t => ({
          mid: t.mid,
          direction: t.direction,
          currentDirection: t.currentDirection
        })));
      }
    };

    const handleIce = async ({ from, candidate }) => {
      const pc = peersRef.current[from];
      if (pc && pc.remoteDescription) {
        await pc.addIceCandidate(candidate).catch(console.error);
      } else {
        // Queue candidate if remote description not set yet
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
  }, [currentRoom, isRecording]); // Added isRecording dependency to handleOffer use latest state but be careful with re-binds

  // =====================
  // 🎤 MIC TOGGLE (UNCHANGED)
  // =====================
  // =====================
  // 🎤 MIC TOGGLE & MANAGEMENT
  // =====================
  // =====================
  // 🎤 MIC TOGGLE & MANAGEMENT
  // =====================
  const initiateCall = async (targetSocketId, stream) => {
    // Ensure we have a peer connection
    const pc = createPeer(targetSocketId);

    // Check if we already have a sender for this track
    // If not, add the tracks
    stream.getTracks().forEach((track) => {
      const senders = pc.getSenders();
      const hasTrack = senders.some((s) => s.track === track);
      if (!hasTrack) {
        pc.addTrack(track, stream);
      }
    });

    console.log(`Transceivers before Offer to ${targetSocketId}:`, pc.getTransceivers().map(t => ({
      mid: t.mid,
      direction: t.direction,
      currentDirection: t.currentDirection
    })));

    // Create Offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketService.emit("webrtc-offer", {
      target: targetSocketId,
      offer,
    });
  };

  const toggleMic = async () => {
    // If we already have a stream, just toggle tracks
    if (localStreamRef.current) {
      const enabled = !isRecording;
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
      });
      setIsRecording(enabled);
      return;
    }

    // First time turning on mic
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setIsRecording(true);

      // Call everyone currently in the room
      users.forEach((user) => {
        if (!user.socketId || user.username === username) return;
        initiateCall(user.socketId, stream);
      });
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone");
    }
  };

  // Watch for new users joining while Mic is ON
  useEffect(() => {
    if (isRecording && localStreamRef.current) {
      users.forEach((user) => {
        if (!user.socketId || user.username === username) return;
        // If we don't have a peer connection yet, or it's just a receive-only one from them
        // we might want to ensure we are sending to them.
        // For simplicity, just try to initiate call to new participants.
        if (!peersRef.current[user.socketId]) {
          initiateCall(user.socketId, localStreamRef.current);
        }
      });
    }
  }, [users, isRecording]);

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

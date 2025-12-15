// src/services/webrtc.js
import socketService from "./socket";

let pc = null;
let localStream = null;

export const startAudio = async (roomId) => {
  console.log("🎤 Starting microphone...");

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  // 🔊 play remote audio
  pc.ontrack = (event) => {
    console.log("🔊 Remote audio received");
    const audio = document.createElement("audio");
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("🧊 ICE candidate sent");
      socketService.emit("webrtc-ice", { roomId, candidate: event.candidate });
    }
  };

  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  console.log("🎙️ Local audio stream created");

  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  console.log("📨 Sending WebRTC offer");
  socketService.emit("webrtc-offer", { roomId, offer });
};

export const handleOffer = async ({ roomId, offer }) => {
  console.log("📩 WebRTC offer received");

  pc = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  });

  pc.ontrack = (event) => {
    console.log("🔊 Playing remote audio");
    const audio = document.createElement("audio");
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socketService.emit("webrtc-ice", { roomId, candidate: event.candidate });
    }
  };

  localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  await pc.setRemoteDescription(offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);

  console.log("📤 Sending WebRTC answer");
  socketService.emit("webrtc-answer", { roomId, answer });
};

export const handleAnswer = async ({ answer }) => {
  console.log("✅ WebRTC answer received");
  await pc.setRemoteDescription(answer);
};

export const handleIce = async ({ candidate }) => {
  if (candidate) {
    console.log("🧊 ICE candidate received");
    await pc.addIceCandidate(candidate);
  }
};

export const stopAudio = () => {
  console.log("🛑 Stopping microphone");
  localStream?.getTracks().forEach((t) => t.stop());
  pc?.close();
  pc = null;
};

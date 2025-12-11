// frontend/src/services/webrtc.js
import socketService from "./socket";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    // Add TURN if you have one
  ],
};

class WebRTCService {
  constructor() {
    this.localStream = null;
    this.peerConnections = {}; // key: peerSocketId -> RTCPeerConnection
    this.remoteAudioElements = {}; // key -> HTMLAudioElement
    this.inited = false;
    this.currentRoom = null;
    this.username = null;
    this._setupSocketListeners = this._setupSocketListeners.bind(this);
  }

  init() {
    if (this.inited) return;
    this.inited = true;

    // ensure socket is connected
    if (!socketService.socket) {
      console.warn("WebRTC: socket not ready yet");
      return;
    }
    this._setupSocketListeners();
    console.log("✅ WebRTC init complete");
  }

  _setupSocketListeners() {
    const s = socketService.socket;
    if (!s) return;

    // existing users list (sent to the joining socket)
    s.on("existing-users", async ({ existing }) => {
      console.log("webrtc: existing users:", existing);
      // create offer to every existing user
      for (const u of existing) {
        await this._createPeerAndOffer(u.socketId, u.username);
      }
    });

    // new participant joined after you
    s.on("new-participant", async ({ socketId, username }) => {
      console.log("webrtc: new participant arrived:", socketId, username);
      // existing clients should create offer to newcomer
      await this._createPeerAndOffer(socketId, username);
    });

    // incoming offer
    s.on("webrtc-offer", async ({ from, sdp, username }) => {
      console.log("webrtc: got OFFER from", from, username);
      await this._handleOffer(from, sdp, username);
    });

    // incoming answer
    s.on("webrtc-answer", async ({ from, sdp }) => {
      console.log("webrtc: got ANSWER from", from);
      const pc = this.peerConnections[from];
      if (!pc) {
        console.warn("webrtc: no pc for answer from", from);
        return;
      }
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    });

    // incoming ICE
    s.on("webrtc-ice-candidate", async ({ from, candidate }) => {
      const pc = this.peerConnections[from];
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("webrtc: addIceCandidate error", err);
      }
    });
  }

  async startLocalStream() {
    if (this.localStream) {
      console.log("webrtc: local stream already started");
      return this.localStream;
    }
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
      });
      console.log("webrtc: local stream started", this.localStream);
      // For testing: create local audio preview (optional)
      const localAudio = document.getElementById("local-audio-preview");
      if (localAudio) {
        localAudio.srcObject = this.localStream;
        localAudio.muted = true; // prevent feedback
        localAudio.play().catch(() => {});
      }
      return this.localStream;
    } catch (err) {
      console.error("webrtc: failed to get user media", err);
      throw err;
    }
  }

  stopLocalStream() {
    if (!this.localStream) return;
    this.localStream.getTracks().forEach((t) => t.stop());
    this.localStream = null;
    console.log("webrtc: local stream stopped");
  }

  async _createPeerAndOffer(peerId, remoteUsername) {
    if (this.peerConnections[peerId]) {
      console.log("webrtc: peer already exists for", peerId);
      return;
    }
    console.log("webrtc: creating pc ->", peerId);

    // create pc
    const pc = new RTCPeerConnection(configuration);
    this.peerConnections[peerId] = pc;

    // add local tracks (if any)
    if (this.localStream) {
      for (const track of this.localStream.getTracks()) {
        pc.addTrack(track, this.localStream);
      }
    }

    // ontrack -> create/play audio element
    pc.ontrack = (event) => {
      console.log("webrtc: ontrack from", peerId, event.streams);
      const remoteStream = event.streams[0];
      this._attachRemoteStream(peerId, remoteStream, remoteUsername);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketService.socket.emit("webrtc-ice-candidate", {
          to: peerId,
          from: socketService.socket.id,
          candidate: e.candidate,
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("webrtc: connectionstate", peerId, pc.connectionState);
      if (pc.connectionState === "failed" || pc.connectionState === "closed") {
        this._cleanupPeer(peerId);
      }
    };

    // create offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socketService.socket.emit("webrtc-offer", {
        to: peerId,
        from: socketService.socket.id,
        sdp: pc.localDescription,
        username: this.username,
      });
      console.log("webrtc: sent OFFER to", peerId);
    } catch (err) {
      console.error("webrtc: createOffer error", err);
    }
  }

  async _handleOffer(from, sdp, remoteUsername) {
    // create pc if not exists
    if (this.peerConnections[from]) {
      console.log("webrtc: pc exists for offer from", from);
    } else {
      console.log("webrtc: creating pc for incoming offer from", from);
      const pc = new RTCPeerConnection(configuration);
      this.peerConnections[from] = pc;

      // add local tracks if present
      if (this.localStream) {
        for (const track of this.localStream.getTracks()) {
          pc.addTrack(track, this.localStream);
        }
      }

      pc.ontrack = (event) => {
        console.log("webrtc: ontrack (answerer) from", from, event.streams);
        this._attachRemoteStream(from, event.streams[0], remoteUsername);
      };

      pc.onicecandidate = (e) => {
        if (e.candidate) {
          socketService.socket.emit("webrtc-ice-candidate", {
            to: from,
            from: socketService.socket.id,
            candidate: e.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        console.log("webrtc: connectionstate", from, pc.connectionState);
        if (pc.connectionState === "failed" || pc.connectionState === "closed") {
          this._cleanupPeer(from);
        }
      };
    }

    const pc = this.peerConnections[from];
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socketService.socket.emit("webrtc-answer", {
        to: from,
        from: socketService.socket.id,
        sdp: pc.localDescription,
      });
      console.log("webrtc: sent ANSWER to", from);
    } catch (err) {
      console.error("webrtc: handleOffer error:", err);
    }
  }

  _attachRemoteStream(peerId, stream, remoteUsername) {
    console.log("webrtc: attach remote stream for", peerId, stream);

    // create or reuse audio element
    let audioEl = this.remoteAudioElements[peerId];
    if (!audioEl) {
      audioEl = document.createElement("audio");
      audioEl.autoplay = true;
      audioEl.playsInline = true;
      audioEl.id = `remote-audio-${peerId}`;
      audioEl.style.display = "none"; // hide UI
      document.body.appendChild(audioEl);
      this.remoteAudioElements[peerId] = audioEl;
    }

    audioEl.srcObject = stream;
    audioEl.play().catch((e) => {
      console.warn("webrtc: autoplay prevented", e);
    });

    console.log(`🔊 Remote audio playing from ${remoteUsername || peerId}`);
  }

  _cleanupPeer(peerId) {
    const pc = this.peerConnections[peerId];
    if (pc) {
      try {
        pc.close();
      } catch (e) {}
      delete this.peerConnections[peerId];
    }
    const audioEl = this.remoteAudioElements[peerId];
    if (audioEl) {
      audioEl.pause();
      audioEl.srcObject = null;
      audioEl.remove();
      delete this.remoteAudioElements[peerId];
    }
    console.log("webrtc: cleaned up peer", peerId);
  }

  setRoom(roomId) {
    this.currentRoom = roomId;
  }

  setUsername(name) {
    this.username = name;
  }

  // Called when user leaves room
  cleanupAll() {
    Object.keys(this.peerConnections).forEach((id) => this._cleanupPeer(id));
    this.stopLocalStream();
    this.currentRoom = null;
    this.username = null;
    this.inited = false;
  }
}

const webrtcService = new WebRTCService();
export default webrtcService;

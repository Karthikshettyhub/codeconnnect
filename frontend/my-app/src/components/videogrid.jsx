import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRoom } from "../contexts/roomcontext";

import socketService from "../services/socket";

import "./videogrid.css";

// =========================
// ICE SERVERS
// =========================

const ICE_SERVERS = {
  iceServers: [
    {
      urls: "stun:stun.l.google.com:19302",
    },
  ],
};

// =========================
// REMOTE VIDEO COMPONENT
// =========================

const RemoteVideo = ({ stream }) => {

  const videoRef = useRef(null);

  useEffect(() => {

    if (
      videoRef.current &&
      stream
    ) {

      const video =
        videoRef.current;

      // attach only once
      if (
        video.srcObject !== stream
      ) {

        video.srcObject = stream;
      }

      video.onloadedmetadata =
        async () => {

          try {

            await video.play();

            console.log(
              "✅ REMOTE VIDEO PLAYING"
            );

          } catch (err) {

            console.log(
              "REMOTE VIDEO ERROR:",
              err
            );
          }
        };
    }

  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      className="video-element"
    />
  );
};

const VideoGrid = ({
  isVideoEnabled,
}) => {

  const {
    users,
    username,
  } = useRoom();

  // =========================
  // STATES
  // =========================

  const [localStream, setLocalStream] =
    useState(null);

  const [remoteStreams, setRemoteStreams] =
    useState({});

  // =========================
  // REFS
  // =========================

  const localVideoRef = useRef(null);

  const peersRef = useRef({});

  // =========================
  // ATTACH LOCAL VIDEO
  // =========================

  useEffect(() => {

    if (
      localVideoRef.current &&
      localStream
    ) {

      const video =
        localVideoRef.current;

      video.srcObject = localStream;

      video.onloadedmetadata =
        async () => {

          try {

            await video.play();

            console.log(
              "✅ LOCAL VIDEO PLAYING"
            );

          } catch (err) {

            console.log(
              "VIDEO PLAY ERROR:",
              err
            );
          }
        };
    }

  }, [localStream]);

  // =========================
  // CREATE PEER
  // =========================

  const createPeer = (
    remoteSocketId
  ) => {

    if (
      peersRef.current[
        remoteSocketId
      ]
    ) {

      return peersRef.current[
        remoteSocketId
      ];
    }

    console.log(
      "🔗 CREATING PEER:",
      remoteSocketId
    );

    const pc =
      new RTCPeerConnection(
        ICE_SERVERS
      );

    // ICE
    pc.onicecandidate = (
      event
    ) => {

      if (event.candidate) {

        socketService.emit(
          "webrtc-ice",
          {
            target:
              remoteSocketId,

            candidate:
              event.candidate,
          }
        );
      }
    };

    // REMOTE TRACK
    pc.ontrack = (
      event
    ) => {

      console.log(
        "🎥 REMOTE TRACK:",
        remoteSocketId
      );

      const stream =
        event.streams[0];

      if (!stream) return;

      setRemoteStreams(
        (prev) => ({
          ...prev,
          [remoteSocketId]:
            stream,
        })
      );
    };

    // CONNECTION STATE
    pc.onconnectionstatechange =
      () => {

        console.log(
          "PEER STATE:",
          remoteSocketId,
          pc.connectionState
        );

        if (
          pc.connectionState ===
            "disconnected" ||

          pc.connectionState ===
            "failed" ||

          pc.connectionState ===
            "closed"
        ) {

          delete peersRef.current[
            remoteSocketId
          ];

          setRemoteStreams(
            (prev) => {

              const updated = {
                ...prev,
              };

              delete updated[
                remoteSocketId
              ];

              return updated;
            }
          );
        }
      };

    peersRef.current[
      remoteSocketId
    ] = pc;

    return pc;
  };

  // =========================
  // START VIDEO
  // =========================

  const startVideo =
    async () => {

      try {

        console.log(
          "🎥 STARTING CAMERA"
        );

        const stream =
          await navigator.mediaDevices.getUserMedia(
            {
              video: true,
              audio: false,
            }
          );

        setLocalStream(stream);

      } catch (err) {

        console.error(
          "❌ CAMERA ERROR:",
          err
        );

        alert(
          "Camera access denied"
        );
      }
    };

  // =========================
  // STOP VIDEO
  // =========================

  const stopVideo = () => {

    console.log(
      "🛑 STOP VIDEO"
    );

    if (localStream) {

      localStream
        .getTracks()
        .forEach((track) => {
          track.stop();
        });
    }

    setLocalStream(null);

    if (
      localVideoRef.current
    ) {

      localVideoRef.current.srcObject =
        null;
    }

    Object.values(
      peersRef.current
    ).forEach((pc) => {

      try {
        pc.close();
      } catch (err) {
        console.log(err);
      }
    });

    peersRef.current = {};

    setRemoteStreams({});
  };

  // =========================
  // TOGGLE VIDEO
  // =========================

  useEffect(() => {

    if (
      isVideoEnabled
    ) {

      startVideo();

    } else {

      stopVideo();
    }

  }, [isVideoEnabled]);

  // =========================
  // CONNECT TO USERS
  // =========================

  useEffect(() => {

    console.log(
      "👥 CURRENT USERS:",
      users
    );

    if (!localStream)
      return;

    users.forEach(
      async (user) => {

        if (
          !user.socketId
        ) {
          return;
        }

        if (
          user.socketId ===
          socketService.socket.id
        ) {
          return;
        }

        if (
          peersRef.current[
            user.socketId
          ]
        ) {
          return;
        }

        try {

          console.log(
            "🔗 CONNECTING TO:",
            user.username
          );

          const pc =
            createPeer(
              user.socketId
            );

          localStream
            .getTracks()
            .forEach(
              (track) => {

                pc.addTrack(
                  track,
                  localStream
                );
              }
            );

          const offer =
            await pc.createOffer();

          await pc.setLocalDescription(
            offer
          );

          socketService.emit(
            "webrtc-offer",
            {
              target:
                user.socketId,

              offer,
            }
          );

        } catch (err) {

          console.error(
            "❌ CONNECT ERROR:",
            err
          );
        }
      }
    );

  }, [
    users,
    localStream,
  ]);

  // =========================
  // SOCKET EVENTS
  // =========================

  useEffect(() => {

    const handleOffer =
      async ({
        from,
        offer,
      }) => {

        console.log(
          "📥 OFFER:",
          from
        );

        const pc =
          createPeer(from);

        if (localStream) {

          localStream
            .getTracks()
            .forEach(
              (track) => {

                pc.addTrack(
                  track,
                  localStream
                );
              }
            );
        }

        await pc.setRemoteDescription(
          new RTCSessionDescription(
            offer
          )
        );

        const answer =
          await pc.createAnswer();

        await pc.setLocalDescription(
          answer
        );

        socketService.emit(
          "webrtc-answer",
          {
            target: from,
            answer,
          }
        );
      };

    const handleAnswer =
      async ({
        from,
        answer,
      }) => {

        const pc =
          peersRef.current[
            from
          ];

        if (!pc) return;

        await pc.setRemoteDescription(
          new RTCSessionDescription(
            answer
          )
        );
      };

    const handleIce =
      async ({
        from,
        candidate,
      }) => {

        const pc =
          peersRef.current[
            from
          ];

        if (!pc) return;

        try {

          await pc.addIceCandidate(
            new RTCIceCandidate(
              candidate
            )
          );

        } catch (err) {

          console.error(
            "ICE ERROR:",
            err
          );
        }
      };

    socketService.listen(
      "webrtc-offer",
      handleOffer
    );

    socketService.listen(
      "webrtc-answer",
      handleAnswer
    );

    socketService.listen(
      "webrtc-ice",
      handleIce
    );

    return () => {

      socketService.socket?.off(
        "webrtc-offer",
        handleOffer
      );

      socketService.socket?.off(
        "webrtc-answer",
        handleAnswer
      );

      socketService.socket?.off(
        "webrtc-ice",
        handleIce
      );
    };

  }, [localStream]);

  // =========================
  // CLEANUP
  // =========================

  useEffect(() => {

    return () => {

      console.log(
        "🧹 CLEANING VIDEO GRID"
      );

      stopVideo();
    };

  }, []);

  // =========================
  // UI
  // =========================

  return (

    <div className="video-grid">

      {/* LOCAL USER */}
      <div className="video-tile">

        {localStream ? (

          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="video-element"
          />

        ) : (

          <div className="video-placeholder">
            {username}
          </div>
        )}

        <div className="video-name">
          {username} (You)
        </div>

      </div>

      {/* REMOTE USERS */}
      {users
        .filter(
          (user) =>

            user.socketId &&

            user.socketId !==
            socketService.socket.id
        )
        .map((user) => {

          const stream =
            remoteStreams[
              user.socketId
            ];

          return (

            <div
              key={user.socketId}
              className="video-tile"
            >

              {stream ? (

                <RemoteVideo
                  stream={stream}
                />

              ) : (

                <div className="video-placeholder">
                  {user.username}
                </div>
              )}

              <div className="video-name">
                {user.username}
              </div>

            </div>
          );
        })}
    </div>
  );
};

export default VideoGrid;
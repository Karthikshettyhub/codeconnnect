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
  localAudioStreamRef,
  isMicEnabled,
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

  const [failedSockets, setFailedSockets] = 
    useState(new Set());

  const activeUsers = React.useMemo(() => {
    const map = new Map();
    users.forEach((u) => {
      if (!failedSockets.has(u.socketId)) {
        map.set(u.username, u);
      }
    });
    return Array.from(map.values());
  }, [users, failedSockets]);

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

      if (
        video.srcObject !== localStream
      ) {

        video.srcObject =
          localStream;
      }

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

    // =========================
    // ICE
    // =========================

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

    // =========================
    // REMOTE TRACK
    // =========================

    pc.ontrack = (
      event
    ) => {

      console.log(
        "🎥 REMOTE TRACK:",
        remoteSocketId
      );

      setRemoteStreams(
        (prev) => {

          const existingStream =
            prev[
              remoteSocketId
            ] ||
            new MediaStream();

          event.streams[0]
            .getTracks()
            .forEach((track) => {

              const alreadyExists =
                existingStream
                  .getTracks()
                  .some(
                    (t) =>
                      t.id ===
                      track.id
                  );

              if (
                !alreadyExists
              ) {

                existingStream.addTrack(
                  track
                );
              }
            });

          return {
            ...prev,
            [remoteSocketId]:
              existingStream,
          };
        }
      );
    };

    // =========================
    // CONNECTION STATE
    // =========================

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

          pc.close();

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

          setFailedSockets((prev) => {
            const newSet = new Set(prev);
            newSet.add(remoteSocketId);
            return newSet;
          });
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
  // RENEGOTIATE
  // =========================

  const renegotiatePeer =
    async (
      pc,
      targetSocketId
    ) => {

      try {

        if (
          pc.signalingState !==
          "stable"
        ) {
          return;
        }

        const offer =
          await pc.createOffer();

        await pc.setLocalDescription(
          offer
        );

        socketService.emit(
          "webrtc-offer",
          {
            target:
              targetSocketId,
            offer,
          }
        );

      } catch (err) {

        console.error(
          "❌ RENEGOTIATION ERROR:",
          err
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

    // REMOVE VIDEO TRACKS
    Object.entries(
      peersRef.current
    ).forEach(
      async ([
        socketId,
        pc,
      ]) => {

        pc.getSenders()
          .forEach(
            (sender) => {

              if (
                sender.track &&
                sender.track.kind ===
                  "video"
              ) {

                try {

                  pc.removeTrack(
                    sender
                  );

                } catch (err) {

                  console.log(
                    err
                  );
                }
              }
            }
          );

        await renegotiatePeer(
          pc,
          socketId
        );
      }
    );
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
      activeUsers
    );

    if (
      !localStream &&
      !localAudioStreamRef?.current
    ) {
      return;
    }

    activeUsers.forEach(
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

        try {

          console.log(
            "🔗 CONNECTING TO:",
            user.username
          );

          const existingPeer =
            peersRef.current[
              user.socketId
            ];

          const pc =
            existingPeer ||
            createPeer(
              user.socketId
            );

          // =========================
          // VIDEO TRACKS
          // =========================

          if (
            localStream
          ) {

            localStream
              .getTracks()
              .forEach(
                (track) => {

                  const alreadyAdded =
                    pc
                      .getSenders()
                      .some(
                        (
                          sender
                        ) =>
                          sender.track ===
                          track
                      );

                  if (
                    !alreadyAdded
                  ) {

                    pc.addTrack(
                      track,
                      localStream
                    );
                  }
                }
              );
          }

          // =========================
          // AUDIO TRACKS
          // =========================

          if (
            localAudioStreamRef?.current
          ) {

            localAudioStreamRef.current
              .getTracks()
              .forEach(
                (track) => {

                  track.enabled =
                    true;

                  const alreadyAdded =
                    pc
                      .getSenders()
                      .some(
                        (
                          sender
                        ) =>
                          sender.track ===
                          track
                      );

                  if (
                    !alreadyAdded
                  ) {

                    pc.addTrack(
                      track,
                      localAudioStreamRef.current
                    );
                  }
                }
              );
          }

          await renegotiatePeer(
            pc,
            user.socketId
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
    activeUsers,
    localStream,
    isMicEnabled,
    localAudioStreamRef,
  ]);

  // =========================
  // REMOVE DISCONNECTED USERS
  // =========================

  useEffect(() => {

    const activeSocketIds =
      activeUsers.map(
        (u) => u.socketId
      );

    Object.keys(
      peersRef.current
    ).forEach((socketId) => {

      if (
        socketId ===
        socketService.socket.id
      ) {
        return;
      }

      if (
        !activeSocketIds.includes(
          socketId
        )
      ) {

        console.log(
          "🗑️ CLEANING DISCONNECTED USER:",
          socketId
        );

        peersRef.current[
          socketId
        ]?.close();

        delete peersRef.current[
          socketId
        ];

        setRemoteStreams(
          (prev) => {

            const updated = {
              ...prev,
            };

            delete updated[
              socketId
            ];

            return updated;
          }
        );
      }
    });

  }, [activeUsers]);

  // =========================
  // AUDIO RENEGOTIATION
  // =========================

  useEffect(() => {

    if (
      !isMicEnabled ||
      !localAudioStreamRef?.current
    ) {
      return;
    }

    const renegotiate =
      async () => {

        for (const user of activeUsers) {

          if (
            !user.socketId ||
            user.socketId ===
              socketService.socket.id
          ) {
            continue;
          }

          const pc =
            peersRef.current[
              user.socketId
            ];

          if (!pc) continue;

          localAudioStreamRef.current
            .getTracks()
            .forEach(
              (track) => {

                const alreadyAdded =
                  pc
                    .getSenders()
                    .some(
                      (
                        sender
                      ) =>
                        sender.track ===
                        track
                    );

                if (
                  !alreadyAdded
                ) {

                  pc.addTrack(
                    track,
                    localAudioStreamRef.current
                  );
                }
              }
            );

          await renegotiatePeer(
            pc,
            user.socketId
          );
        }
      };

    renegotiate();

  }, [isMicEnabled]);

  // =========================
  // SOCKET EVENTS
  // =========================

  useEffect(() => {

    // =========================
    // HANDLE OFFER
    // =========================

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

        // =========================
        // VIDEO TRACKS
        // =========================

        if (
          localStream
        ) {

          localStream
            .getTracks()
            .forEach(
              (track) => {

                const alreadyAdded =
                  pc
                    .getSenders()
                    .some(
                      (
                        sender
                      ) =>
                        sender.track ===
                        track
                    );

                if (
                  !alreadyAdded
                ) {

                  pc.addTrack(
                    track,
                    localStream
                  );
                }
              }
            );
        }

        // =========================
        // AUDIO TRACKS
        // =========================

        if (
          localAudioStreamRef?.current
        ) {

          localAudioStreamRef.current
            .getTracks()
            .forEach(
              (track) => {

                track.enabled =
                  true;

                const alreadyAdded =
                  pc
                    .getSenders()
                    .some(
                      (
                        sender
                      ) =>
                        sender.track ===
                        track
                    );

                if (
                  !alreadyAdded
                ) {

                  pc.addTrack(
                    track,
                    localAudioStreamRef.current
                  );
                }
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

    // =========================
    // HANDLE ANSWER
    // =========================

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

        try {

          await pc.setRemoteDescription(
            new RTCSessionDescription(
              answer
            )
          );

        } catch (err) {

          console.error(
            "ANSWER ERROR:",
            err
          );
        }
      };

    // =========================
    // HANDLE ICE
    // =========================

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

    // =========================
    // SOCKET LISTENERS
    // =========================

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

  }, [
    localStream,
    isMicEnabled,
  ]);

  // =========================
  // CLEANUP
  // =========================

  useEffect(() => {

    return () => {

      console.log(
        "🧹 CLEANING VIDEO GRID"
      );

      Object.values(
        peersRef.current
      ).forEach((pc) => {

        pc.close();
      });

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
      {activeUsers
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
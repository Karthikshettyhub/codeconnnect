import React, { useEffect, useRef, useState } from "react";
import { useRoom } from "../contexts/roomcontext";
import { useNavigate, useParams } from "react-router-dom";

import ChatBox from "../components/chatbox";
import CodeEditor from "../components/codeeditor";
import CompilerPanel from "../components/CompilerPanel";
import VideoGrid from "../components/videogrid";
import ThemeToggle from "../components/ThemeToggle";

import {
  Maximize2,
  Minimize2,
  X,
  Video,
  VideoOff,
  Mic,
  MicOff,
  MessageSquare,
  LogOut,
  TerminalSquare
} from "lucide-react";

import "./roompage.css";

const RoomPage = () => {

  const {
    currentRoom,
    joinRoom,
    leaveRoom,
    code,
    language,
    isInitialized,
    messages
  } = useRoom();

  const navigate = useNavigate();
  const { roomId } = useParams();

  const [leftWidth, setLeftWidth] = useState(65);
  const [topHeight, setTopHeight] = useState(70);

  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);

  const previousMessageCount = useRef(0);
  const isMessagesInitialized = useRef(false);

  const [isCompilerCollapsed, setIsCompilerCollapsed] = useState(false);

  const localAudioStreamRef = useRef(null);

  const containerRef = useRef(null);
  const leftPaneRef = useRef(null);

  // =========================
  // REJOIN AFTER REFRESH
  // =========================

  useEffect(() => {

    if (!isInitialized) return;

    if (!roomId) return;

    const storedUsername =
      localStorage.getItem("username");

    const passcode =
      localStorage.getItem("passcode");

    if (!storedUsername) {

      navigate("/");
      return;
    }

    if (!currentRoom) {

      console.log(
        "🔄 REJOINING ROOM:",
        roomId
      );

      joinRoom(
        roomId,
        storedUsername,
        passcode
      );
    }

  }, [
    roomId,
    currentRoom,
    isInitialized
  ]);

  // =========================
  // UNREAD MESSAGE COUNTER
  // =========================

  useEffect(() => {

    if (!messages) return;

    if (!isMessagesInitialized.current) {
      previousMessageCount.current = messages.length;
      isMessagesInitialized.current = true;
      return;
    }

    if (messages.length > previousMessageCount.current) {

      if (!isChatOpen) {

        const newMessages = messages.length - previousMessageCount.current;

        setUnreadCount((prev) => prev + newMessages);
      }
    }

    previousMessageCount.current = messages.length;

  }, [messages, isChatOpen]);

  // Reset when opened
  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);


  if (!roomId) return null;

  // =========================
  // TOGGLE MIC
  // =========================

  const toggleMic = async () => {

    try {

      if (!localAudioStreamRef.current) {

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: true,
          });

        localAudioStreamRef.current =
          stream;

        setIsMicEnabled(true);

        console.log("🎤 MIC ENABLED");

        return;
      }

      const enabled =
        !isMicEnabled;

      localAudioStreamRef.current
        .getAudioTracks()
        .forEach((track) => {

          track.enabled = enabled;
        });

      setIsMicEnabled(enabled);

    } catch (err) {

      console.error(
        "MIC ERROR:",
        err
      );
    }
  };

  // =========================
  // LEAVE ROOM
  // =========================

  const handleLeave = () => {

    leaveRoom();

    navigate("/");
  };

  // =========================
  // VERTICAL RESIZE
  // =========================

  const startVerticalResize = (e) => {

    e.preventDefault();

    document.addEventListener(
      "mousemove",
      onVerticalResize
    );

    document.addEventListener(
      "mouseup",
      stopVerticalResize
    );

    document.body.style.cursor =
      "col-resize";
  };

  const onVerticalResize = (e) => {

    if (!containerRef.current) return;

    const rect =
      containerRef.current.getBoundingClientRect();

    const newWidth =
      ((e.clientX - rect.left) /
        rect.width) *
      100;

    if (
      newWidth > 20 &&
      newWidth < 80
    ) {

      setLeftWidth(newWidth);
    }
  };

  const stopVerticalResize = () => {

    document.removeEventListener(
      "mousemove",
      onVerticalResize
    );

    document.removeEventListener(
      "mouseup",
      stopVerticalResize
    );

    document.body.style.cursor =
      "default";
  };

  // =========================
  // HORIZONTAL RESIZE
  // =========================

  const startHorizontalResize = (e) => {

    e.preventDefault();

    document.addEventListener(
      "mousemove",
      onHorizontalResize
    );

    document.addEventListener(
      "mouseup",
      stopHorizontalResize
    );

    document.body.style.cursor =
      "row-resize";
  };

  const onHorizontalResize = (e) => {

    if (!leftPaneRef.current) return;

    const rect =
      leftPaneRef.current.getBoundingClientRect();

    const newHeight =
      ((e.clientY - rect.top) /
        rect.height) *
      100;

    if (
      newHeight > 20 &&
      newHeight < 80
    ) {

      setTopHeight(newHeight);
    }
  };

  const stopHorizontalResize = () => {

    document.removeEventListener(
      "mousemove",
      onHorizontalResize
    );

    document.removeEventListener(
      "mouseup",
      stopHorizontalResize
    );

    document.body.style.cursor =
      "default";
  };

  // =========================
  // LOADING
  // =========================

  if (!isInitialized) {

    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Initializing room...</p>
      </div>
    );
  }

  return (

    <div className="roompage">

      <header className="room-header">

        <div className="room-header-left">
          <div className="workspace-brand">
            CodeCollab
          </div>
        </div>

        <div className="room-info">

          <div className="live-status">
            <div className="status-dot"></div>
            <span>LIVE</span>
          </div>

          <div className="room-id-pill">
            <span className="room-id-label">
              ID
            </span>

            <span className="room-id-text">
              {roomId}
            </span>
          </div>
        </div>

        <div className="room-header-right">

          <ThemeToggle />

          <button
            className="leave-btn-header"
            onClick={handleLeave}
          >

            <LogOut size={15} />

            <span>Leave</span>

          </button>
        </div>
      </header>

      <div
        className="room-layout"
        ref={containerRef}
      >

        {/* LEFT */}
        <div
          className="left-pane"
          ref={leftPaneRef}
          style={{
            width: `${leftWidth}%`
          }}
        >

          <div
            className="editor-section"
            style={{
              height:
                isCompilerCollapsed
                  ? "calc(100% - 44px)"
                  : `${topHeight}%`
            }}
          >
            <CodeEditor />
          </div>

          {!isCompilerCollapsed && (
            <div
              className="resizer-horizontal"
              onMouseDown={
                startHorizontalResize
              }
            >
              <div className="resizer-line-h"></div>
            </div>
          )}

          <div
            className={`compiler-section ${isCompilerCollapsed
              ? "collapsed"
              : ""
              }`}
            style={{
              height:
                isCompilerCollapsed
                  ? "44px"
                  : `calc(${100 - topHeight}% - 4px)`
            }}
          >

            <div className="compiler-header">

              <div className="compiler-tab">

                <TerminalSquare
                  size={14}
                  className="compiler-icon"
                />

                <span>Terminal</span>

              </div>

              <div className="compiler-actions">

                <button
                  className="toggle-btn"
                  onClick={() =>
                    setIsCompilerCollapsed(
                      !isCompilerCollapsed
                    )
                  }
                >

                  {isCompilerCollapsed
                    ? <Maximize2 size={14} />
                    : <Minimize2 size={14} />
                  }

                </button>
              </div>
            </div>

            {!isCompilerCollapsed && (

              <div className="compiler-body">
                <CompilerPanel
                  language={language}
                  code={code}
                />
              </div>

            )}
          </div>
        </div>

        {/* VERTICAL RESIZER */}
        <div
          className="resizer-vertical"
          onMouseDown={startVerticalResize}
        >
          <div className="resizer-line-v"></div>
        </div>

        {/* RIGHT */}
        <div
          className="right-pane"
          style={{
            width: `calc(${100 - leftWidth}% - 4px)`
          }}
        >

          <VideoGrid
            isVideoEnabled={isVideoEnabled}
            localAudioStreamRef={localAudioStreamRef}
            isMicEnabled={isMicEnabled}
          />

          {/* DOCK */}
          <div className="unified-dock">

            <button
              className={`dock-btn ${isMicEnabled
                ? "active-dock-btn"
                : "inactive-dock-btn"
                }`}
              onClick={toggleMic}
            >

              {isMicEnabled
                ? <Mic size={20} />
                : <MicOff size={20} />
              }

            </button>

            <button
              className={`dock-btn ${isVideoEnabled
                ? "active-dock-btn"
                : "inactive-dock-btn"
                }`}
              onClick={() =>
                setIsVideoEnabled(
                  !isVideoEnabled
                )
              }
            >

              {isVideoEnabled
                ? <Video size={20} />
                : <VideoOff size={20} />
              }

            </button>

            <div className="dock-divider"></div>

            <button
              className={`dock-btn ${isChatOpen
                ? "active-chat-btn"
                : "inactive-chat-btn"
                }`}
              onClick={() => {

                const nextState =
                  !isChatOpen;

                setIsChatOpen(nextState);

                if (nextState) {
                  setUnreadCount(0);
                }
              }}
            >

              <MessageSquare size={20} />

              {unreadCount > 0 &&
                !isChatOpen && (

                  <span className="chat-notification-badge">
                    {unreadCount}
                  </span>

                )}

            </button>
          </div>

          {/* CHAT */}
          <div
            className={`chat-overlay ${isChatOpen
              ? "open"
              : ""
              }`}
          >

            <div className="chat-overlay-header">

              <span className="chat-title">
                Workspace Chat
              </span>

              <button
                className="chat-close-btn"
                onClick={() =>
                  setIsChatOpen(false)
                }
              >
                <X size={16} />
              </button>

            </div>

            <div className="chat-overlay-body">

              {isChatOpen && (
                <ChatBox />
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
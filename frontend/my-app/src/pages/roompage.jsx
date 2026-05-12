import React, { useEffect, useRef, useState } from "react";
import { useRoom } from "../contexts/roomcontext";
import { useNavigate, useParams } from "react-router-dom";
import ChatBox from "../components/chatbox";
import CodeEditor from "../components/codeeditor";
import CompilerPanel from "../components/CompilerPanel";

import {
  Maximize2,
  Minimize2,
  GripVertical,
  GripHorizontal,
  X,
  Video
} from "lucide-react";

import "./roompage.css";
import VideoGrid from "../components/VideoGrid";

const RoomPage = () => {
  const {
    currentRoom,
    joinRoom,
    leaveRoom,
    code,
    language,
    isInitialized
  } = useRoom();

  const navigate = useNavigate();
  const { roomId } = useParams();

  const [leftWidth, setLeftWidth] = useState(65);
  const [topHeight, setTopHeight] = useState(70);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(true);

  const [isCompilerCollapsed, setIsCompilerCollapsed] = useState(false);

  const containerRef = useRef(null);
  const leftPaneRef = useRef(null);

  useEffect(() => {
    if (!isInitialized) return;

    if (!roomId) return;

    const storedUsername = localStorage.getItem("username");
    const passcode = localStorage.getItem("passcode");

    if (storedUsername && !currentRoom) {
      joinRoom(roomId, storedUsername, passcode);
    } else if (!storedUsername) {
      navigate("/");
    }
  }, [roomId, currentRoom, joinRoom, navigate, isInitialized]);

  if (!roomId) return null;

  const handleLeave = () => {
    leaveRoom();
    navigate("/");
  };

  // =========================
  // VERTICAL RESIZE
  // =========================

  const startVerticalResize = (e) => {
    e.preventDefault();

    document.addEventListener("mousemove", onVerticalResize);
    document.addEventListener("mouseup", stopVerticalResize);

    document.body.style.cursor = "col-resize";
  };

  const onVerticalResize = (e) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();

    const newWidth =
      ((e.clientX - rect.left) / rect.width) * 100;

    if (newWidth > 20 && newWidth < 80) {
      setLeftWidth(newWidth);
    }
  };

  const stopVerticalResize = () => {
    document.removeEventListener("mousemove", onVerticalResize);
    document.removeEventListener("mouseup", stopVerticalResize);

    document.body.style.cursor = "default";
  };

  // =========================
  // HORIZONTAL RESIZE
  // =========================

  const startHorizontalResize = (e) => {
    e.preventDefault();

    document.addEventListener("mousemove", onHorizontalResize);
    document.addEventListener("mouseup", stopHorizontalResize);

    document.body.style.cursor = "row-resize";
  };

  const onHorizontalResize = (e) => {
    if (!leftPaneRef.current) return;

    const rect = leftPaneRef.current.getBoundingClientRect();

    const newHeight =
      ((e.clientY - rect.top) / rect.height) * 100;

    if (newHeight > 20 && newHeight < 80) {
      setTopHeight(newHeight);
    }
  };

  const stopHorizontalResize = () => {
    document.removeEventListener("mousemove", onHorizontalResize);
    document.removeEventListener("mouseup", stopHorizontalResize);

    document.body.style.cursor = "default";
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

      {/* =========================
          HEADER
      ========================= */}

      <header className="room-header">
        <div className="room-info">
          <span className="room-badge">LIVE</span>

          <h2>
            Room:{" "}
            <span className="room-id-text">
              {roomId}
            </span>
          </h2>
        </div>

        <button
          className="leave-btn-header"
          onClick={handleLeave}
        >
          Leave Room
        </button>
      </header>

      {/* =========================
          MAIN LAYOUT
      ========================= */}

      <div className="room-layout" ref={containerRef}>

        {/* =========================
            LEFT PANE
        ========================= */}

        <div
          className="left-pane"
          ref={leftPaneRef}
          style={{ width: `${leftWidth}%` }}
        >

          {/* EDITOR */}
          <div
            className="editor-section"
            style={{
              height: isCompilerCollapsed
                ? "96%"
                : `${topHeight}%`
            }}
          >
            <CodeEditor />
          </div>

          {/* HORIZONTAL RESIZER */}
          {!isCompilerCollapsed && (
            <div
              className="resizer-horizontal"
              onMouseDown={startHorizontalResize}
            >
              <GripHorizontal size={14} />
            </div>
          )}

          {/* COMPILER */}
          <div
            className={`compiler-section ${isCompilerCollapsed ? "collapsed" : ""
              }`}
            style={{
              height: isCompilerCollapsed
                ? "30px"
                : `calc(${100 - topHeight}% - 8px)`
            }}
          >

            <div className="section-controls">
              <button
                className="toggle-btn"
                onClick={() =>
                  setIsCompilerCollapsed(
                    !isCompilerCollapsed
                  )
                }
              >
                {isCompilerCollapsed ? (
                  <Maximize2 size={14} />
                ) : (
                  <Minimize2 size={14} />
                )}
              </button>
            </div>

            {!isCompilerCollapsed ? (
              <CompilerPanel
                language={language}
                code={code}
              />
            ) : (
              <div className="collapsed-placeholder">
                Terminal / Executor
              </div>
            )}
          </div>
        </div>

        {/* =========================
            VERTICAL RESIZER
        ========================= */}

        <div
          className="resizer-vertical"
          onMouseDown={startVerticalResize}
        >
          <GripVertical size={14} />
        </div>

        {/* =========================
            RIGHT PANE
        ========================= */}

        <div
          className="right-pane"
          style={{
            width: `calc(${100 - leftWidth}% - 8px)`
          }}
        >

          {/* FLOAT CHAT BUTTON */}
          {!isChatOpen && (
            <button
              className="chat-float-btn"
              onClick={() => setIsChatOpen(true)}
            >
              💬
            </button>
          )}

          {/* FLOAT VIDEO BUTTON */}
          <button
            className={`video-float-btn ${isVideoEnabled ? "active-video" : ""
              }`}
            onClick={() =>
              setIsVideoEnabled(!isVideoEnabled)
            }
          >
            <Video size={22} />
          </button>

          {/* VIDEO GRID */}
          <VideoGrid
            isVideoEnabled={isVideoEnabled}
          />

          {/* CHAT OVERLAY */}
          <div
            className={`chat-overlay ${isChatOpen ? "open" : ""
              }`}
          >

            <div className="chat-overlay-header">
              <button
                className="chat-close-btn"
                onClick={() => setIsChatOpen(false)}
              >
                <X
                  size={20}
                  strokeWidth={2.5}
                />
              </button>
            </div>

            <ChatBox />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomPage;
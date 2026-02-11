import React, { useEffect, useRef, useState } from "react";
import { useRoom } from "../contexts/roomcontext";
import { useNavigate, useParams } from "react-router-dom";
import ChatBox from "../components/chatbox";
import CodeEditor from "../components/codeeditor";
import CompilerPanel from "../components/CompilerPanel";
import { Maximize2, Minimize2, GripVertical, GripHorizontal } from "lucide-react";
import "./roompage.css";

const RoomPage = () => {
  const { currentRoom, joinRoom, leaveRoom, code, language } = useRoom();
  const navigate = useNavigate();
  const { roomId } = useParams();

  // ============================
  // LAYOUT STATE
  // ============================
  const [leftWidth, setLeftWidth] = useState(65); // % width of Editor+Compiler area
  const [topHeight, setTopHeight] = useState(70); // % height of Editor (vs Compiler)

  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isCompilerCollapsed, setIsCompilerCollapsed] = useState(false);

  const containerRef = useRef(null);
  const leftPaneRef = useRef(null);
  const verticalSplitter = useRef(null);
  const horizontalSplitter = useRef(null);

  useEffect(() => {
    const username = sessionStorage.getItem("username");
    const passcode = sessionStorage.getItem("passcode");
    const intentionalLeave = sessionStorage.getItem("intentionalLeave");

    if (intentionalLeave === "true") {
      navigate("/");
      return;
    }

    if (!roomId || !username) {
      navigate("/");
      return;
    }

    sessionStorage.setItem("roomId", roomId);

    if (!currentRoom) {
      joinRoom(roomId, username, passcode);
    }
  }, [roomId, currentRoom, joinRoom, navigate]);

  const handleLeave = () => {
    leaveRoom();
    navigate("/");
  };

  // ============================
  // DRAG HANDLERS
  // ============================
  const startVerticalResize = (e) => {
    e.preventDefault();
    document.addEventListener("mousemove", onVerticalResize);
    document.addEventListener("mouseup", stopVerticalResize);
    document.body.style.cursor = "col-resize";
  };

  const onVerticalResize = (e) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    if (newWidth > 20 && newWidth < 80) setLeftWidth(newWidth);
  };

  const stopVerticalResize = () => {
    document.removeEventListener("mousemove", onVerticalResize);
    document.removeEventListener("mouseup", stopVerticalResize);
    document.body.style.cursor = "default";
  };

  const startHorizontalResize = (e) => {
    e.preventDefault();
    document.addEventListener("mousemove", onHorizontalResize);
    document.addEventListener("mouseup", stopHorizontalResize);
    document.body.style.cursor = "row-resize";
  };

  const onHorizontalResize = (e) => {
    if (!leftPaneRef.current) return;
    const paneRect = leftPaneRef.current.getBoundingClientRect();
    const newHeight = ((e.clientY - paneRect.top) / paneRect.height) * 100;
    if (newHeight > 20 && newHeight < 80) setTopHeight(newHeight);
  };

  const stopHorizontalResize = () => {
    document.removeEventListener("mousemove", onHorizontalResize);
    document.removeEventListener("mouseup", stopHorizontalResize);
    document.body.style.cursor = "default";
  };

  return (
    <div className="roompage">
      <header className="room-header">
        <div className="room-info">
          <span className="room-badge">LIVE</span>
          <h2>Room: <span className="room-id-text">{roomId}</span></h2>
        </div>
        <div className="room-actions">
          <button className="leave-btn-header" onClick={handleLeave}>
            Leave Room
          </button>
        </div>
      </header>

      <div className="room-layout" ref={containerRef}>

        {/* LEFT AREA: EDITOR + COMPILER */}
        <div
          className="left-pane"
          ref={leftPaneRef}
          style={{ width: isChatCollapsed ? "98%" : `${leftWidth}%` }}
        >
          {/* EDITOR SECTION */}
          <div
            className="editor-section"
            style={{ height: isCompilerCollapsed ? "96%" : `${topHeight}%` }}
          >
            <CodeEditor />
          </div>

          {/* HORIZONTAL RESIZER */}
          {!isCompilerCollapsed && (
            <div
              className="resizer-horizontal"
              onMouseDown={startHorizontalResize}
              ref={horizontalSplitter}
            >
              <GripHorizontal size={14} className="grip-icon" />
            </div>
          )}

          {/* COMPILER SECTION */}
          <div
            className={`compiler-section ${isCompilerCollapsed ? "collapsed" : ""}`}
            style={{ height: isCompilerCollapsed ? "30px" : `calc(${100 - topHeight}% - 8px)` }}
          >
            <div className="section-controls">
              <button
                className="toggle-btn"
                onClick={() => setIsCompilerCollapsed(!isCompilerCollapsed)}
                title={isCompilerCollapsed ? "Expand Executor" : "Minimize Executor"}
              >
                {isCompilerCollapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
            </div>
            {!isCompilerCollapsed ? (
              <CompilerPanel language={language} code={code} />
            ) : (
              <div className="collapsed-placeholder">
                <span>Terminal / Executor</span>
              </div>
            )}
          </div>
        </div>

        {/* VERTICAL DIVIDER */}
        <div
          className="resizer-vertical"
          onMouseDown={startVerticalResize}
          ref={verticalSplitter}
          style={{ display: isChatCollapsed ? "none" : "flex" }}
        >
          <GripVertical size={14} className="grip-icon" />
        </div>

        {/* RIGHT AREA: CHAT */}
        <div
          className={`right-pane ${isChatCollapsed ? "collapsed" : ""}`}
          style={{ width: isChatCollapsed ? "40px" : `calc(${100 - leftWidth}% - 8px)` }}
        >
          <div className="chat-header-controls">
            <button
              className="toggle-btn"
              onClick={() => setIsChatCollapsed(!isChatCollapsed)}
              title={isChatCollapsed ? "Expand Chat" : "Collapse Chat"}
            >
              {isChatCollapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
          </div>

          {!isChatCollapsed ? (
            <ChatBox />
          ) : (
            <div className="vertical-text">CHAT</div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RoomPage;

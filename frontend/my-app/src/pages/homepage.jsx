import React, { useState, useEffect, useRef } from "react";
import { useRoom } from "../contexts/roomcontext";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "../components/ThemeToggle";
import "./homepage.css";

const Homepage = () => {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const [mode, setMode] = useState("join");

  const [user, setUser] = useState(null);
  const userRef = useRef(null); // 🆕 mirrors `user` synchronously, avoids stale state right after login

  const { createRoom, joinRoom } = useRoom();
  const navigate = useNavigate();

  // 🔥 CHECK LOGIN
  useEffect(() => {
    fetch("http://localhost:5005/auth/me", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user);
        userRef.current = data.user; // 🆕 keep ref in sync

        // 🔥 AUTO FILL USERNAME (ONLY IF EMPTY)
        if (data.user && !username) {
          setUsername(data.user.username);
        }
      })
      .catch(() => {
        setUser(null);
        userRef.current = null; // 🆕
      });
  }, []);

  // 🔥 LOGOUT
  const handleLogout = async () => {
    await fetch("http://localhost:5005/auth/logout", {
      method: "GET",
      credentials: "include",
    });

    setUser(null);
    userRef.current = null; // 🆕
    setUsername("");
    window.location.reload();
  };

  // 🆕 GUEST LOGIN
  const handleGuestLogin = async () => {
    try {
      const res = await fetch("http://localhost:5005/auth/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: "Guest" }),
      });

      const data = await res.json();

      if (data.user) {
        setUser(data.user);
        userRef.current = data.user; // 🆕 fixes race condition: available immediately, no refresh needed
        setUsername(data.user.username); // pre-fill "Guest", still editable
      }
    } catch (err) {
      alert("Unable to continue as guest. Please try again.");
    }
  };

  // 🔥 SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userRef.current) {
      alert("⚠️ Please login first to continue");
      return;
    }

    if (!roomId.trim() || !username.trim()) {
      alert("Enter both Room ID and Username");
      return;
    }

    const finalRoomId = roomId.trim().toUpperCase();

    localStorage.setItem("username", username.trim());

    try {
      if (mode === "create") {
        await createRoom(finalRoomId, username.trim());
      } else {
        await joinRoom(finalRoomId, username.trim());
      }

      navigate(`/room/${finalRoomId}`);
    } catch (err) {
      alert("Unable to join room. Please try again.");
    }
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
  };

  return (
    <div className="homepage-wrapper">
      <div className="ambient-glow"></div>
      <div className="ambient-glow glow-2"></div>
      
      <nav className="cc-nav">
        <div className="nav-left">
          <div className="logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="logo-icon"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
            <span>CodeCollab</span>
          </div>
        </div>

        <div className="nav-center">
          <button 
            className="history-badge" 
            onClick={() => {
              if (!user) {
                alert("⚠️ Please login first to view history");
                return;
              }
              navigate("/my-rooms");
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            History
          </button>
        </div>

        <div className="nav-right">
          {!user && (
            <button
              type="button"
              className="guest-nav-btn"
              onClick={handleGuestLogin}
            >
              Continue as Guest
            </button>
          )}

          <ThemeToggle />

          {user ? (
            <div className="user-menu">
              <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
              <span className="nav-username">{user.username}</span>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </nav>

      <main className="main-content">
        <div className="hero-section">
          <div className="badge-pill"> Code in real-time, instantly</div>
          <h1 className="hero-title">
            Collaborate on code.<br/>
            <span className="text-gradient">Without friction.</span>
          </h1>
          <p className="hero-subtitle">
            A lightning-fast, collaborative coding environment. Create a room, share the link, and build something amazing together.
          </p>
        </div>

        <div className="form-container">
          <div className="glass-card">
            {!user ? (
              <div className="auth-section">
                <button
                  className="oauth-btn"
                  onClick={() => {
                    window.location.href = "http://localhost:5005/auth/google";
                  }}
                >
                  <img
                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                    alt="Google"
                  />
                  Continue with Google
                </button>

                {/* Guest sign-in now lives in the top nav */}

                <p className="auth-hint">Sign in to start collaborating</p>
              </div>
            ) : (
              <div className="user-greeting">
                <div className="greeting-avatar">{user.username.charAt(0).toUpperCase()}</div>
                <div>
                  <p className="greeting-text">
                    {user.provider === "guest" ? "Joined as" : "Welcome back,"}
                  </p>
                  <p className="greeting-name">{user.username}</p>
                </div>
              </div>
            )}

            <div className="divider">
              <div className="line"></div>
              <span>Workspace</span>
              <div className="line"></div>
            </div>

            <form className="join-form" onSubmit={handleSubmit}>
              <div className="mode-selector">
                <button
                  type="button"
                  className={`mode-tab ${mode === "join" ? "active" : ""}`}
                  onClick={() => setMode("join")}
                >
                  Join Room
                </button>
                <button
                  type="button"
                  className={`mode-tab ${mode === "create" ? "active" : ""}`}
                  onClick={() => setMode("create")}
                >
                  Create Room
                </button>
                <div className="tab-indicator" style={{ transform: mode === 'create' ? 'translateX(100%)' : 'translateX(0)' }}></div>
              </div>

              <div className="input-group">
                <label>Display Name</label>
                <input
                  type="text"
                  placeholder="How should others call you?"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label>Room Code</label>
                <div className="room-input-row">
                  <div className="input-with-icon">
                    <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
                    <input
                      type="text"
                      placeholder={mode === "create" ? "e.g. PRO-DEV" : "Paste room ID"}
                      value={roomId}
                      onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                      required
                    />
                  </div>
                  {mode === "create" && (
                    <button
                      type="button"
                      className="generate-btn"
                      onClick={generateRoomId}
                      title="Generate random ID"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                    </button>
                  )}
                </div>
              </div>

              <button className="primary-submit-btn" type="submit">
                {mode === "create" ? (
                  <>
                    Create Room<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </>
                ) : (
                  <>
                    Join Room <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Homepage;
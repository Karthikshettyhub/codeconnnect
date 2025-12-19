import React from "react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup, signOut } from "firebase/auth";

const Login = ({ setUser }) => {
  // Google login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
    } catch (err) {
      console.error("Login Error:", err);
      alert("Login failed! Check console for details.");
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h2>Login to CodeCollab</h2>
      <button
        style={{
          padding: "10px 20px",
          background: "#0078ff",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "600",
          marginTop: "20px",
        }}
        onClick={handleGoogleLogin}
      >
        Login with Google
      </button>

      <button
        style={{
          padding: "8px 16px",
          background: "#ff4c4c",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "600",
          marginLeft: "10px",
        }}
        onClick={handleLogout}
      >
        Logout
      </button>
    </div>
  );
};

export default Login;

<<<<<<< HEAD
// src/components/codeeditor.jsx
=======
>>>>>>> bugfix-working-version
import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import CompilerPanel from "./CompilerPanel";
import "./codeeditor.css";
<<<<<<< HEAD
import axios from "axios";
=======
>>>>>>> bugfix-working-version
import { useRoom } from "../contexts/roomcontext";
import { getStarterCode } from "../services/pistonService";

const extensions = {
  javascript: "js",
  python: "py",
  java: "java",
  cpp: "cpp",
  c: "c",
  csharp: "cs",
  go: "go",
  rust: "rs",
  typescript: "ts",
  ruby: "rb",
  php: "php",
};

<<<<<<< HEAD
const CodeEditor = ({ language: initialLang = "javascript" }) => {
  const { code, setCode, sendCode, language, sendLanguage } = useRoom();
  const [localCode, setLocalCode] = useState(code || "");

  useEffect(() => {
    if (code !== localCode) setLocalCode(code);
  }, [code]);

  useEffect(() => {
    if (!localCode.trim()) {
      const starter = getStarterCode(language || initialLang);
      setLocalCode(starter);
      setCode(starter);
      sendCode(starter);
      localStorage.setItem("currentCode", starter);
=======
const CodeEditor = () => {
  const {
    code,
    language,
    pendingLanguage,
    updateCodeRemote,
    updateLanguageRemote,
    acceptLanguageChange,
    rejectLanguageChange,
  } = useRoom();

  const [localCode, setLocalCode] = useState(code);
  const [showLangPopup, setShowLangPopup] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // =====================
  // SYNC CODE
  // =====================
  useEffect(() => {
    if (code !== localCode) {
      setLocalCode(code);
      localStorage.setItem("currentCode", code);
    }
  }, [code]);

  useEffect(() => {
    if (language) {
      localStorage.setItem("currentLanguage", language);
>>>>>>> bugfix-working-version
    }
  }, [language]);

  useEffect(() => {
    if (!pendingLanguage || pendingLanguage === language) return;
    setShowLangPopup(true);
  }, [pendingLanguage, language]);

  const handleEditorChange = (value) => {
<<<<<<< HEAD
    if (!value) return;
    setLocalCode(value);
    setCode(value);
    sendCode(value);
    localStorage.setItem("currentCode", value);
=======
    if (value == null) return;
    setLocalCode(value);
    localStorage.setItem("currentCode", value);
    updateCodeRemote(value);
>>>>>>> bugfix-working-version
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
<<<<<<< HEAD
    if (!window.confirm(`Switch to ${newLang}? Code will reset.`)) return;

    sendLanguage(newLang);
    const template = getStarterCode(newLang);
    setLocalCode(template);
    setCode(template);
    sendCode(template);
    localStorage.setItem("currentCode", template);
  };

  // ⭐ FIXED FUNCTION — NOW IT EXISTS ⭐
  const handleGenerateBoilerplate = async () => {
    console.log("🔥 Generating boilerplate...");

    try {
      const res = await axios.post("http://localhost:5005/boiler", {
        language,
        userBody: localCode,
      });

      console.log("🟩 BACKEND RESPONSE:", res.data);

      if (!res.data.ok || !res.data.output.trim()) {
        alert("LLM failed to generate boilerplate.");
        return;
      }

      const updated = res.data.output.trim();
      setLocalCode(updated);
      setCode(updated);
      sendCode(updated);
      localStorage.setItem("currentCode", updated);

    } catch (err) {
      console.error("🔥 Boilerplate ERROR:", err);
      alert("Boilerplate generation failed.");
=======
    if (newLang === language) return;

    const ok = window.confirm(
      `Changing language will replace code with ${newLang.toUpperCase()} template. Continue?`
    );
    if (!ok) return;

    updateLanguageRemote(newLang);

    const template = getStarterCode(newLang);
    setLocalCode(template);
    localStorage.setItem("currentCode", template);
    localStorage.setItem("currentLanguage", newLang);

    updateCodeRemote(template);
  };

  const acceptPopup = () => {
    acceptLanguageChange();
    setShowLangPopup(false);
    localStorage.setItem("currentLanguage", pendingLanguage);
  };

  const rejectPopup = () => {
    rejectLanguageChange();
    setShowLangPopup(false);
  };

  // =====================
  // 🔥 BOILERPLATE (ONLY PLACE WITH await)
  // =====================
  const handleGenerateBoilerplate = async () => {
    if (!localCode || isGenerating) return;

    console.log("🧠 Generate Boilerplate clicked");
    setIsGenerating(true);

    try {
      const res = await fetch("http://localhost:5005/boiler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          userBody: localCode,
        }),
      });

      if (!res.ok) throw new Error("Boilerplate API failed");

      const data = await res.json();
      console.log("📦 Boilerplate response:", data);

      if (!data.ok || !data.output) {
        throw new Error("Invalid boilerplate response");
      }

      console.log("✅ Boilerplate received");

      setLocalCode(data.output);
      localStorage.setItem("currentCode", data.output);

      // 🔥 sync to all peers
      updateCodeRemote(data.output);

    } catch (err) {
      console.error("❌ Boilerplate error:", err);
      alert("Failed to generate boilerplate");
    } finally {
      setIsGenerating(false);
>>>>>>> bugfix-working-version
    }
  };

  return (
    <div className="editor-container">
<<<<<<< HEAD
      <div className="editor-header">
        <select className="language-dropdown" value={language} onChange={handleLanguageChange}>
=======
      {showLangPopup && (
        <div className="lang-popup-overlay">
          <div className="lang-popup">
            <h3>Language Changed</h3>
            <p>
              Another user changed language to{" "}
              <b>{pendingLanguage.toUpperCase()}</b>
            </p>
            <div className="popup-actions">
              <button onClick={acceptPopup}>Switch Language</button>
              <button onClick={rejectPopup}>Keep Current</button>
            </div>
          </div>
        </div>
      )}

      <div className="editor-header">
        <select value={language} onChange={handleLanguageChange}>
>>>>>>> bugfix-working-version
          {Object.keys(extensions).map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>

<<<<<<< HEAD
        <span className="file-label">body.{extensions[language]}</span>

        {/* ⭐ FIXED BUTTON ⭐ */}
        <button
          className="boiler-btn"
          onClick={handleGenerateBoilerplate}
          style={{
            marginLeft: "10px",
            padding: "5px 10px",
            background: "#3b82f6",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Generate Boilerplate
        </button>
      </div>

      <div className="editor-wrapper">
        <Editor
          language={language}
          value={localCode}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            wordWrap: "on",
            automaticLayout: true,
          }}
        />
      </div>
=======
        <span>📄 main.{extensions[language]}</span>

        <button
          className="boilerplate-btn"
          onClick={handleGenerateBoilerplate}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Boilerplate"}
        </button>
      </div>

      <Editor
        language={language}
        value={localCode}
        theme="vs-dark"
        onChange={handleEditorChange}
        options={{ automaticLayout: true }}
      />
>>>>>>> bugfix-working-version

      <CompilerPanel language={language} />
    </div>
  );
};

export default CodeEditor;

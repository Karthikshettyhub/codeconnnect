import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import CompilerPanel from "./CompilerPanel";
import "./codeeditor.css";
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

  // 🔥 LOCAL STATES (KEY FIX)
  const [localCode, setLocalCode] = useState(code);
  const [localLanguage, setLocalLanguage] = useState(language);
  const [showLangPopup, setShowLangPopup] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // =====================
  // SYNC FROM CONTEXT → LOCAL
  // =====================
  useEffect(() => {
    if (code !== localCode) {
      setLocalCode(code);
      localStorage.setItem("currentCode", code);
    }
  }, [code]);

  useEffect(() => {
    if (language && language !== localLanguage) {
      setLocalLanguage(language);
      localStorage.setItem("currentLanguage", language);
    }
  }, [language]);

  // =====================
  // POPUP TRIGGER
  // =====================
  useEffect(() => {
    if (!pendingLanguage) return;
    setShowLangPopup(true);
  }, [pendingLanguage]);

  // =====================
  // EDITOR CHANGE
  // =====================
  const handleEditorChange = (value) => {
    if (value == null) return;
    setLocalCode(value);
    localStorage.setItem("currentCode", value);
    updateCodeRemote(value);
  };

  // =====================
  // 🔥 LANGUAGE CHANGE (FIXED)
  // =====================
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    if (newLang === localLanguage) return;

    const ok = window.confirm(
      `Changing language will replace code with ${newLang.toUpperCase()} template. Continue?`
    );
    if (!ok) return;

    // ✅ UPDATE UI FIRST (IMPORTANT)
    setLocalLanguage(newLang);

    // notify others
    updateLanguageRemote(newLang);

    const template = getStarterCode(newLang);
    setLocalCode(template);

    localStorage.setItem("currentCode", template);
    localStorage.setItem("currentLanguage", newLang);

    updateCodeRemote(template);
  };

  // =====================
  // POPUP ACTIONS
  // =====================
  const acceptPopup = () => {
    setLocalLanguage(pendingLanguage);
    acceptLanguageChange();
    setShowLangPopup(false);
  };

  const rejectPopup = () => {
    rejectLanguageChange();
    setShowLangPopup(false);
  };

  // =====================
  // BOILERPLATE
  // =====================
  const handleGenerateBoilerplate = async () => {
    if (!localCode || isGenerating) return;

    setIsGenerating(true);

    try {
      const res = await fetch("https://codeconnnect.onrender.com/boiler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: localLanguage,
          userBody: localCode,
        }),
      });

      if (!res.ok) throw new Error("Boilerplate API failed");

      const data = await res.json();
      if (!data.ok || !data.output) {
        throw new Error("Invalid boilerplate response");
      }

      setLocalCode(data.output);
      localStorage.setItem("currentCode", data.output);
      updateCodeRemote(data.output);
    } catch (err) {
      console.error("❌ Boilerplate error:", err);
      alert("Failed to generate boilerplate");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="editor-container">
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
        <select value={localLanguage} onChange={handleLanguageChange}>
          {Object.keys(extensions).map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>

        <span>📄 main.{extensions[localLanguage]}</span>

        <button
          className="boilerplate-btn"
          onClick={handleGenerateBoilerplate}
          disabled={isGenerating}
        >
          {isGenerating ? "Generating..." : "Generate Boilerplate"}
        </button>
      </div>

      <Editor
        language={localLanguage}
        value={localCode}
        theme="vs-dark"
        onChange={handleEditorChange}
        options={{ automaticLayout: true }}
      />

      <CompilerPanel language={localLanguage} code={localCode} />

    </div>
  );
};

export default CodeEditor;

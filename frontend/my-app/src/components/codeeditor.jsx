import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "./codeeditor.css";
import { useRoom } from "../contexts/roomcontext";
import { getStarterCode } from "../services/pistonService";

const EXTENSIONS = {
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

  const [localCode, setLocalCode] = useState(code);
  const [localLanguage, setLocalLanguage] = useState(language);
  const [showLangPopup, setShowLangPopup] = useState(false);

  // Sync context → local
  useEffect(() => {
    if (code !== localCode) {
      setLocalCode(code);
    }
  }, [code]);

  useEffect(() => {
    if (language && language !== localLanguage) {
      setLocalLanguage(language);
    }
  }, [language]);

  // Popup trigger
  useEffect(() => {
    if (pendingLanguage) setShowLangPopup(true);
  }, [pendingLanguage]);

  const handleEditorChange = (value) => {
    if (value == null) return;
    setLocalCode(value);
    updateCodeRemote(value);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    if (newLang === localLanguage) return;

    const ok = window.confirm(
      `Changing language will replace code with ${newLang.toUpperCase()} template. Continue?`
    );
    if (!ok) return;

    setLocalLanguage(newLang);
    updateLanguageRemote(newLang);

    const template = getStarterCode(newLang);
    setLocalCode(template);
    updateCodeRemote(template);
  };

  const acceptPopup = () => {
    setLocalLanguage(pendingLanguage);
    acceptLanguageChange();
    setShowLangPopup(false);
  };

  const rejectPopup = () => {
    rejectLanguageChange();
    setShowLangPopup(false);
  };

  return (
    <div className="editor-container">
      {showLangPopup && (
        <div className="lang-popup-overlay">
          <div className="lang-popup">
            <h3>Language Changed</h3>
            <p>
              Another user changed language to{" "}
              <b>{pendingLanguage?.toUpperCase()}</b>
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
          {Object.keys(EXTENSIONS).map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>
        <span className="file-label">main.{EXTENSIONS[localLanguage]}</span>
      </div>

      <Editor
        language={localLanguage}
        value={localCode}
        theme="vs-dark"
        onChange={handleEditorChange}
        options={{ automaticLayout: true, minimap: { enabled: false } }}
      />
    </div>
  );
};

export default CodeEditor;

// src/components/codeeditor.jsx
import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import CompilerPanel from "./CompilerPanel";
import "./codeeditor.css";
import axios from "axios";
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
    }
  }, []);

  const handleEditorChange = (value) => {
    if (!value) return;
    setLocalCode(value);
    setCode(value);
    sendCode(value);
    localStorage.setItem("currentCode", value);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
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
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <select className="language-dropdown" value={language} onChange={handleLanguageChange}>
          {Object.keys(extensions).map((lang) => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>

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

      <CompilerPanel language={language} />
    </div>
  );
};

export default CodeEditor;

// frontend/src/components/CodeEditor.jsx
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

const CodeEditor = ({ language: initialLang = "javascript" }) => {
  const {
    code,
    setCode,
    sendCode,
    language,      // from context
    sendLanguage,  // from context
  } = useRoom();

  const [localCode, setLocalCode] = useState(code || "");

  // Sync local editor when room code changes
  useEffect(() => {
    if (code !== localCode) {
      setLocalCode(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Initialize starter code only once
  useEffect(() => {
    if (!localCode || localCode.trim() === "") {
      const starter = getStarterCode(language || initialLang);
      setLocalCode(starter);
      setCode(starter);
      sendCode(starter);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEditorChange = (value) => {
    if (value == null) return;
    setLocalCode(value);
    setCode(value);
    sendCode(value);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;

    const confirmed = window.confirm(
      `Changing to ${newLang.toUpperCase()} will reset code. Continue?`
    );
    if (!confirmed) return;

    // Update language in context & broadcast
    sendLanguage(newLang);

    const template = getStarterCode(newLang);
    setLocalCode(template);
    setCode(template);
    sendCode(template);
  };

  return (
    <div className="editor-container">
      <div className="editor-header">
        <select
          className="language-dropdown"
          value={language}               // 🔥 bound to context
          onChange={handleLanguageChange}
        >
          {Object.keys(extensions).map((lang) => (
            <option key={lang} value={lang}>
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>

        <span className="file-label">📄 main.{extensions[language] || "js"}</span>
      </div>

      <div className="editor-wrapper">
        <Editor
          language={language || "javascript"}
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

      <CompilerPanel language={language || "javascript"} />
    </div>
  );
};

export default CodeEditor;

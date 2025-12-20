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
      }
    }, [language]);

    useEffect(() => {
      if (!pendingLanguage || pendingLanguage === language) return;
      setShowLangPopup(true);
    }, [pendingLanguage, language]);

    const handleEditorChange = (value) => {
      if (value == null) return;
      setLocalCode(value);
      localStorage.setItem("currentCode", value);
      updateCodeRemote(value);
    };

    const handleLanguageChange = (e) => {
      const newLang = e.target.value;
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
          <select value={language} onChange={handleLanguageChange}>
            {Object.keys(extensions).map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>

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

        <CompilerPanel language={language} />
      </div>
    );
  };

  export default CodeEditor;

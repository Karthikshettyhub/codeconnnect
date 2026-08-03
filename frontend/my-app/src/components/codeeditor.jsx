import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import "./codeeditor.css";
import { useRoom } from "../contexts/roomcontext";
import { useTheme } from "../contexts/ThemeContext";

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

const STARTER_CODE = {
  javascript: `// JavaScript\nconsole.log("Hello, World!");`,
  python: `# Python\nprint("Hello, World!")`,
  java: `// Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`,
  cpp: `// C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}`,
  c: `// C\n#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}`,
  csharp: `// C#\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}`,
  go: `// Go\npackage main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}`,
  rust: `// Rust\nfn main() {\n    println!("Hello, World!");\n}`,
  typescript: `// TypeScript\nconst message: string = "Hello, World!";\nconsole.log(message);`,
  ruby: `# Ruby\nputs "Hello, World!"`,
  php: `<?php\necho "Hello, World!";\n?>`,
};

const CodeEditor = () => {
  const {
    code,
    language,
    pendingLanguage,
    updateCodeRemote,
    updateCodeLocal,
    updateLanguageRemote,
    updateLanguageLocal,
    acceptLanguageChange,
    rejectLanguageChange,
  } = useRoom();

  const { theme } = useTheme();
  const monacoTheme = theme === "light" ? "light" : "vs-dark";

  const [localCode, setLocalCode] = useState(code);
  const [localLanguage, setLocalLanguage] = useState(language);
  const [showLangPopup, setShowLangPopup] = useState(false);

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

  useEffect(() => {
    if (pendingLanguage) setShowLangPopup(true);
  }, [pendingLanguage]);

  const handleEditorChange = (value) => {
    if (value == null) return;
    setLocalCode(value);
    updateCodeLocal(value);
    updateCodeRemote(value);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    if (newLang === localLanguage) return;

    const ok = window.confirm(
      `Changing language will replace code with ${newLang.toUpperCase()} template. Continue?`
    );
    if (!ok) return;

    const template = STARTER_CODE[newLang] || "";

    setLocalLanguage(newLang);
    updateLanguageLocal(newLang);
    updateLanguageRemote(newLang);

    setLocalCode(template);
    updateCodeLocal(template);
    updateCodeRemote(template);
  };

  const acceptPopup = () => {
    const template = STARTER_CODE[pendingLanguage] || "";
    setLocalLanguage(pendingLanguage);
    setLocalCode(template);
    updateCodeLocal(template);
    updateCodeRemote(template);
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
        theme={monacoTheme}
        onChange={handleEditorChange}
        options={{ automaticLayout: true, minimap: { enabled: false } }}
      />
    </div>
  );
};

export default CodeEditor;
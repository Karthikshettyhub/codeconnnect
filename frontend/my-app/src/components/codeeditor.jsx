// src/components/CodeEditor.jsx
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import CompilerPanel from './CompilerPanel';
import './codeeditor.css';
import { useRoom } from "../contexts/roomcontext";
import { getStarterCode } from '../services/judge0Service';

const extensions = {
  javascript: 'js',
  python: 'py',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  csharp: 'cs',
  go: 'go',
  rust: 'rs',
  typescript: 'ts',
  ruby: 'rb',
  php: 'php'
};

const CodeEditor = ({ language: initialLang = 'javascript' }) => {
  const [language, setLanguage] = useState(initialLang);
  const { code, sendCode } = useRoom();
  const [localCode, setLocalCode] = useState(code);

  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  const handleEditorChange = (value) => {
    setLocalCode(value);
    sendCode(value);
    localStorage.setItem('currentCode', value);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;

    setLanguage(newLang);
    localStorage.setItem("currentLanguage", newLang);

    const template = getStarterCode(newLang);
    setLocalCode(template);
    sendCode(template);
  };

  return (
    <div className="editor-container">

      {/* Header */}
      <div className="editor-header">
        <select
          className="language-dropdown"
          value={language}
          onChange={handleLanguageChange}
        >
          {Object.keys(extensions).map((lang) => (
            <option key={lang} value={lang}>
              {lang.toUpperCase()}
            </option>
          ))}
        </select>

        <span className="file-label">
          main.{extensions[language]}
        </span>
      </div>

      {/* Monaco Editor */}
      <div className="editor-wrapper">
        <Editor
          language={language}
          value={localCode}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            automaticLayout: true,
            wordWrap: 'on',
          }}
        />
      </div>

      {/* Output / Run Panel */}
      <CompilerPanel />

    </div>
  );
};

export default CodeEditor;

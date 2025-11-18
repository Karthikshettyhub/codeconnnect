// src/components/CodeEditor.jsx
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import CompilerPanel from './CompilerPanel';
import './codeeditor.css';
import { useRoom } from "../contexts/roomcontext";
import { getStarterCode } from '../services/pistonService';

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

  // Sync with room code changes
  useEffect(() => {
    if (code !== localCode) {
      setLocalCode(code);
    }
  }, [code]);

  // Initialize with starter code if empty
  useEffect(() => {
    if (!localCode || localCode.trim() === '') {
      const template = getStarterCode(language);
      setLocalCode(template);
      sendCode(template);
      localStorage.setItem('currentCode', template);
      localStorage.setItem('currentLanguage', language);
    }
  }, []);

  // Handle editor changes with debouncing
  const handleEditorChange = (value) => {
    if (value === undefined || value === null) return;
    
    setLocalCode(value);
    sendCode(value);
    localStorage.setItem('currentCode', value);
  };

  // Handle language change
  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    
    // Confirm if there's existing code
    if (localCode && localCode.trim() !== '' && localCode !== getStarterCode(language)) {
      const confirmed = window.confirm(
        `Changing language will replace your current code with a ${newLang.toUpperCase()} template. Continue?`
      );
      
      if (!confirmed) {
        return;
      }
    }
    
    setLanguage(newLang);
    localStorage.setItem("currentLanguage", newLang);
    
    const template = getStarterCode(newLang);
    setLocalCode(template);
    sendCode(template);
    localStorage.setItem('currentCode', template);
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
              {lang.charAt(0).toUpperCase() + lang.slice(1)}
            </option>
          ))}
        </select>
        <span className="file-label">
          📄 main.{extensions[language]}
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
            scrollBeyondLastLine: false,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true,
          }}
        />
      </div>

      {/* Output / Run Panel */}
      <CompilerPanel language={language} />
    </div>
  );
};

export default CodeEditor;
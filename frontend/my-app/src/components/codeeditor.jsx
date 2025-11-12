import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';  // ✅ Import Monaco
import './codeeditor.css';
import { useRoom } from "../contexts/roomcontext";


const CodeEditor = ({ language = 'javascript' }) => {

  const [lineCount, setLineCount] = useState(1);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const { code, sendCode } = useRoom(); // ✅ get shared code + sendCode
  const [localCode, setLocalCode] = useState(code);


  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  const handleEditorChange = (value) => {
    setLocalCode(value);
    sendCode(value);
  };

  const handleCursorMove = (e) => {
    const { lineNumber, column } = e.position;
    setCursorPosition({ line: lineNumber, column });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    alert('Code copied to clipboard!');
  };

  const handleDownload = () => {
    const extensions = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      go: 'go',
      rust: 'rs',
      typescript: 'ts'
    };

    const ext = extensions[language] || 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLanguageIcon = () => {
    const icons = {
      javascript: '🟨',
      python: '🐍',
      java: '☕',
      cpp: '⚙️',
      go: '🔵',
      rust: '🦀',
      typescript: '🔷'
    };
    return icons[language] || '📄';
  };

  const getFileExtension = () => {
    const extensions = {
      javascript: 'js',
      python: 'py',
      java: 'java',
      cpp: 'cpp',
      go: 'go',
      rust: 'rs',
      typescript: 'ts'
    };
    return extensions[language] || 'txt';
  };

  return (
    <div className="code-editor-container">
      <div className="code-editor-header">
        <div className="editor-tab active">
          <span>{getLanguageIcon()}</span>
          <span>main.{getFileExtension()}</span>
          <span className="tab-close">×</span>
        </div>
      </div>

      <div className="editor-actions">
        <button className="editor-action-btn" onClick={handleCopy}>📋 Copy</button>
        <button className="editor-action-btn" onClick={handleDownload}>💾 Download</button>
      </div>

      <div className="code-editor-wrapper">
        {/* ✅ Monaco Editor */}
        <Editor
          height="400px"
          language={language}
          value={localCode}
          onChange={handleEditorChange}
          onCursorPositionChange={handleCursorMove}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
          }}
        />

      </div>

      <div className="code-editor-footer">
        <div className="editor-status">
          <span>✓ Saved</span>
          <div className="cursor-indicator">
            <span className="cursor-dot" style={{ backgroundColor: '#5865f2' }}></span>
            <span>You are editing</span>
          </div>
        </div>

        <div className="editor-info">
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          <span>{language.toUpperCase()}</span>
          <span>UTF-8</span>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;

import React, { useState, useRef, useEffect } from 'react';
import './codeeditor.css';

const CodeEditor = ({ language = 'javascript' }) => {  // ✅ Added default value
  const [code, setCode] = useState('// Start coding here...\n');
  const [lineCount, setLineCount] = useState(1);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const textareaRef = useRef(null);

  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
  }, [code]);

  const handleCodeChange = (e) => {
    setCode(e.target.value);
  };

  const handleCursorChange = (e) => {
    const textarea = e.target;
    const textBeforeCursor = textarea.value.substring(0, textarea.selectionStart);
    const lines = textBeforeCursor.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    setCursorPosition({ line, column });
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
        <button className="editor-action-btn" onClick={handleCopy}>
          📋 Copy
        </button>
        <button className="editor-action-btn" onClick={handleDownload}>
          💾 Download
        </button>
      </div>

      <div className="code-editor-wrapper">
        <div className="line-numbers">
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          className="code-editor editor-with-numbers"
          value={code}
          onChange={handleCodeChange}
          onKeyUp={handleCursorChange}
          onClick={handleCursorChange}
          spellCheck="false"
          placeholder="Start typing your code..."
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
import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './codeeditor.css';
import { useRoom } from "../contexts/roomcontext";

const CodeEditor = ({ language: initialLang = 'javascript' }) => {
  const [language, setLanguage] = useState(initialLang);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const { code, sendCode } = useRoom();
  const [localCode, setLocalCode] = useState(code);
  const [output, setOutput] = useState('');
  const [editorHeight, setEditorHeight] = useState(70); // ⬆️ Editor taller by default

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
    const ext = getFileExtension();
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLanguageChange = (e) => setLanguage(e.target.value);

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

  const handleRunCode = () => {
    setOutput(`> Running ${getFileExtension()} code...\n\n${localCode.slice(0, 200)}...`);
  };

  return (
    <div className="code-editor-container">
      {/* === Header === */}
      <div className="code-editor-header">
        <div className="editor-tab active">
          <span>{getLanguageIcon()}</span>
          <span>main.{getFileExtension()}</span>
          <span className="tab-close">×</span>
        </div>

        <select
          className="language-dropdown"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="typescript">TypeScript</option>
        </select>
      </div>

      {/* === Actions === */}
      <div className="editor-actions">
        <button className="editor-action-btn" onClick={handleCopy}>📋 Copy</button>
        <button className="editor-action-btn" onClick={handleDownload}>💾 Download</button>
        <button className="editor-action-btn run-btn" onClick={handleRunCode}>▶ Run</button>
      </div>

      {/* === Code Editor === */}
      <div className="code-editor-wrapper" style={{ height: `${editorHeight}%` }}>
        <Editor
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

      {/* === Output / Terminal Section === */}
      <div className="output-section">
        <div className="output-header">
          <span>🖥 Output</span>
          <button
            className="resize-btn"
            onClick={() => setEditorHeight((prev) => (prev === 70 ? 55 : 70))}
          >
            {editorHeight === 70 ? '🔽 Expand Output' : '🔼 Expand Editor'}
          </button>
        </div>
        <pre className="output-content">{output || 'Click ▶ Run to see output here...'}</pre>
      </div>

      {/* === Footer === */}
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

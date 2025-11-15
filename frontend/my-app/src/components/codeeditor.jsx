import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './codeeditor.css';
import { useRoom } from "../contexts/roomcontext";

const CodeEditor = () => {
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const { code, sendCode } = useRoom();
  const [localCode, setLocalCode] = useState(code);
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState('javascript'); // 👈 dropdown language state

  // 🔄 Sync code from context
  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  // 📄 language to extension mapping
  const extensions = {
    javascript: 'js',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
    go: 'go',
    rust: 'rs',
    typescript: 'ts',
  };

  // 🧠 When code changes
  const handleEditorChange = (value) => {
    setLocalCode(value);
    sendCode(value);
  };

  // 📋 Copy button
  const handleCopy = () => {
    navigator.clipboard.writeText(localCode);
    alert('✅ Code copied to clipboard!');
  };

  // 💾 Download button
  const handleDownload = () => {
    const ext = extensions[language] || 'txt';
    const blob = new Blob([localCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ▶️ Run code (JS only)
  const handleRunCode = () => {
    try {
      if (language === 'javascript') {
        let capturedOutput = '';

        const originalLog = console.log;
        console.log = (...args) => {
          capturedOutput += args.join(' ') + '\n';
          originalLog(...args);
        };

        const result = eval(localCode);
        console.log = originalLog;

        if (capturedOutput.trim() !== '') {
          setOutput(capturedOutput.trim());
        } else if (result !== undefined) {
          setOutput(String(result));
        } else {
          setOutput('✅ Code executed successfully (no output)');
        }
      } else {
        setOutput(`⚠️ Execution for ${language} not supported yet.`);
      }
    } catch (error) {
      setOutput(`❌ Error: ${error.message}`);
    }
  };

  // 🎨 Language icons
  const getLanguageIcon = () => {
    const icons = {
      javascript: '🟨',
      python: '🐍',
      java: '☕',
      cpp: '⚙️',
      go: '🔵',
      rust: '🦀',
      typescript: '🔷',
    };
    return icons[language] || '📄';
  };

  return (
    <div className="code-editor-container">
      {/* ---------- HEADER ---------- */}
      <div className="code-editor-header">
        <div className="editor-tab active">
          <span>{getLanguageIcon()}</span>

          {/* 🧩 DROPDOWN LANGUAGE SELECTOR */}
          <select
            className="language-dropdown"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="javascript">JavaScript (.js)</option>
            <option value="python">Python (.py)</option>
            <option value="java">Java (.java)</option>
            <option value="cpp">C++ (.cpp)</option>
            <option value="go">Go (.go)</option>
            <option value="rust">Rust (.rs)</option>
            <option value="typescript">TypeScript (.ts)</option>
          </select>

          {/* dynamically updates filename */}
          <span className="file-name">main.{extensions[language]}</span>

          <span className="tab-close">×</span>
        </div>
      </div>

      {/* ---------- EDITOR SECTION ---------- */}
      <div className="code-editor-wrapper">
        <div className="editor-actions">
          <button className="editor-action-btn" onClick={handleCopy}>📋 Copy</button>
          <button className="editor-action-btn" onClick={handleDownload}>💾 Download</button>
          <button className="editor-action-btn run-btn" onClick={handleRunCode}>▶️ Run</button>
        </div>

        <Editor
          height="400px"
          language={language}
          value={localCode}
          onChange={handleEditorChange}
          onMount={(editor) => {
            editor.onDidChangeCursorPosition((e) => {
              setCursorPosition({
                line: e.position.lineNumber,
                column: e.position.column
              });
            });
          }}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            automaticLayout: true,
          }}
        />
      </div>

      {/* ---------- OUTPUT SECTION ---------- */}
      <div className="output-section">
        <div className="output-header">🖥️ Output</div>
        <pre className="output-box">
          {output || 'Click ▶️ Run to see output here...'}
        </pre>
      </div>

      {/* ---------- FOOTER ---------- */}
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

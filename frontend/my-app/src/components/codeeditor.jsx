import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import './codeeditor.css';
import { useRoom } from "../contexts/roomcontext";
import { executeCode, getStarterCode } from '../services/judge0Service';

const CodeEditor = ({ language: initialLang = 'javascript' }) => {
  const [language, setLanguage] = useState(initialLang);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const { code, sendCode } = useRoom();
  const [localCode, setLocalCode] = useState(code);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [input, setInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [memory, setMemory] = useState(0);
  const [status, setStatus] = useState('');
  const [editorHeight, setEditorHeight] = useState(70);
  const [activeOutputTab, setActiveOutputTab] = useState('output'); // 'output' or 'input'

  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  // Store code and language for CompilerPanel (if using localStorage approach)
  useEffect(() => {
    if (localCode) {
      localStorage.setItem('currentCode', localCode);
    }
  }, [localCode]);

  useEffect(() => {
    if (language) {
      localStorage.setItem('currentLanguage', language);
    }
  }, [language]);

  const handleEditorChange = (value) => {
    setLocalCode(value);
    sendCode(value);
  };

  const handleCursorMove = (e) => {
    const { lineNumber, column } = e.position;
    setCursorPosition({ line: lineNumber, column });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(localCode);
    alert('Code copied to clipboard!');
  };

  const handleDownload = () => {
    const ext = getFileExtension();
    const blob = new Blob([localCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `main.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    if (localCode.trim() && localCode !== getStarterCode(language)) {
      if (window.confirm('Change language? This will replace your code with a template.')) {
        setLanguage(newLang);
        const template = getStarterCode(newLang);
        setLocalCode(template);
        sendCode(template);
        setOutput('');
        setError('');
      }
    } else {
      setLanguage(newLang);
      const template = getStarterCode(newLang);
      setLocalCode(template);
      sendCode(template);
    }
  };

  const getLanguageIcon = () => {
    const icons = {
      javascript: '🟨',
      python: '🐍',
      java: '☕',
      cpp: '⚙️',
      c: '📝',
      csharp: '🔷',
      go: '🔵',
      rust: '🦀',
      typescript: '🔷',
      ruby: '💎',
      php: '🐘'
    };
    return icons[language] || '📄';
  };

  const getFileExtension = () => {
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
    return extensions[language] || 'txt';
  };

  const handleRunCode = async () => {
    if (!localCode.trim()) {
      setError('Please write some code first!');
      setOutput('');
      return;
    }

    setIsRunning(true);
    setOutput('🚀 Submitting code to Judge0...');
    setError('');
    setStatus('Running...');
    setExecutionTime(0);
    setMemory(0);
    setActiveOutputTab('output');

    try {
      console.log('🚀 Executing code...');
      const result = await executeCode(localCode, language, input);
      
      console.log('📊 Result:', result);

      setStatus(result.status);
      setExecutionTime(result.executionTime);
      setMemory(result.memory);

      if (result.success) {
        setOutput(result.output || '✅ Program executed successfully (no output)');
        if (result.error) {
          setError('⚠️ Warnings:\n' + result.error);
        } else {
          setError('');
        }
      } else {
        setOutput('');
        setError(result.error || '❌ Execution failed');
      }
    } catch (err) {
      console.error('❌ Execution error:', err);
      setError(err.message || '❌ An unexpected error occurred');
      setOutput('');
      setStatus('Error');
    } finally {
      setIsRunning(false);
    }
  };

  const handleClearOutput = () => {
    setOutput('');
    setError('');
    setStatus('');
    setExecutionTime(0);
    setMemory(0);
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
          <option value="c">C</option>
          <option value="csharp">C#</option>
          <option value="go">Go</option>
          <option value="rust">Rust</option>
          <option value="typescript">TypeScript</option>
          <option value="ruby">Ruby</option>
          <option value="php">PHP</option>
        </select>
      </div>

      {/* === Actions === */}
      <div className="editor-actions">
        <button className="editor-action-btn" onClick={handleCopy}>
          📋 Copy
        </button>
        <button className="editor-action-btn" onClick={handleDownload}>
          💾 Download
        </button>
        
        {/* Execution Stats */}
        {executionTime > 0 && (
          <div className="execution-stats">
            <span className="stat-badge">⚡ {executionTime.toFixed(3)}s</span>
            <span className="stat-badge">💾 {(memory / 1024).toFixed(2)}MB</span>
          </div>
        )}

        {/* Status Badge */}
        {status && (
          <span className={`status-badge ${status.includes('Accepted') ? 'success' : 'error'}`}>
            {status}
          </span>
        )}

        {/* Run Button */}
        <button 
          className={`editor-action-btn run-btn ${isRunning ? 'running' : ''}`}
          onClick={handleRunCode}
          disabled={isRunning}
        >
          {isRunning ? '⏳ Running...' : '▶ Run Code'}
        </button>

        {/* Clear Button */}
        {(output || error) && (
          <button className="editor-action-btn clear-btn" onClick={handleClearOutput}>
            🗑️ Clear
          </button>
        )}
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
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
          }}
        />
      </div>

      {/* === Output / Terminal Section === */}
      <div className="output-section">
        <div className="output-header">
          {/* Tabs */}
          <div className="output-tabs">
            <button 
              className={`output-tab ${activeOutputTab === 'output' ? 'active' : ''}`}
              onClick={() => setActiveOutputTab('output')}
            >
              🖥 Output
            </button>
            <button 
              className={`output-tab ${activeOutputTab === 'input' ? 'active' : ''}`}
              onClick={() => setActiveOutputTab('input')}
            >
              📝 Input (stdin)
            </button>
          </div>

          {/* Resize Button */}
          <button
            className="resize-btn"
            onClick={() => setEditorHeight((prev) => (prev === 70 ? 55 : 70))}
          >
            {editorHeight === 70 ? '🔽 Expand Output' : '🔼 Expand Editor'}
          </button>
        </div>

        {/* Output Content */}
        {activeOutputTab === 'output' ? (
          <div className="output-content-wrapper">
            {output && (
              <div className="output-block success">
                <div className="output-label">✅ Output:</div>
                <pre className="output-content">{output}</pre>
              </div>
            )}
            
            {error && (
              <div className="output-block error">
                <div className="output-label">❌ Error:</div>
                <pre className="output-content error-text">{error}</pre>
              </div>
            )}
            
            {!output && !error && !isRunning && (
              <pre className="output-content placeholder">
                Click ▶ Run Code to execute your program...
              </pre>
            )}

            {isRunning && (
              <pre className="output-content">
                ⏳ Running your code, please wait...
              </pre>
            )}
          </div>
        ) : (
          <div className="input-section">
            <textarea
              className="input-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input for your program (one value per line)&#10;&#10;Example:&#10;5&#10;Hello World&#10;John"
            />
          </div>
        )}
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
// src/components/CompilerPanel.jsx
import React, { useState } from 'react';
import { Play, Loader, Terminal } from 'lucide-react';
import { executeCode } from '../services/judge0Service';
import './CompilerPanel.css';

const CompilerPanel = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [memory, setMemory] = useState(0);
  const [status, setStatus] = useState('');

  // Load code + language from localStorage
  const getCodeAndLanguage = () => {
    return {
      code: localStorage.getItem('currentCode') || '',
      language: localStorage.getItem('currentLanguage') || 'javascript'
    };
  };

  const runCode = async () => {
    const { code, language } = getCodeAndLanguage();

    if (!code.trim()) {
      setOutput('Please write code before running.');
      return;
    }

    setIsRunning(true);
    setOutput('Running your code...');
    setError('');

    try {
      const result = await executeCode(code, language, input);

      if (!result) {
        setError("No response from Judge0 API");
        return;
      }

      setStatus(result.status || "Unknown");
      setExecutionTime(result.executionTime || 0);
      setMemory(result.memory || 0);

      if (result.success) {
        setOutput(result.output || "No output");
        if (result.error) setError(result.error);
      } else {
        setError(result.error || "Execution failed");
      }

    } catch (err) {
      setError("Error: " + err.message);

    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="compiler-panel">

      {/* HEADER */}
      <div className="compiler-header">
        <div className="left">
          <Terminal size={16} />
          <span>Output Panel</span>
        </div>

        <button className="run-btn" onClick={runCode} disabled={isRunning}>
          {isRunning ? <Loader size={14} className="spin" /> : <Play size={14} />}
          {isRunning ? "Running..." : "Run Code"}
        </button>
      </div>

      {/* BODY (OUTPUT + ERROR + INPUT) */}
      <div className="compiler-body">

        {/* OUTPUT */}
        <pre className="output-box">{output}</pre>

        {/* ERROR IF AVAILABLE */}
        {error && <pre className="error-box">{error}</pre>}

        {/* INPUT TEXTAREA */}
        <textarea
          className="input-box"
          placeholder="Enter program input (stdin)..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        ></textarea>

      </div>

    </div>
  );
};

export default CompilerPanel;

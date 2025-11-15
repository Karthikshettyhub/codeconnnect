// src/components/CompilerPanel.jsx
import React, { useState } from 'react';
import { 
  Play, Square, Loader2, Terminal, AlertCircle, 
  CheckCircle, Clock, Database 
} from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('output'); // 'output' or 'input'

  // Get code and language from localStorage or context
  // You'll need to adapt this based on how your CodeEditor stores code
  const getCodeAndLanguage = () => {
    // Example: If your CodeEditor stores in localStorage
    const code = localStorage.getItem('currentCode') || '';
    const language = localStorage.getItem('currentLanguage') || 'javascript';
    return { code, language };
  };

  const handleRunCode = async () => {
    const { code, language } = getCodeAndLanguage();

    if (!code.trim()) {
      setError('Please write some code first!');
      return;
    }

    setIsRunning(true);
    setOutput('Submitting code to Judge0...');
    setError('');
    setStatus('Running...');
    setExecutionTime(0);
    setMemory(0);

    try {
      console.log('🚀 Executing code...');
      const result = await executeCode(code, language, input);
      
      console.log('📊 Result:', result);

      setStatus(result.status);
      setExecutionTime(result.executionTime);
      setMemory(result.memory);

      if (result.success) {
        setOutput(result.output || 'Program executed successfully (no output)');
        if (result.error) {
          setError('⚠️ Warnings:\n' + result.error);
        }
      } else {
        setOutput('');
        setError(result.error || 'Execution failed');
      }
    } catch (err) {
      console.error('❌ Execution error:', err);
      setError(err.message || 'An unexpected error occurred');
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
    <div className="compiler-panel">
      {/* Compiler Header */}
      <div className="compiler-header">
        <div className="compiler-title">
          <Terminal size={16} />
          <span>Code Executor</span>
        </div>
        
        <div className="compiler-actions">
          {/* Stats */}
          {executionTime > 0 && (
            <div className="execution-stats">
              <span className="stat-item">
                <Clock size={14} />
                {executionTime.toFixed(3)}s
              </span>
              <span className="stat-item">
                <Database size={14} />
                {(memory / 1024).toFixed(2)}MB
              </span>
            </div>
          )}

          {/* Status Badge */}
          {status && (
            <span className={`status-badge ${status.includes('Accepted') ? 'success' : 'error'}`}>
              {status}
            </span>
          )}

          {/* Run Button */}
          {isRunning ? (
            <button className="btn-compiler running" disabled>
              <Loader2 size={14} className="spinning" />
              Running...
            </button>
          ) : (
            <button className="btn-compiler run" onClick={handleRunCode}>
              <Play size={14} />
              Run Code
            </button>
          )}

          {/* Clear Button */}
          <button className="btn-compiler clear" onClick={handleClearOutput}>
            Clear
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="compiler-tabs">
        <button
          className={`tab ${activeTab === 'output' ? 'active' : ''}`}
          onClick={() => setActiveTab('output')}
        >
          <Terminal size={14} />
          Output
        </button>
        <button
          className={`tab ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          Input (stdin)
        </button>
      </div>

      {/* Content */}
      <div className="compiler-content">
        {activeTab === 'output' ? (
          <div className="output-section">
            {output && (
              <div className="output-block success">
                <div className="output-header">
                  <CheckCircle size={14} />
                  <span>Output:</span>
                </div>
                <pre className="output-text">{output}</pre>
              </div>
            )}
            
            {error && (
              <div className="output-block error">
                <div className="output-header">
                  <AlertCircle size={14} />
                  <span>Error:</span>
                </div>
                <pre className="output-text">{error}</pre>
              </div>
            )}
            
            {!isRunning && !output && !error && (
              <div className="output-empty">
                Click "Run Code" to execute your program
              </div>
            )}
          </div>
        ) : (
          <div className="input-section">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input for your program (one value per line)&#10;Example:&#10;5&#10;10&#10;Hello World"
              className="input-textarea"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CompilerPanel;
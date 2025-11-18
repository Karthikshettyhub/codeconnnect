// src/components/CompilerPanel.jsx
import React, { useState } from 'react';
import { Play, Loader2, Terminal, AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';
import { executeCode, validateCode } from '../services/pistonService';
import './CompilerPanel.css';

const CompilerPanel = ({ language }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [executionTime, setExecutionTime] = useState(0);
  const [memory, setMemory] = useState(0);
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState('output');

  // Get code from localStorage
  const getCode = () => {
    return localStorage.getItem('currentCode') || '';
  };

  // Get language from localStorage or prop
  const getLanguage = () => {
    return language || localStorage.getItem('currentLanguage') || 'javascript';
  };

  const handleRunCode = async () => {
    const code = getCode();
    const lang = getLanguage();

    // Validate code
    const validation = validateCode(code, lang);
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      setOutput('');
      setStatus('Validation Error');
      return;
    }

    setIsRunning(true);
    setOutput('🚀 Compiling and running your code...');
    setError('');
    setStatus('Running');
    setExecutionTime(0);
    setMemory(0);
    setActiveTab('output');

    try {
      console.log('🚀 Executing code...');
      console.log('Language:', lang);
      console.log('Code length:', code.length);

      const startTime = Date.now();
      const result = await executeCode(code, lang, input);
      const endTime = Date.now();
      
      console.log('📊 Result:', result);

      setStatus(result.status || 'Completed');
      setExecutionTime(result.executionTime || (endTime - startTime) / 1000);
      setMemory(result.memory || 0);

      if (result.success) {
        setOutput(result.output || '✅ Program executed successfully (no output)');
        if (result.error && result.error.trim()) {
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
      setError(`❌ Error: ${err.message || 'An unexpected error occurred'}`);
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

  const handleClearInput = () => {
    setInput('');
  };

  return (
    <div className="compiler-panel">
      {/* Header */}
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
              {memory > 0 && (
                <span className="stat-item">
                  <Database size={14} />
                  {(memory / 1024).toFixed(2)}MB
                </span>
              )}
            </div>
          )}

          {/* Status Badge */}
          {status && (
            <span className={`status-badge ${
              status === 'Accepted' || status === 'Completed' ? 'success' : 
              status === 'Running' ? 'running' : 'error'
            }`}>
              {status}
            </span>
          )}

          {/* Run Button */}
          <button 
            className={`btn-compiler ${isRunning ? 'running' : 'run'}`}
            onClick={handleRunCode}
            disabled={isRunning}
          >
            {isRunning ? (
              <>
                <Loader2 size={14} className="spinning" />
                Running...
              </>
            ) : (
              <>
                <Play size={14} />
                Run Code
              </>
            )}
          </button>

          {/* Clear Button */}
          {(output || error) && (
            <button className="btn-compiler clear" onClick={handleClearOutput}>
              Clear Output
            </button>
          )}
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
            {isRunning && (
              <div className="output-loading">
                <Loader2 size={20} className="spinning" />
                <span>Running your code...</span>
              </div>
            )}

            {output && !isRunning && (
              <div className="output-block success">
                <div className="output-header">
                  <CheckCircle size={14} />
                  <span>Output:</span>
                </div>
                <pre className="output-text">{output}</pre>
              </div>
            )}
            
            {error && !isRunning && (
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
                <Terminal size={32} className="empty-icon" />
                <p>Click "Run Code" to execute your program</p>
                <p className="output-hint">
                  Tip: Use the "Input" tab to provide stdin data
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="input-section">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Enter input for your program (one value per line)&#10;&#10;Example:&#10;5&#10;10&#10;Hello World"
              className="input-textarea"
            />
            {input && (
              <button className="btn-clear-input" onClick={handleClearInput}>
                Clear Input
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompilerPanel;
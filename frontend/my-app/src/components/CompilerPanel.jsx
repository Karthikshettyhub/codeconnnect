import React, { useState } from "react";
import { Play, Loader2, Terminal } from "lucide-react";
import { executeCode } from "../services/judge0Service";
import "./CompilerPanel.css";

const CompilerPanel = ({ language, code }) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("output");

  const cleanCode = (raw) => {
    if (!raw) return "";
    return raw
      .replace(/^```[\s\S]*?\n/, "")
      .replace(/\n```$/, "")
      .replace(/^[ \t]*```|```[ \t]*$/g, "")
      .trim();
  };

  const handleRunCode = async () => {
    if (!code?.trim()) {
      setError("No code to execute");
      return;
    }

    setIsRunning(true);
    setOutput("Running code...");
    setError("");

    try {
      const finalCode = cleanCode(code);
      const result = await executeCode(finalCode, language, input);

      if (!result.success) {
        setOutput("");
        setError(result.error || "Execution failed");
      } else {
        setOutput(result.output || "Ran successfully — no output");
        setError("");
      }
    } catch (err) {
      setOutput("");
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Runtime/Network error: ${errorMessage}\n(Check if your internet allows calls to emkc.org)`);
    }

    setIsRunning(false);
  };

  return (
    <div className="compiler-panel">
      <div className="compiler-header">
        <div className="compiler-title">
          <Terminal size={16} />
          <span>Code Executor</span>
        </div>

        <button
          className={`btn-compiler ${isRunning ? "running" : "run"}`}
          onClick={handleRunCode}
          disabled={isRunning}
        >
          {isRunning ? (
            <>
              <Loader2 size={14} className="spinning" /> Running...
            </>
          ) : (
            <>
              <Play size={14} /> Run Code
            </>
          )}
        </button>
      </div>

      <div className="compiler-tabs">
        <button
          className={`tab ${activeTab === "output" ? "active" : ""}`}
          onClick={() => setActiveTab("output")}
        >
          Output
        </button>
        <button
          className={`tab ${activeTab === "input" ? "active" : ""}`}
          onClick={() => setActiveTab("input")}
        >
          Input
        </button>
      </div>

      <div className="compiler-content">
        {activeTab === "output" ? (
          <pre className="output-area">{output}</pre>
        ) : (
          <textarea
            className="input-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        )}
      </div>

      {error && (
        <div className="error-box">
          <pre>{error}</pre>
        </div>
      )}
    </div>
  );
};

export default CompilerPanel;

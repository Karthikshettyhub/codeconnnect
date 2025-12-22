import React, { useState } from "react";
import { Play, Loader2, Terminal } from "lucide-react";
import { executeCode } from "../services/pistonService";
import "./CompilerPanel.css";

const CompilerPanel = ({ language, code }) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("output");

  const clean = (code) =>
    (code || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/```/g, "")
      .replace(/`/g, "")
      .replace(/[^\x00-\x7F]/g, "")
      .trim();

  const handleRunCode = async () => {
    if (!code?.trim()) {
      setError("⚠️ No code to execute");
      return;
    }

    setIsRunning(true);
    setOutput("⏳ Running code...");
    setError("");

    try {
      const finalCode = clean(code);
      const result = await executeCode(finalCode, language, input);

      if (!result.success) {
        setOutput("");
        setError(result.error || "Execution failed");
      } else {
        setOutput(result.output || "✔ Ran successfully — no output");
        setError("");
      }
    } catch (err) {
      setOutput("");
      setError("Runtime error: " + err.message);
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

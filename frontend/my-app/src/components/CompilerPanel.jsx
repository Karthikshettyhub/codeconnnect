import React, { useState, useEffect } from "react";
import { Play, Loader2, Terminal } from "lucide-react";
import { executeCode, getStarterCode } from "../services/compilerService";
import "./CompilerPanel.css";

const CompilerPanel = ({ language = "javascript", code }) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("output");

  const cleanCode = (raw) => {
    if (!raw) return "";
    
    // ✅ FIXED: Only remove markdown code fences, preserve actual code
    return raw
      .replace(/^```[a-z]*\n?/i, "")    // Remove opening ```javascript
      .replace(/\n?```$/i, "")            // Remove closing ```
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
      console.log("-----------------------------------------");
      console.log("🚀 [COMPILE] Click detected");
      console.log("📝 Context Code State:", JSON.stringify(code));
      console.log("🧹 Cleaned Code for API:", JSON.stringify(finalCode));
      console.log("🌐 Language Target:", language);
      console.log("📥 Input Provided:", input);
      console.log("-----------------------------------------");
      
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
      const errorMessage = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(`Runtime/Network error: ${errorMessage}`);
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

      {/* ✅ Tabs */}
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
            placeholder="Enter input (if needed)..."
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
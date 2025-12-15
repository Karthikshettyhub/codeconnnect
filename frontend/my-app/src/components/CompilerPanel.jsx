// src/components/CompilerPanel.jsx
import React, { useState } from "react";
import { Play, Loader2, Terminal } from "lucide-react";
import { executeCode } from "../services/pistonService";
import "./CompilerPanel.css";

const CompilerPanel = ({ language }) => {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState("output");

  // Read latest code stored by Monaco Editor
  const getUserCode = () => localStorage.getItem("currentCode") || "";

  const clean = (code) =>
    (code || "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/```/g, "")
      .replace(/`/g, "")
      .replace(/[^\x00-\x7F]/g, "")
      .trim();

  // ⛔ NO LLM HERE — Runs RAW user code
  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput("⏳ Running user code...");
    setError("");

    const rawBody = getUserCode();
    const finalCode = clean(rawBody);

    try {
      const result = await executeCode(finalCode, language, input);

      console.log("🔍 PISTON RESULT:", result);

      if (!result.success) {
        setOutput("");
        setError(
          result.error ||
            result.run?.stderr ||
            result.compile?.stderr ||
            "Unknown error."
        );
      } else if (result.run?.stderr?.trim()) {
        setOutput("");
        setError(result.run.stderr);
      } else if (result.output?.trim()) {
        setOutput(result.output);
        setError("");
      } else {
        setOutput("✔ Ran successfully — but no output.");
        setError("");
      }
    } catch (err) {
      setOutput("");
      setError("Unexpected runtime error: " + err.message);
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

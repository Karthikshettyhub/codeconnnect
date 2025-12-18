// src/services/pistonService.js
import axios from "axios";

const PISTON_API = "https://emkc.org/api/v2/piston";

export const LANGUAGE_CONFIGS = {
  javascript: { language: "javascript", version: "18.15.0", alias: "js" },
  python: { language: "python", version: "3.10.0", alias: "py" },
  java: { language: "java", version: "15.0.2", alias: "java" },
  cpp: { language: "c++", version: "10.2.0", alias: "cpp" },
  c: { language: "c", version: "10.2.0", alias: "c" },
  csharp: { language: "csharp", version: "6.12.0", alias: "cs" },
  go: { language: "go", version: "1.16.2", alias: "go" },
  rust: { language: "rust", version: "1.68.2", alias: "rs" },
  typescript: { language: "typescript", version: "5.0.3", alias: "ts" },
  ruby: { language: "ruby", version: "3.0.1", alias: "rb" },
  php: { language: "php", version: "8.2.3", alias: "php" },
  kotlin: { language: "kotlin", version: "1.8.20", alias: "kt" },
  swift: { language: "swift", version: "5.3.3", alias: "swift" }
};

export const executeCode = async (code, language, input = "") => {
  try {
    const langConfig = LANGUAGE_CONFIGS[language.toLowerCase()];

    if (!langConfig) {
      throw new Error(`Language "${language}" is not supported.`);
    }

    console.log("🚀 Executing on Piston…");

    const response = await axios.post(
      `${PISTON_API}/execute`,
      {
        language: langConfig.language,
        version: langConfig.version,
        files: [
          {
            name: `main.${langConfig.alias}`,
            content: code
          }
        ],
        stdin: input
      },
      { timeout: 10000 }
    );

    const result = response.data;

    console.log("🔥 RAW RESULT:", result);

    // -----------------------------------------
    // FIXED COMPILER ERROR CHECK
    // -----------------------------------------
    if (result.compile && result.compile.code !== 0) {
      return {
        success: false,
        error: result.compile.stderr || "Compilation error",
        output: "",
        status: "Compilation Error"
      };
    }

    // -----------------------------------------
    // FIXED RUNTIME ERROR CHECK (MAIN FIX)
    // -----------------------------------------
    if (result.run && result.run.code !== 0) {
      return {
        success: false,
        error: result.run.stderr || `Runtime Error (exit code ${result.run.code})`,
        output: result.run.stdout || "",
        status: "Runtime Error"
      };
    }

    // -----------------------------------------
    // SUCCESS CASE
    // -----------------------------------------
    return {
      success: true,
      output: result.run.stdout || "",
      error: result.run.stderr || "",
      status: "Accepted"
    };

  } catch (error) {
    console.error("❌ Piston error:", error);

    return {
      success: false,
      output: "",
      error: error.message || "Unknown error",
      status: "Error"
    };
  }
};

export const getStarterCode = (language) => {
  const templates = {
    javascript: `console.log("Hello World");`,
    python: `print("Hello World")`,
    c: `#include <stdio.h>
int main() {
  printf("Hello World");
  return 0;
}`,
    cpp: `#include <iostream>
using namespace std;
int main() {
  cout << "Hello World";
  return 0;
}`
  };

  return templates[language.toLowerCase()] || "";
};

export const getFileExtension = (language) =>
  LANGUAGE_CONFIGS[language.toLowerCase()]?.alias || "txt";

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const TEMP_DIR = "/tmp/sandbox";

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const LANGUAGE_CONFIG = {
  python: {
    image: "python:3.11-alpine",
    filename: "solution.py",
    runCmd: "python solution.py",
  },
  cpp: {
    image: "gcc:latest",
    filename: "solution.cpp",
    runCmd: "g++ solution.cpp -o solution && ./solution",
  },
  java: {
    image: "eclipse-temurin:17-alpine",
    filename: "Main.java",
    runCmd: "javac Main.java && java Main",
  },
  javascript: {
    image: "node:18-alpine",
    filename: "solution.js",
    runCmd: "node solution.js",
  },
};

const runCode = (code, language, stdin = "") => {
  return new Promise((resolve) => {
    const config = LANGUAGE_CONFIG[language];

    if (!config) {
      return resolve({
        output: "",
        error: `Language "${language}" not supported.`,
        executionTime: 0,
      });
    }

    const execId = uuidv4();
    const execDir = path.join(TEMP_DIR, execId);
    fs.mkdirSync(execDir, { recursive: true });

    fs.writeFileSync(path.join(execDir, config.filename), code);

    const startTime = Date.now();

    const dockerCmd = [
      "docker run --rm",
      "--memory=100m",
      "--cpus=0.5",
      "--network=none",
      `-v ${execDir}:/code`,
      "-w /code",
      config.image,
      `sh -c "timeout 10 ${config.runCmd}"`,
    ].join(" ");

    exec(dockerCmd, { timeout: 15000 }, (error, stdout, stderr) => {
      const executionTime = Date.now() - startTime;

      fs.rmSync(execDir, { recursive: true, force: true });

      if (error && error.code === 124) {
        return resolve({
          output: "",
          error: "Time limit exceeded (10 seconds)",
          executionTime,
        });
      }

      resolve({
        output: stdout || "",
        error: stderr || (error && !stdout ? error.message : "") || "",
        executionTime,
      });
    });
  });
};

module.exports = { runCode };
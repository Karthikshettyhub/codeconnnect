const { exec } = require("child_process");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");
const path = require("path");
const os = require("os");

const LANGUAGE_CONFIG = {
  javascript: {
    image: "node:18-alpine",
    filename: "code.js",
    runCmd: "node /app/code.js",
  },
  python: {
    image: "python:3.10-alpine",
    filename: "code.py",
    runCmd: "python /app/code.py",
  },
  c: {
    image: "gcc",
    filename: "code.c",
    runCmd: 'bash -c "gcc /app/code.c -o /tmp/code && /tmp/code"',
  },
  cpp: {
    image: "gcc",
    filename: "code.cpp",
    runCmd: 'bash -c "g++ /app/code.cpp -o /tmp/code && /tmp/code"',
  },
  java: {
    image: "eclipse-temurin:17",
    filename: "Main.java",
    runCmd: 'bash -c "javac /app/Main.java -d /tmp && java -cp /tmp Main"',
  },
};

const cleanup = (dir) => {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_) {}
};

const runCode = (code, language, stdin = "") => {
  return new Promise((resolve) => {
    const config = LANGUAGE_CONFIG[language.toLowerCase()];
    if (!config) {
      return resolve({
        output: "",
        error: `Language "${language}" not supported.`,
        executionTime: 0,
      });
    }

    const execId = uuidv4();
    const execDir = path.join(os.tmpdir(), execId);
    fs.mkdirSync(execDir, { recursive: true });
    fs.writeFileSync(path.join(execDir, config.filename), code);
    fs.writeFileSync(path.join(execDir, "input.txt"), stdin || "");

    const containerName = `sandbox_${execId}`;
    const startTime = Date.now();

    const createCmd = `docker create \
      --name ${containerName} \
      --memory=256m \
      --cpus=0.5 \
      --pids-limit=64 \
      --network=none \
      ${config.image} \
      sh -c 'timeout 5 ${config.runCmd} < /app/input.txt'`;

    exec(createCmd, (err) => {
      if (err) {
        cleanup(execDir);
        return resolve({ output: "", error: "Container create failed: " + err.message, executionTime: 0 });
      }

      exec(`docker cp ${execDir}/. ${containerName}:/app/`, (err) => {
        if (err) {
          cleanup(execDir);
          exec(`docker rm -f ${containerName}`, () => {});
          return resolve({ output: "", error: "File copy failed: " + err.message, executionTime: 0 });
        }

        exec(`docker start -a ${containerName}`, { timeout: 10000 }, (error, stdout, stderr) => {
          const executionTime = Date.now() - startTime;
          cleanup(execDir);
          exec(`docker rm -f ${containerName}`, () => {});

          if (error && error.code === 124) {
            return resolve({ output: stdout || "", error: "Time Limit Exceeded (5s)", executionTime });
          }

          resolve({
            output: stdout || "",
            error: stderr || (error && !stdout ? error.message : ""),
            executionTime,
          });
        });
      });
    });
  });
};

module.exports = { runCode };
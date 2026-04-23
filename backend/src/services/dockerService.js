const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const os = require('os');

const DOCKER_IMAGES = {
  python: 'python:3.11-alpine',
  cpp: 'gcc:latest',
  java: 'eclipse-temurin:17-alpine',
  javascript: 'node:alpine',
};

const RUN_COMMANDS = {
  python: 'python3 /code/code.py',
  cpp: 'g++ /code/code.cpp -o /code/out && /code/out',
  java: 'javac /code/Main.java && java -cp /code Main',
  javascript: 'node /code/code.js',
};

const FILE_NAMES = {
  python: 'code.py',
  cpp: 'code.cpp',
  java: 'Main.java',
  javascript: 'code.js',
};

// Windows-safe temporary directory
const tempDir = path.join(os.tmpdir(), "code-exec");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const writeCodeToFolder = (code, language) => {
  const id = crypto.randomBytes(6).toString('hex');
  const folder = path.join(tempDir, `${language}_${id}`);
  fs.mkdirSync(folder, { recursive: true });
  const filepath = path.join(folder, FILE_NAMES[language]);
  fs.writeFileSync(filepath, code);
  return folder;
};

const cleanup = (folder) => {
  try {
    if (fs.existsSync(folder)) {
      fs.rmSync(folder, { recursive: true, force: true });
    }
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
};

const buildDockerCommand = (language, folder) => {
  const image = DOCKER_IMAGES[language];
  const runCmd = RUN_COMMANDS[language];
  
  // Use path.resolve to ensure absolute path for Docker volume mounting
  const absolutePath = path.resolve(folder);

  return `docker run --rm \
    --memory=100m \
    --cpus=0.5 \
    --network=none \
    --ulimit nofile=50:50 \
    -v "${absolutePath}:/code" \
    ${image} \
    sh -c "${runCmd}"`;
};

const runInDocker = async (code, language) => {
  if (!DOCKER_IMAGES[language]) {
    return {
      success: false,
      output: '',
      error: `Language "${language}" is not supported`,
    };
  }

  // Check if Docker is running
  const isDockerRunning = await new Promise((resolve) => {
    exec('docker ps', (error) => {
      resolve(!error);
    });
  });

  if (!isDockerRunning) {
    return {
      success: false,
      output: '',
      error: "Docker is not running. Please start Docker Desktop.",
    };
  }

  return new Promise((resolve) => {
    const folder = writeCodeToFolder(code, language);
    const cmd = buildDockerCommand(language, folder);

    exec(cmd, { timeout: 10000 }, (error, stdout, stderr) => {
      cleanup(folder);

      if (error && error.killed) {
        return resolve({
          success: false,
          output: '',
          error: 'Time limit exceeded (10 seconds)',
        });
      }

      if (stderr && stderr.trim()) {
        return resolve({
          success: false,
          output: stdout || '',
          error: stderr,
        });
      }

      resolve({
        success: true,
        output: stdout || '',
        error: '',
      });
    });
  });
};

module.exports = { runInDocker };
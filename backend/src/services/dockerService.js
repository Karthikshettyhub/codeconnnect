const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { exec } = require('child_process');

const DOCKER_IMAGES = {
  python: 'python:3.11-alpine',
  cpp: 'gcc:latest',
  java: 'openjdk:11-alpine',
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

const writeCodeToFolder = (code, language) => {
  const id = crypto.randomBytes(6).toString('hex');
  const folder = path.join(os.tmpdir(), `${language}_${id}`);
  fs.mkdirSync(folder);
  const filepath = path.join(folder, FILE_NAMES[language]);
  fs.writeFileSync(filepath, code);
  return folder;
};

const cleanup = (folder) => {
  try {
    fs.rmSync(folder, { recursive: true, force: true });
  } catch (err) {
    console.error('Cleanup error:', err.message);
  }
};

const buildDockerCommand = (language, folder) => {
  const image = DOCKER_IMAGES[language];
  const runCmd = RUN_COMMANDS[language];

  return `docker run --rm \
    --memory=100m \
    --cpus=0.5 \
    --network=none \
    --ulimit nofile=50:50 \
    -v "${folder}:/code" \
    ${image} \
    sh -c "${runCmd}"`;
};

const runInDocker = (code, language) => {
  return new Promise((resolve) => {

    if (!DOCKER_IMAGES[language]) {
      return resolve({
        success: false,
        output: '',
        error: `Language "${language}" is not supported`,
      });
    }

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
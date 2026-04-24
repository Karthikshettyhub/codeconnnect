const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const os = require('os');

const DOCKER_IMAGES = {
  python: 'python:3.11-alpine',
  c: 'gcc',
  cpp: 'gcc',
  java: 'eclipse-temurin:17-alpine',
  javascript: 'node:alpine',
};

const RUN_COMMANDS = {
  python: 'python3 /code/code.py',
  c: 'gcc /code/code.c -o /code/out && /code/out',
  cpp: 'g++ /code/code.cpp -o /code/out && /code/out',
  java: 'javac /code/Main.java && java -cp /code Main',
  javascript: 'node /code/code.js',
};

const FILE_NAMES = {
  python: 'code.py',
  c: 'code.c',
  cpp: 'code.cpp',
  java: 'Main.java',
  javascript: 'code.js',
};

const projectRoot = path.join(__dirname, '../../');
const tempDir = path.join(projectRoot, '.code-temp');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const writeCodeToFolder = (code, language, input) => {
  const id = crypto.randomBytes(6).toString('hex');
  const folder = path.join(tempDir, `${language}_${id}`);
  fs.mkdirSync(folder, { recursive: true });
  const filepath = path.join(folder, FILE_NAMES[language]);
  fs.writeFileSync(filepath, code);
  
  if (input !== undefined && input !== null) {
    fs.writeFileSync(path.join(folder, 'input.txt'), input);
  } else {
    fs.writeFileSync(path.join(folder, 'input.txt'), '');
  }
  
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
  const runCmd = RUN_COMMANDS[language] + ' < /code/input.txt';
  const absolutePath = path.resolve(folder);
  let dockerPath = absolutePath;

  if (os.platform() === 'win32') {
    dockerPath = absolutePath.replace(/\\/g, '/');
  }

  return `docker run --rm --memory=128m --cpus=0.5 --network=none --ulimit nofile=50:50 -v "${dockerPath}:/code" ${image} sh -c "${runCmd}"`;
};

const runInDocker = async (code, language, input) => {
  if (!DOCKER_IMAGES[language]) {
    return {
      success: false,
      output: '',
      error: `Language "${language}" is not supported`,
    };
  }

  const isDockerRunning = await new Promise((resolve) => {
    exec('docker ps', (error) => {
      resolve(!error);
    });
  });

  if (!isDockerRunning) {
    return {
      success: false,
      output: '',
      error: "Docker is not running",
    };
  }

  return new Promise((resolve) => {
    const folder = writeCodeToFolder(code, language, input);
    const cmd = buildDockerCommand(language, folder);

    exec(cmd, { timeout: 90000, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      cleanup(folder);

      if (error && error.killed) {
        return resolve({ success: false, output: stdout || '', error: 'Timeout' });
      }

      if (error) {
        return resolve({ success: false, output: stdout || '', error: error.message });
      }

      if (stderr && stderr.trim()) {
        return resolve({ success: false, output: stdout || '', error: stderr });
      }

      resolve({ success: true, output: stdout || '', error: '' });
    });
  });
};

module.exports = { runInDocker };
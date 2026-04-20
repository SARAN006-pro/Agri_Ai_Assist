import { existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..');
const backendDir = path.resolve(projectRoot, 'backend');
const envFilePath = path.resolve(backendDir, '.env');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const cleanedLine = line.startsWith('export ') ? line.slice(7).trim() : line;
    const equalsIndex = cleanedLine.indexOf('=');
    if (equalsIndex === -1) {
      continue;
    }

    const key = cleanedLine.slice(0, equalsIndex).trim();
    if (!key) {
      continue;
    }

    let value = cleanedLine.slice(equalsIndex + 1).trim();
    const isQuoted = (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"));
    if (isQuoted) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  }
}

function resolvePythonExecutable() {
  const candidates = [];

  if (process.env.PYTHON) {
    candidates.push(process.env.PYTHON);
  }

  if (process.platform === 'win32') {
    candidates.push(
      path.resolve(projectRoot, '.venv', 'Scripts', 'python.exe'),
      path.resolve(backendDir, '.venv', 'Scripts', 'python.exe'),
      path.resolve(projectRoot, 'venv', 'Scripts', 'python.exe'),
      path.resolve(backendDir, 'venv', 'Scripts', 'python.exe')
    );
  } else {
    candidates.push(
      path.resolve(projectRoot, '.venv', 'bin', 'python'),
      path.resolve(backendDir, '.venv', 'bin', 'python'),
      path.resolve(projectRoot, 'venv', 'bin', 'python'),
      path.resolve(backendDir, 'venv', 'bin', 'python')
    );
  }

  candidates.push('py', 'python3', 'python');

  for (const candidate of candidates) {
    if (path.isAbsolute(candidate) && !existsSync(candidate)) {
      continue;
    }

    return candidate;
  }

  return 'python';
}

loadEnvFile(envFilePath);

const pythonExecutable = resolvePythonExecutable();
const pythonArgs = process.argv.slice(2);

if (pythonArgs.length === 0) {
  pythonArgs.push('-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', process.env.PORT || '8000');
}

if (pythonExecutable === 'py') {
  pythonArgs.unshift('-3');
}

const child = spawn(pythonExecutable, pythonArgs, {
  cwd: backendDir,
  env: process.env,
  shell: false,
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error(`[start] Failed to launch backend using ${pythonExecutable}:`, error.message);
  process.exit(1);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
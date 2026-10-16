#!/usr/bin/env node
'use strict';

// susiana lifecycle CLI (Docker mode) for susiana-api and susiana-webui. Built-ins only.
// Usage: susiana <command> [api|webui] [options]
// With no app selector, the command runs for both api and webui (api first).

const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const net = require('node:net');
const os = require('node:os');
const path = require('node:path');
const readline = require('node:readline');

const REPO_ROOT = path.resolve(__dirname, '..');
const MAX_LOG_BYTES = 10 * 1024 * 1024;
const STARTUP_TIMEOUT_MS = 30000;

const APPS = {
  api: {
    displayName: 'susiana-api',
    dataName: 'SusianaApi',
    projectDir: path.join(REPO_ROOT, 'susiana-api'),
    composeProject: 'susiana-api',
    portEnv: 'SUSIANA_API_PORT',
    defaultPort: 8200,
    healthPath: '/',
    externalNetwork: 'susiana-net',
    dataVolumes: ['susiana-pgdata'],
    legacyContainers: ['susiana-api', 'susiana-pgsql'],
  },
  webui: {
    displayName: 'susiana-webui',
    dataName: 'SusianaWebui',
    projectDir: path.join(REPO_ROOT, 'susiana-webui'),
    composeProject: 'susiana-webui',
    portEnv: 'SUSIANA_WEBUI_PORT',
    defaultPort: 5178,
    healthPath: '/',
    externalNetwork: null,
    dataVolumes: [],
    legacyContainers: ['susiana-webui'],
  },
};

let ctx = null;

function makeContext(key) {
  const app = APPS[key];
  const dataRoot = process.platform === 'win32'
    ? path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), app.dataName)
    : path.join(os.homedir(), '.local', 'share', app.dataName);
  const logsDir = path.join(dataRoot, 'logs');
  return {
    ...app,
    key,
    dataRoot,
    configFile: path.join(dataRoot, 'config.json'),
    logsDir,
    logFile: path.join(logsDir, `${app.displayName}.log`),
  };
}

function log(line) {
  if (!ctx) return;
  fs.mkdirSync(ctx.logsDir, { recursive: true });
  try {
    if (fs.statSync(ctx.logFile).size > MAX_LOG_BYTES) fs.renameSync(ctx.logFile, `${ctx.logFile}.1`);
  } catch {
    // no log yet
  }
  fs.appendFileSync(ctx.logFile, `${new Date().toISOString()} ${line}\n`);
}

function say(msg) {
  console.log(msg);
  log(msg);
}

function fail(msg, code = 1) {
  console.error(msg);
  log(`ERROR ${msg}`);
  process.exit(code);
}

function readConfig() {
  if (!fs.existsSync(ctx.configFile)) return null;
  return JSON.parse(fs.readFileSync(ctx.configFile, 'utf8'));
}

function writeConfig(cfg) {
  fs.mkdirSync(ctx.dataRoot, { recursive: true });
  fs.writeFileSync(ctx.configFile, `${JSON.stringify(cfg, null, 2)}\n`);
}

function defaultConfig() {
  return { alias: ctx.displayName, mode: 'docker', port: ctx.defaultPort, sourceDir: ctx.projectDir, version: sourceVersion() };
}

function requireInstalled() {
  const cfg = readConfig();
  if (!cfg) fail(`${ctx.key} is not installed. Run: susiana rebuild ${ctx.key}`, 4);
  return cfg;
}

function sourceVersion() {
  const r = spawnSync('git', ['-C', ctx.projectDir, 'describe', '--tags', '--always', '--dirty'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : 'unknown';
}

function cliVersion() {
  return require(path.join(__dirname, 'package.json')).version;
}

function dockerAvailable() {
  return spawnSync('docker', ['info'], { stdio: 'ignore' }).status === 0;
}

function requireDocker() {
  if (!dockerAvailable()) fail('Docker is not running or not installed.', 1);
}

function compose(args, port) {
  const env = { ...process.env };
  if (port !== undefined) env[ctx.portEnv] = String(port);
  const result = spawnSync('docker', ['compose', '-p', ctx.composeProject, ...args], {
    cwd: ctx.projectDir,
    env,
    stdio: 'inherit',
  });
  if (result.error) fail(`docker compose failed to start: ${result.error.message}`, 1);
  return result;
}

function runningContainers() {
  const r = spawnSync('docker', [
    'ps', '--filter', `label=com.docker.compose.project=${ctx.composeProject}`,
    '--format', '{{.Names}}\t{{.Status}}',
  ], { encoding: 'utf8' });
  if (r.status !== 0) return [];
  return r.stdout.split(/\r?\n/).filter(Boolean).map((line) => {
    const [name, status] = line.split('\t');
    return { name, status };
  });
}

// Containers created before the CLI existed belong to the compose project "susiana"
// (from the compose files' top-level `name:`), so the project-scoped calls above never see them.
function legacyContainers() {
  const r = spawnSync('docker', [
    'ps', '-a', '--filter', 'label=com.docker.compose.project=susiana',
    '--format', '{{.Names}}\t{{.Status}}',
  ], { encoding: 'utf8' });
  if (r.status !== 0) return [];
  return r.stdout.split(/\r?\n/).filter(Boolean).map((line) => {
    const [name, status] = line.split('\t');
    return { name, status };
  }).filter((c) => ctx.legacyContainers.includes(c.name));
}

function removeLegacyContainers() {
  const legacy = legacyContainers();
  if (legacy.length === 0) return;
  say(`Removing legacy containers: ${legacy.map((c) => c.name).join(', ')}`);
  spawnSync('docker', ['rm', '-f', ...legacy.map((c) => c.name)], { stdio: 'inherit' });
}

function probe(port, timeoutMs = 3000) {
  return new Promise((resolve) => {
    const req = http.get({ host: '127.0.0.1', port, path: ctx.healthPath, timeout: timeoutMs }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on('timeout', () => {
      req.destroy();
      resolve(null);
    });
    req.on('error', () => resolve(null));
  });
}

async function waitForUrl(port, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if ((await probe(port, 1000)) !== null) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  return false;
}

function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '0.0.0.0');
  });
}

function parsePort(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 65535) fail(`Invalid port: ${value}`, 2);
  return n;
}

function urlFor(port) {
  return `http://localhost:${port}`;
}

async function confirm(question, opts) {
  if (opts.yes) return true;
  if (!process.stdin.isTTY) fail('Destructive action needs -y in non-interactive mode.', 2);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise((resolve) => rl.question(`${question} [y/N] `, resolve));
  rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

async function ensureExternalNetwork(opts) {
  if (!ctx.externalNetwork) return;
  const inspect = spawnSync('docker', ['network', 'inspect', ctx.externalNetwork], { stdio: 'ignore' });
  if (inspect.status === 0) return;
  if (!(await confirm(`Docker network "${ctx.externalNetwork}" is missing. Create it?`, opts))) {
    fail(`Network ${ctx.externalNetwork} is required. Aborting.`, 1);
  }
  const create = spawnSync('docker', ['network', 'create', ctx.externalNetwork], { stdio: 'inherit' });
  if (create.status !== 0) fail(`Failed to create network ${ctx.externalNetwork}.`, create.status ?? 1);
}

function removeVolumes() {
  for (const volume of ctx.dataVolumes) {
    spawnSync('docker', ['volume', 'rm', volume], { stdio: 'ignore' });
  }
}

async function start(opts) {
  const cfg = requireInstalled();
  requireDocker();
  if (opts.port !== undefined) {
    cfg.port = parsePort(opts.port);
    writeConfig(cfg);
  }
  await ensureExternalNetwork(opts);
  removeLegacyContainers();
  const up = compose(['up', '-d'], cfg.port);
  if (up.status !== 0) fail('docker compose up failed.', up.status ?? 1);
  if (!(await waitForUrl(cfg.port, STARTUP_TIMEOUT_MS))) {
    fail(`Started, but ${urlFor(cfg.port)} did not respond within 30s.`, 1);
  }
  say(`${ctx.displayName} running at ${urlFor(cfg.port)}`);
}

async function stop() {
  const cfg = readConfig();
  if (!cfg) {
    say(`${ctx.displayName} is not installed; nothing to stop.`);
    return;
  }
  requireDocker();
  const r = compose(['stop'], cfg.port);
  if (r.status !== 0) fail('docker compose stop failed.', r.status ?? 1);
  if (runningContainers().length > 0) fail('Containers are still running after stop.', 1);
  const free = await isPortFree(cfg.port);
  say(`${ctx.displayName} stopped. Port ${cfg.port} free: ${free}`);
}

async function showStatus() {
  const cfg = readConfig();
  if (!cfg) {
    say(`${ctx.displayName}: not installed`);
    process.exitCode = 4;
    return;
  }
  const containers = dockerAvailable() ? runningContainers() : [];
  const running = containers.length > 0;
  const httpStatus = await probe(cfg.port);
  say(`${ctx.displayName}: installed`);
  say(`  mode:      ${cfg.mode}`);
  say(`  version:   ${cfg.version}`);
  say(`  source:    ${cfg.sourceDir}`);
  say(`  data:      ${ctx.dataRoot}`);
  say(`  port:      ${cfg.port}`);
  say(`  running:   ${running ? 'yes' : 'no'}`);
  for (const c of containers) say(`    ${c.name} (${c.status})`);
  say(`  url:       ${urlFor(cfg.port)} -> ${httpStatus ?? 'no response'}`);
  process.exitCode = running ? 0 : 3;
}

async function version() {
  const cfg = readConfig();
  const current = sourceVersion();
  say(`CLI version:       ${cliVersion()}`);
  say(`Installed version: ${cfg ? cfg.version : 'not installed'}`);
  say(`Source version:    ${current}`);
  if (cfg && cfg.version !== current) say('Mismatch: run "rebuild" or "update" to apply the source change.');
}

async function port(opts) {
  const cfg = requireInstalled();
  if (opts.port === undefined) {
    say(String(cfg.port));
    return;
  }
  const next = parsePort(opts.port);
  if (next !== cfg.port && !(await isPortFree(next))) fail(`Port ${next} is in use.`, 1);
  const wasRunning = runningContainers().length > 0;
  cfg.port = next;
  writeConfig(cfg);
  say(`Default port saved: ${next}`);
  if (wasRunning) await start({ ...opts, port: undefined });
}

async function rebuild(opts) {
  const removeData = opts['remove-data'] ?? 'no';
  if (!['no', 'yes'].includes(removeData)) fail('--remove-data must be "no" or "yes".', 2);
  requireDocker();

  const prior = readConfig();
  const port = prior ? prior.port : ctx.defaultPort;
  const wasRunning = runningContainers().length > 0 || legacyContainers().some((c) => c.status.startsWith('Up'));

  if (removeData === 'yes') {
    const confirmed = await confirm(
      `This deletes containers, images, volumes (${ctx.dataVolumes.join(', ') || 'none'}), data at ${ctx.dataRoot} and config. Continue?`,
      opts,
    );
    if (!confirmed) return say('Aborted.');
    compose(['down', '-v', '--rmi', 'local', '--remove-orphans'], port);
    removeVolumes();
    fs.rmSync(ctx.dataRoot, { recursive: true, force: true });
    const cfg = defaultConfig();
    const build = compose(['build', '--no-cache', '--pull'], cfg.port);
    if (build.status !== 0) fail('Build failed. Data was already removed.', build.status ?? 1);
    removeLegacyContainers();
    writeConfig(cfg);
  } else {
    const build = compose(['build', '--no-cache', '--pull'], port);
    if (build.status !== 0) fail('Build failed; old install left untouched.', build.status ?? 1);
    removeLegacyContainers();
    compose(['down', '--remove-orphans'], port);
    const cfg = prior ?? defaultConfig();
    cfg.version = sourceVersion();
    writeConfig(cfg);
  }

  say(`${ctx.displayName} rebuilt (remove-data=${removeData}).`);
  if (wasRunning) await start({ ...opts, port: undefined });
  else await showStatus();
}

async function update(opts) {
  const cfg = requireInstalled();
  const pull = spawnSync('git', ['-C', ctx.projectDir, 'pull', '--ff-only'], { stdio: 'inherit' });
  if (pull.status !== 0) fail('git pull --ff-only failed; nothing changed.', pull.status ?? 1);
  requireDocker();
  const dockerPull = compose(['pull', '--ignore-buildable'], cfg.port);
  if (dockerPull.status !== 0) fail('docker compose pull failed.', dockerPull.status ?? 1);
  await rebuild({ ...opts, 'remove-data': 'no' });
}

async function uninstall(opts) {
  const confirmed = await confirm(
    `This removes ${ctx.displayName} containers, images, volumes, data and config. Source code and the susiana CLI are kept. Continue?`,
    opts,
  );
  if (!confirmed) return say('Aborted.');
  const cfg = readConfig();
  if (dockerAvailable()) {
    compose(['down', '-v', '--rmi', 'local', '--remove-orphans'], cfg ? cfg.port : ctx.defaultPort);
    removeVolumes();
  }
  fs.rmSync(ctx.dataRoot, { recursive: true, force: true });
  say(`${ctx.displayName} uninstalled.`);
}

const COMMANDS = {
  status: showStatus,
  version,
  run: start,
  stop,
  port,
  update,
  rebuild,
  uninstall,
};

function help() {
  console.log(`Usage: susiana <command> [api|webui] [options]

Apps (optional; omit to run the command for both, api first):
  api     susiana-api   (default port 8200)
  webui   susiana-webui (default port 5178)

Commands:
  status                              Show install, container, port and URL state
  version                             Compare installed, source and CLI versions
  run [--port=N]                      Start the app(s) (--port needs an app selector)
  stop                                Stop containers and verify the port is free
  port [--port=N]                     Show or set the default port (restarts if running; --port needs an app selector)
  update                              git pull --ff-only, then rebuild (keeps data)
  rebuild [--remove-data=no|yes]      Rebuild the app(s) (yes wipes data and config)
  uninstall                           Remove the app(s) containers, volumes, data and config
  help                                Show this message

Options:
  -y, --yes                           Skip confirmation prompts

Examples:
  susiana rebuild                     Rebuild both api and webui
  susiana run                         Start both api and webui
  susiana rebuild api --remove-data=no -y
  susiana port webui --port=5179`);
}

function parseArgs(args) {
  const opts = {};
  const positionals = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-y' || arg === '--yes') {
      opts.yes = true;
    } else if (arg.startsWith('--')) {
      const eq = arg.indexOf('=');
      if (eq > 0) {
        opts[arg.slice(2, eq)] = arg.slice(eq + 1);
      } else {
        const key = arg.slice(2);
        const next = args[i + 1];
        if (next !== undefined && !next.startsWith('-') && !Object.hasOwn(APPS, next)) {
          opts[key] = next;
          i++;
        } else {
          opts[key] = true;
        }
      }
    } else if (arg.startsWith('-')) {
      fail(`Unknown option: ${arg}`, 2);
    } else {
      positionals.push(arg);
    }
  }
  return { opts, positionals };
}

// Accepts "<command> [app]" and "<app> <command>" so both orders work.
function resolveCommandAndTargets(positionals) {
  const [first, second, ...extra] = positionals;
  if (extra.length > 0) fail(`Unknown input: ${extra.join(' ')}`, 2);
  if (first !== undefined && Object.hasOwn(APPS, first)) {
    return { command: second, targets: [first] };
  }
  if (second !== undefined && !Object.hasOwn(APPS, second)) {
    fail(`Unknown app: ${second}. Use "api" or "webui".`, 2);
  }
  return { command: first, targets: second === undefined ? Object.keys(APPS) : [second] };
}

async function main() {
  const rawArgs = process.argv.slice(2);
  if (rawArgs.length === 0 || rawArgs[0] === 'help' || rawArgs[0] === '--help' || rawArgs[0] === '-h') {
    return help();
  }

  const { opts, positionals } = parseArgs(rawArgs);
  const { command, targets } = resolveCommandAndTargets(positionals);

  if (command === undefined || command === 'help') return help();
  if (!Object.hasOwn(COMMANDS, command)) {
    help();
    fail(`Unknown command: ${command}`, 2);
  }
  if (command === 'port' && opts.port !== undefined && targets.length > 1) {
    fail('--port needs an app selector: susiana port <api|webui> --port=N', 2);
  }

  let worstExitCode = 0;
  for (const key of targets) {
    ctx = makeContext(key);
    if (targets.length > 1) console.log(`== ${ctx.displayName} ==`);
    process.exitCode = undefined;
    await COMMANDS[command](opts);
    worstExitCode = Math.max(worstExitCode, process.exitCode ?? 0);
  }
  process.exitCode = worstExitCode;
}

main().catch((err) => fail(err.stack || String(err), 1));

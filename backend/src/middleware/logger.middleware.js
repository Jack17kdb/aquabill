import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR   = path.join(__dirname, '../../logs');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const logFile   = path.join(LOG_DIR, 'requests.log');
const errorFile = path.join(LOG_DIR, 'errors.log');

const RESET  = '\x1b[0m';
const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const GRAY   = '\x1b[90m';
const BOLD   = '\x1b[1m';

const statusColor = (code) => {
  if (code >= 500) return RED;
  if (code >= 400) return YELLOW;
  if (code >= 300) return CYAN;
  return GREEN;
};

const writeToFile = (file, line) => {
  try { fs.appendFileSync(file, line + '\n'); } catch { /* non-fatal */ }
};

// Request logger
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const ts    = new Date().toISOString();

  res.on('finish', () => {
    const ms    = Date.now() - start;
    const code  = res.statusCode;
    const color = statusColor(code);
    const user  = req.user ? `[${req.user.email}]` : '[guest]';
    const method = req.method.padEnd(7);

    console.log(`${GRAY}${ts}${RESET} ${BOLD}${color}${code}${RESET} ${CYAN}${method}${RESET} ${req.originalUrl} ${GRAY}${ms}ms ${user}${RESET}`);
    writeToFile(logFile, `${ts} ${code} ${req.method} ${req.originalUrl} ${ms}ms ${user}`);

    if (code >= 400) {
      writeToFile(errorFile, `${ts} ${code} ${req.method} ${req.originalUrl} ${ms}ms ${user} IP:${req.ip}`);
    }
  });

  next();
};

// Error logger — replaces the generic error handler in server.js
export const errorLogger = (err, req, res, next) => {
  const ts = new Date().toISOString();

  console.error(`\n${RED}${BOLD}[ERROR]${RESET} ${ts} ${req.method} ${req.originalUrl}`);
  console.error(`${RED}${err.message}${RESET}`);
  if (err.stack) console.error(`${GRAY}${err.stack}${RESET}\n`);

  writeToFile(errorFile, [
    `[ERROR] ${ts}`,
    `  Route:   ${req.method} ${req.originalUrl}`,
    `  Message: ${err.message}`,
    `  Stack:   ${err.stack?.split('\n').slice(0, 4).join(' | ')}`,
    `  User:    ${req.user?.email || 'guest'}`,
    `  IP:      ${req.ip}`,
    '---'
  ].join('\n'));

  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
};

// Startup banner
export const logStartup = (port) => {
  const ts = new Date().toISOString();
  console.log(`\n${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}`);
  console.log(`${BOLD}  💧 AquaBill  ${RESET}${GRAY}${ts}${RESET}`);
  console.log(`${CYAN}  Port: ${RESET}${port}  ${CYAN}Env: ${RESET}${process.env.NODE_ENV || 'development'}`);
  console.log(`${CYAN}  Logs: ${RESET}${LOG_DIR}`);
  console.log(`${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n`);
  writeToFile(logFile, `\n=== AquaBill started ${ts} port=${port} ===`);
};

// Aliases so the existing server.js imports keep working
export const errorHandler       = errorLogger;
export const notFoundHandler    = (req, res) => {
  const ts = new Date().toISOString();
  writeToFile(errorFile, `${ts} 404 ${req.method} ${req.originalUrl} [guest] IP:${req.ip}`);
  res.status(404).json({ error: 'Route not found' });
};
export const printStartupBanner = logStartup;

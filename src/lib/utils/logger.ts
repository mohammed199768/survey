type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'log';

const isDev = process.env.NODE_ENV !== 'production';
const isExplicitlyEnabled = process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true';
const logsEnabled = isDev || isExplicitlyEnabled;

const emit = (level: LogLevel, ...args: unknown[]) => {
  if (!logsEnabled || typeof console === 'undefined') return;
  const logFn = console[level] ?? console.log;
  logFn(...args);
};

export const logger = {
  debug: (...args: unknown[]) => emit('debug', ...args),
  info: (...args: unknown[]) => emit('info', ...args),
  warn: (...args: unknown[]) => emit('warn', ...args),
  error: (...args: unknown[]) => emit('error', ...args),
  log: (...args: unknown[]) => emit('log', ...args),
};

export const isLoggerEnabled = () => logsEnabled;


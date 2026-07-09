import { async_store } from './context-store';

const timestamp = () => {
  const now = new Date();
  return now.toISOString().replace('T', ' ').slice(0, 19);
};

const format = (label: string, level: string, message: string, meta: unknown[]) => {
  const request_id = async_store.getStore()?.request_id ?? 'anonymous';
  const suffix = meta.length ? ` ${meta.map(m => typeof m === 'string' ? m : JSON.stringify(m)).join(' ')}` : '';
  return `[${timestamp()}] [${label}] [${level}] [${request_id}]: ${message}${suffix}`;
};

const loggerFor = (label: string) => ({
  info: (message: string, ...meta: unknown[]) => console.log(format(label, 'info', message, meta)),
  warn: (message: string, ...meta: unknown[]) => console.warn(format(label, 'warn', message, meta)),
  error: (message: string, ...meta: unknown[]) => console.error(format(label, 'error', message, meta)),
  http: (message: string, ...meta: unknown[]) => console.log(format(label, 'http', message, meta)),
  debug: (message: string, ...meta: unknown[]) => console.debug(format(label, 'debug', message, meta)),
});

export { loggerFor };

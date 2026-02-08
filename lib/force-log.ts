/**
 * Force-flush logging utility for standalone mode
 *
 * In Node.js standalone mode, stdout is buffered when not connected to a TTY.
 * This utility uses stderr (unbuffered) and explicit flushing to ensure logs appear immediately.
 */

function formatLogMessage(prefix: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ' ' + JSON.stringify(data) : '';
  return `[${timestamp}] ${prefix} ${message}${dataStr}\n`;
}

export function forceLog(prefix: string, message: string, data?: any): void {
  // Use stderr which is unbuffered by default
  process.stderr.write(formatLogMessage(prefix, message, data));

  // Also write to stdout and force flush
  const msg = formatLogMessage(prefix, message, data);
  process.stdout.write(msg);

  // Force stdout flush (if method exists - it's platform-dependent)
  if (typeof (process.stdout as any).flush === 'function') {
    (process.stdout as any).flush();
  }
}

export function forceError(prefix: string, message: string, error?: any): void {
  const errorData = error instanceof Error
    ? { message: error.message, stack: error.stack }
    : error;

  process.stderr.write(formatLogMessage(`${prefix} ❌`, message, errorData));
}

// Convenience exports
export const log = {
  customers: (msg: string, data?: any) => forceLog('[CUSTOMERS]', msg, data),
  reservations: (msg: string, data?: any) => forceLog('[RESERVATIONS]', msg, data),
  demoFiller: (msg: string, data?: any) => forceLog('[DEMO-FILLER]', msg, data),
  resetService: (msg: string, data?: any) => forceLog('[RESET-SERVICE]', msg, data),
};

export const logError = {
  customers: (msg: string, error?: any) => forceError('[CUSTOMERS]', msg, error),
  reservations: (msg: string, error?: any) => forceError('[RESERVATIONS]', msg, error),
  demoFiller: (msg: string, error?: any) => forceError('[DEMO-FILLER]', msg, error),
  resetService: (msg: string, error?: any) => forceError('[RESET-SERVICE]', msg, error),
};

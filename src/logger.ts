class Logger {
  enabled: boolean;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  conditionalLog<T extends unknown[]>(fn: (...args: T) => void, ...args: T): void | ReturnType<typeof fn> {
    if (this.enabled) return fn(...args);
  }

  table(data: unknown) { this.conditionalLog(console.table, data); }
  log(...args: unknown[]) { this.conditionalLog(console.log, ...args); }
  warn(...args: unknown[]) { this.conditionalLog(console.warn, ...args); }
  error(...args: unknown[]) { this.conditionalLog(console.error, ...args); }
}

export const serverLogger = new Logger(false);
export const clientLogger = new Logger(false);
export const feedsLogger = new Logger(false);
export const similLogger = new Logger(false);
export const graphLogger = new Logger(false);
export const similWorkerLogger = new Logger(false);
export const visualGraphLogger = new Logger(false);
export const forceAtlasLogger = new Logger(false);
export const quadTreeLogger = new Logger(false);
export const articlesLogger = new Logger(false);
export const storesLogger = new Logger(false);


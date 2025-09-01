export type Logger = {
  log: (level: string, message: string, meta?: any) => void;
};

export const transports = {
  Console: class {
    constructor(_: any) {}
  },
  File: class {
    constructor(_: any) {}
  },
};

export const format = {
  combine: (..._args: any[]) => ({}),
  timestamp: () => ({}),
  colorize: () => ({}),
  json: () => ({}),
  errors: (_opts?: any) => ({}),
  printf: (_fn: any) => ({}),
};

export function createLogger(_: any): Logger {
  return {
    log: () => {},
  };
}

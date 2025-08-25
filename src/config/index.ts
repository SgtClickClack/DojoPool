// Safe config accessor for environments where process may be undefined (browser)
const readMetaEnv = (key: string): string | undefined => {
  try {
    const meta: any = (import.meta as any);
    if (meta && meta.env && meta.env[key] !== undefined) {
      return String(meta.env[key]);
    }
  } catch {}
  return undefined;
};

const readProcessEnv = (key: string): string | undefined => {
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key] as string;
  }
  return undefined;
};

const getEnv = (keys: string | string[], fallback = ''): string => {
  const list = Array.isArray(keys) ? keys : [keys];
  for (const k of list) {
    const v = readMetaEnv(k);
    if (v !== undefined) return v;
    const pv = readProcessEnv(k);
    if (pv !== undefined) return pv;
  }
  return fallback;
};

export const config = {
  openai: {
    apiKey: getEnv(['OPENAI_API_KEY', 'VITE_OPENAI_API_KEY'], 'test-api-key'),
  },
};

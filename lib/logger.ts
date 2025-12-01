const DEBUG = Boolean(process.env.NEXT_PUBLIC_DEBUG || process.env.DEBUG);
const seen = new Set<string>();

export function debug(message?: unknown, tag?: string) {
  if (!DEBUG) return;
  const payload = typeof message === 'string' ? message : JSON.stringify(message, null, 0);
  if (tag) {
    const key = `${tag}:${payload}`;
    if (seen.has(key)) return;
    seen.add(key);
  }
  // eslint-disable-next-line no-console
  console.debug('[debug]', payload);
}

export function warn(...args: unknown[]) {
  if (!DEBUG) return;
   
  console.warn('[warn]', ...args);
}

export function error(...args: unknown[]) {
  // always log errors
   
  console.error('[error]', ...args);
}

export function resetDedup() {
  seen.clear();
}


// Limitador simples em memória (adequado para um único servidor).
type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();
export const WINDOW_MS = 15 * 60 * 1000;

export function isBlocked(key: string, max: number, now = Date.now()) {
  const e = store.get(key);
  if (!e) return false;
  if (e.resetAt <= now) { store.delete(key); return false; }
  return e.count >= max;
}
export function registerFailure(key: string, now = Date.now()) {
  const e = store.get(key);
  if (!e || e.resetAt <= now) store.set(key, { count: 1, resetAt: now + WINDOW_MS });
  else e.count++;
}
export const clearFailures = (key: string) => void store.delete(key);
export const resetAllLimits = () => store.clear();

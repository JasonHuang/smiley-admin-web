export type AdminSession = {
  openid: string;
  loginAt: number; // ms timestamp
  expiresAt: number; // ms timestamp
};

const KEY = 'ADMIN_SESSION';
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.openid) return null;
    return obj;
  } catch {
    return null;
  }
}

export function isAdminLoggedIn(): boolean {
  const s = getAdminSession();
  if (!s) return false;
  const now = Date.now();
  return now < s.expiresAt;
}

export function setAdminSession(openid: string, ttlMs: number = DEFAULT_TTL_MS) {
  const now = Date.now();
  const sess: AdminSession = {
    openid,
    loginAt: now,
    expiresAt: now + ttlMs,
  };
  localStorage.setItem(KEY, JSON.stringify(sess));
}

export function clearAdminSession() {
  localStorage.removeItem(KEY);
}
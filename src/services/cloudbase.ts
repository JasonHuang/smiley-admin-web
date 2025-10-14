// 按需引入内核与功能模块，避免宿主环境注入导致的初始化冲突
import cloudbase from '@cloudbase/js-sdk/app';
import '@cloudbase/js-sdk/auth';
import '@cloudbase/js-sdk/database';
import '@cloudbase/js-sdk/storage';
import '@cloudbase/js-sdk/functions';

const envId = import.meta.env.VITE_TCB_ENV_ID as string;

// 在 CloudBase Hosting 上会自动注入环境；本地/非托管环境需显式传 env
const isHosting = typeof window !== 'undefined' && (
  /\.tcb\.qcloud\.la$/.test(window.location.hostname) ||
  /\.tcloudbase\.com$/.test(window.location.hostname)
);

export const app = cloudbase.init(isHosting ? {} : { env: envId });
export const auth = app.auth({ persistence: 'local' });
export const db = app.database();

const host = typeof window !== 'undefined' ? window.location.hostname : 'n/a';
console.info('[CloudBase] init', { envId, isHosting, host });

// 运行时校验：本地/非托管环境必须提供 envId，否则可能导致后续 API 报 "invalid params"
if (!isHosting && (!envId || String(envId).trim() === '')) {
  // 使用 console.error 提示开发者在 .env.local 中设置 VITE_TCB_ENV_ID
  console.error('[CloudBase] Missing VITE_TCB_ENV_ID for local env. Please set VITE_TCB_ENV_ID in smiley-admin-web/.env.local');
}

export async function ensureLogin() {
  // 本地/非托管环境必须配置 envId，否则后续调用会出现 INVALID_PARAMS
  if (!isHosting && (!envId || String(envId).trim() === '')) {
    console.error('[CloudBase] envId missing, abort login');
    throw new Error('CloudBase 环境未配置：请在 smiley-admin-web/.env.local 设置 VITE_TCB_ENV_ID');
  }
  const hasLogin = await auth.hasLoginState();
  console.debug('[Auth] hasLoginState', hasLogin);
  if (!hasLogin) {
    try {
      console.info('[Auth] trying anonymous signIn');
      const anyAuth: any = auth as any;
      if (typeof anyAuth.anonymousAuthProvider === 'function') {
        const provider = anyAuth.anonymousAuthProvider();
        await provider.signIn();
        console.info('[Auth] anonymous signIn success (provider)');
      } else if (typeof anyAuth.signInAnonymously === 'function') {
        console.info('[Auth] signInAnonymously fallback');
        await anyAuth.signInAnonymously();
        console.info('[Auth] anonymous signIn success (direct)');
      } else {
        console.error('[Auth] anonymous login API not available on auth');
        throw new Error('Anonymous login API not available');
      }
      const ok = await auth.hasLoginState();
      console.debug('[Auth] hasLoginState after signIn', ok);
      return true;
    } catch (e) {
      console.error('[Auth] anonymous signIn failed', e);
      return false;
    }
  }
  return true;
}
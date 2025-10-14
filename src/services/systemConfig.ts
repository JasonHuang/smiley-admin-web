import { app, db, ensureLogin } from './cloudbase';

function normalize(val: any): string | null {
  if (val == null) return null;
  const s = typeof val === 'string' ? val : String(val);
  return s.trim();
}

export async function getAdminVerifyCode(): Promise<string | null> {
  await ensureLogin();
  // 优先通过云函数读取，避免数据库权限限制导致读取失败
  try {
    const fnRes: any = await app.callFunction({ name: 'systemConfig', data: { action: 'get', data: { key: 'adminVerifyCode' } } });
    const success = fnRes?.result?.success;
    const valueFromFn = fnRes?.result?.data?.value;
    if (success && valueFromFn != null) {
      return normalize(valueFromFn);
    }
  } catch (e) {
    console.warn('[SystemConfig] systemConfig.get via function failed, will fallback to direct DB', e);
  }
  // 回退为直接读取数据库集合
  try {
    const res: any = await db.collection('system_config').where({ key: 'adminVerifyCode' }).limit(1).get();
    const doc = Array.isArray(res?.data) ? res.data[0] : null;
    const val = doc?.value ?? null;
    return normalize(val);
  } catch (e) {
    console.error('[SystemConfig] getAdminVerifyCode fallback DB error', e);
    return null;
  }
}

export async function validateAdminPassword(input: string): Promise<boolean> {
  const current = await getAdminVerifyCode();
  if (!current) return false;
  return normalize(input) === current;
}

// 读取所有系统配置，并转换为 key-value 形式
export async function getAllSystemConfigs(): Promise<Record<string, any>> {
  await ensureLogin();
  try {
    const fnRes: any = await app.callFunction({ name: 'systemConfig', data: { action: 'getAll' } });
    const ok = fnRes?.result?.success;
    const arr: any[] = fnRes?.result?.data || [];
    if (!ok) throw new Error('getAll 失败');
    const map: Record<string, any> = {};
    arr.forEach((d) => { if (d?.key != null) map[d.key] = d.value; });
    return map;
  } catch (e) {
    console.warn('[SystemConfig] getAll via function failed, fallback to DB', e);
    try {
      const res: any = await db.collection('system_config').get();
      const map: Record<string, any> = {};
      (res?.data || []).forEach((d: any) => { if (d?.key != null) map[d.key] = d.value; });
      return map;
    } catch (ee) {
      console.error('[SystemConfig] getAll fallback DB error', ee);
      return {};
    }
  }
}

// 保存单个系统配置项
export async function saveSystemConfig(key: string, value: any, description?: string): Promise<boolean> {
  await ensureLogin();
  try {
    const fnRes: any = await app.callFunction({ name: 'systemConfig', data: { action: 'set', data: { key, value, description } } });
    return !!fnRes?.result?.success;
  } catch (e) {
    console.error('[SystemConfig] saveSystemConfig failed', e);
    return false;
  }
}
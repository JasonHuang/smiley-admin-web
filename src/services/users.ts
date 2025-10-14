import { db, ensureLogin } from './cloudbase';

export type User = {
  id?: string;
  openid: string;
  nickName?: string;
  avatarUrl?: string;
  isAdmin?: boolean;
  createTime?: any;
};

export async function listUsers(page = 1, pageSize = 20, keyword = ''): Promise<{ list: User[]; total: number; page: number; pageSize: number; }> {
  await ensureLogin();
  const skip = (page - 1) * pageSize;
  const where: any = keyword
    ? { nickName: db.RegExp({ regexp: keyword, options: 'i' }) }
    : {};
  const [listRes, countRes]: any = await Promise.all([
    db.collection('users').where(where).orderBy('createTime', 'desc').skip(skip).limit(pageSize).get(),
    db.collection('users').where(where).count(),
  ]);
  const list = (listRes?.data || []).map((u: any) => ({ id: u._id, openid: u.openid, nickName: u.nickName, avatarUrl: u.avatarUrl, isAdmin: !!u.isAdmin }));
  return { list, total: countRes?.total || 0, page, pageSize };
}

export async function setAdmin(openid: string, isAdmin = true) {
  await ensureLogin();
  const res: any = await db.collection('users').where({ openid }).update({ isAdmin });
  const updated = res?.stats?.updated || 0;
  if (updated === 0) throw new Error('未找到该用户或更新失败');
  return '已更新管理员权限';
}
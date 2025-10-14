import { app, ensureLogin } from './cloudbase';

export type Tag = {
  id: string;
  name: string;
  description?: string;
  usageCount?: number;
  createTime?: any;
  updateTime?: any;
};

async function callTagFn(data: any) {
  await ensureLogin();
  const res: any = await app.callFunction({ name: 'tagManager', data });
  const result = res?.result;
  if (!result?.success) {
    throw new Error(result?.message || '标签云函数调用失败');
  }
  return result;
}

export async function listTags(page = 1, pageSize = 20, keyword = ''): Promise<{ list: Tag[]; total: number; page: number; pageSize: number; }> {
  const r = await callTagFn({ action: 'list', page, pageSize, keyword });
  const list = (r?.data?.list || []).map((t: any) => ({ id: t._id || t.id, name: t.name, description: t.description, usageCount: t.usageCount }));
  return { list, total: r?.data?.total || 0, page, pageSize };
}

export async function createTag(payload: { name: string; description?: string; }) {
  const r = await callTagFn({ action: 'create', tagData: payload });
  return r?.data;
}

export async function updateTag(tagId: string, payload: { name: string; description?: string; }) {
  const r = await callTagFn({ action: 'update', tagId, tagData: payload });
  return r?.message || '更新成功';
}

export async function deleteTag(tagId: string) {
  const r = await callTagFn({ action: 'delete', tagId });
  return r?.message || '删除成功';
}
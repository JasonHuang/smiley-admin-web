import { app, ensureLogin } from './cloudbase';

export type Category = {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sort?: number;
  isActive?: boolean;
  productCount?: number;
};

async function callCatFn(data: any) {
  await ensureLogin();
  const res: any = await app.callFunction({ name: 'categoryManager', data });
  const result = res?.result;
  if (!result?.success) throw new Error(result?.message || '分类云函数调用失败');
  return result;
}

export async function listCategories(page = 1, pageSize = 20, keyword = ''): Promise<{ list: Category[]; total: number; page: number; pageSize: number; }> {
  const r = await callCatFn({ action: 'list', page, pageSize, keyword });
  const list = (r?.data?.list || []).map((c: any) => ({ id: c._id || c.id, name: c.name, description: c.description, icon: c.icon, sort: c.sort, isActive: c.isActive, productCount: c.productCount }));
  return { list, total: r?.data?.total || 0, page, pageSize };
}

export async function toggleCategoryStatus(categoryId: string, isActive: boolean) {
  const r = await callCatFn({ action: 'toggleStatus', categoryId, isActive });
  return r?.message || '状态已更新';
}

export async function createCategory(categoryData: { name: string; description?: string; icon?: string; sort?: number; isActive?: boolean; }) {
  const r = await callCatFn({ action: 'create', categoryData });
  return r?.data;
}

export async function updateCategory(categoryId: string, categoryData: { name: string; description?: string; icon?: string; sort?: number; isActive?: boolean; }) {
  const r = await callCatFn({ action: 'update', categoryId, categoryData });
  return r?.message || '更新成功';
}

export async function deleteCategory(categoryId: string) {
  const r = await callCatFn({ action: 'delete', categoryId });
  return r?.message || '删除成功';
}
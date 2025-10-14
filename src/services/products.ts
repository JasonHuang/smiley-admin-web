import { app, ensureLogin } from './cloudbase';

export type Product = {
  spuId: string;
  title: string;
  price?: number;
  originPrice?: number;
  isPutOnSale?: number;
  available?: number;
  primaryImage?: string;
  images?: string[];
};

type ListParams = {
  pageNum?: number;
  pageSize?: number;
  sort?: number;
  categoryId?: string | null;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number | null;
  includeUnavailable?: boolean;
  status?: 'all' | 'on' | 'off' | 'unavailable';
};

async function callProductFn(data: any) {
  await ensureLogin();
  const res: any = await app.callFunction({ name: 'productManager', data });
  const result = res?.result;
  if (!result?.success) throw new Error(result?.message || '商品云函数调用失败');
  return result;
}

export async function listProducts(params: ListParams = {}): Promise<{ list: Product[]; total: number; }> {
  const {
    pageNum = 1,
    pageSize = 20,
    sort = 0,
    categoryId = null,
    keyword = '',
    minPrice = 0,
    maxPrice = null,
    includeUnavailable = false,
    status = undefined,
  } = params;
  const r = await callProductFn({ action: 'list', pageNum, pageSize, sort, categoryId, keyword, minPrice, maxPrice, includeUnavailable, status });
  const list = (r?.data?.spuList || []).map((p: any) => ({
    spuId: String(p.spuId),
    title: p.title,
    price: Number(p.price ?? p.minSalePrice ?? 0),
    originPrice: Number(p.originPrice ?? p.minLinePrice ?? 0),
    isPutOnSale: Number(p.isPutOnSale ?? 0),
    available: Number(p.available ?? 0),
    primaryImage: p.primaryImage || (Array.isArray(p.images) ? p.images[0] : ''),
    images: Array.isArray(p.images) ? p.images : [],
  }));
  return { list, total: r?.data?.totalCount || 0 };
}

export async function deleteProduct(spuId: string) {
  const r = await callProductFn({ action: 'delete', spuId });
  return r?.message || '删除成功';
}

export async function getProduct(spuId: string) {
  const r = await callProductFn({ action: 'get', spuId });
  return r?.data;
}

// 发布/编辑商品（调用 saveProduct 云函数）
async function callSaveProduct(action: 'create' | 'update' | 'delete' | 'get' | 'list', productData: any) {
  await ensureLogin();
  const res: any = await app.callFunction({ name: 'saveProduct', data: { action, productData } });
  const result = res?.result;
  if (!result?.success) throw new Error(result?.error || '保存商品云函数调用失败');
  return result;
}

export async function createProduct(productData: any) {
  const r = await callSaveProduct('create', productData);
  return r?.data;
}

export async function updateProduct(productData: any) {
  const r = await callSaveProduct('update', productData);
  return r?.data;
}

export async function saveProduct(productData: any) {
  if (productData?.spuId) return updateProduct(productData);
  return createProduct(productData);
}
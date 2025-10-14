import { useEffect, useState } from 'react';
import { Card, Button, Table, Dialog, Input, MessagePlugin, Select, Textarea } from 'tdesign-react';
import { listProducts, deleteProduct, getProduct, saveProduct } from '../services/products';
import { app } from '../services/cloudbase';
import type { Product } from '../services/products';
import ImageUploader from '../components/ImageUploader';
import { listCategories } from '../services/categories';
import { listTags } from '../services/tags';

export default function Products() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'on' | 'off' | 'unavailable'>('all');
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState({ title: '', price: '', originalPrice: '', stock: '', images: [] as string[], isPutOnSale: false, available: true, categoryId: '', tagIds: [] as string[], detail: '', detailImages: [] as string[] });
  const [urlMap, setUrlMap] = useState<Record<string, string>>({});
  const [categoryOptions, setCategoryOptions] = useState<{ label: string; value: string; }[]>([]);
  const [tagOptions, setTagOptions] = useState<{ label: string; value: string; }[]>([]);
  

  

  const columns = [
    {
      colKey: 'primaryImage',
      title: '主图',
      cell: ({ row }: any) => {
        const raw = row.primaryImage || (Array.isArray(row.images) ? row.images[0] : '');
        const src = typeof raw === 'string' && raw.startsWith('cloud://') ? (urlMap[raw] || '') : raw;
        return src ? <img src={src} alt="thumb" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 4 }} /> : '-';
      },
    },
    { colKey: 'title', title: '商品名' },
    { colKey: 'price', title: '价格' },
    { colKey: 'isPutOnSale', title: '上架', cell: ({ row }: any) => (row.isPutOnSale ? '是' : '否') },
    { colKey: 'available', title: '可售', cell: ({ row }: any) => (row.available ? '是' : '否') },
    {
      colKey: 'op', title: '操作', cell: ({ row }: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" onClick={() => onEdit(row)}>编辑</Button>
          <Button size="small" theme="danger" onClick={() => onDelete(row)}>删除</Button>
        </div>
      )
    },
  ];

  async function fetch(page = 1) {
    setLoading(true);
    try {
      // 在售（on）时不包含不可售，其他状态保持原有逻辑
      const includeUnavailable = statusFilter === 'all';
      const res = await listProducts({ pageNum: page, pageSize: pagination.pageSize, keyword, includeUnavailable, status: statusFilter });
      setData(res.list);
      // 转换 cloud:// 文件ID 为临时可访问 URL（浏览器无法直接加载 cloud://）
      const ids = new Set<string>();
      res.list.forEach((p) => {
        const pi = p.primaryImage;
        if (typeof pi === 'string' && pi.startsWith('cloud://')) ids.add(pi);
        (p.images || []).forEach((i) => { if (typeof i === 'string' && i.startsWith('cloud://')) ids.add(i); });
      });
      if (ids.size > 0) {
        try {
          const temp: any = await app.getTempFileURL({ fileList: Array.from(ids) });
          const map: Record<string, string> = {};
          (temp?.fileList || []).forEach((f: any) => {
            if (f?.fileID && f?.tempFileURL) map[f.fileID] = f.tempFileURL;
          });
          setUrlMap((prev) => ({ ...prev, ...map }));
        } catch (e) {
          // 忽略转换失败，保持原始值
        }
      }
      setPagination((p) => ({ ...p, current: page, total: res.total }));
    } catch (e: any) {
      MessagePlugin.error(e?.message || '读取商品失败');
    } finally {
      setLoading(false);
    }
  }

  function onCreate() {
    setEditing(null);
    setForm({ title: '', price: '', originalPrice: '', stock: '', images: [], isPutOnSale: true, available: true, categoryId: '', tagIds: [], detail: '', detailImages: [] });
    setVisible(true);
  }

  async function onEdit(row: Product) {
    try {
      const full = await getProduct(row.spuId);
      setEditing(full);
      setForm({
        title: full?.title || row.title || '',
        price: String(full?.price ?? row.price ?? ''),
        originalPrice: String(full?.originalPrice ?? row.originPrice ?? ''),
        stock: String(full?.stock ?? full?.stockQuantity ?? ''),
        images: Array.isArray(full?.images) ? full.images : Array.isArray(row?.images) ? row.images as any : [],
        isPutOnSale: Boolean(full?.isPutOnSale ?? row.isPutOnSale ?? 1),
        available: Boolean(full?.available ?? row.available ?? 1),
        categoryId: Array.isArray(full?.categoryIds) && full.categoryIds.length > 0 ? String(full.categoryIds[0]) : (typeof full?.categoryId !== 'undefined' && full?.categoryId !== null ? String(full.categoryId) : ''),
        tagIds: Array.isArray(full?.tags) ? full.tags.map((x: any) => String(x)) : (Array.isArray(full?.tagIds) ? full.tagIds.map((x: any) => String(x)) : []),
        // 文本描述仅保留 description（与小程序一致）
        detail: String(full?.description ?? ''),
        // 详情图片使用 desc（数组）或 descriptionImages（数组），与小程序读取逻辑一致
        detailImages: Array.isArray(full?.desc) ? (full?.desc as any) : (Array.isArray((full as any)?.descriptionImages) ? ((full as any).descriptionImages as any) : []),
      });
      setVisible(true);
    } catch {
      // 回退到行数据
      setEditing(row);
      setForm({
        title: row.title || '',
        price: String(row.price ?? ''),
        originalPrice: String(row.originPrice ?? ''),
        stock: '',
        images: Array.isArray(row.images) ? (row.images as any) : [],
        isPutOnSale: Boolean(row.isPutOnSale ?? 1),
        available: Boolean(row.available ?? 1),
        categoryId: Array.isArray((row as any)?.categoryIds) && (row as any).categoryIds.length > 0 ? String((row as any).categoryIds[0]) : (typeof (row as any)?.categoryId !== 'undefined' && (row as any)?.categoryId !== null ? String((row as any).categoryId) : ''),
        tagIds: Array.isArray((row as any)?.tags) ? (row as any).tags.map((x: any) => String(x)) : (Array.isArray((row as any)?.tagIds) ? (row as any).tagIds.map((x: any) => String(x)) : []),
        // 文本描述仅保留 description
        detail: String((row as any)?.description ?? ''),
        // 详情图片兼容行数据里的 desc 或 descriptionImages
        detailImages: Array.isArray((row as any)?.desc) ? ((row as any).desc as any) : (Array.isArray((row as any)?.descriptionImages) ? ((row as any).descriptionImages as any) : []),
      });
      setVisible(true);
    }
  }

  async function onDelete(row: Product) {
    if (!window.confirm(`确认删除商品「${row.title}」？`)) return;
    try {
      await deleteProduct(row.spuId);
      MessagePlugin.success('删除成功');
      fetch(pagination.current);
    } catch (e: any) {
      MessagePlugin.error(e?.message || '删除失败');
    }
  }

  useEffect(() => { fetch(1); }, []);
  // 切换状态筛选时，自动刷新列表
  useEffect(() => { fetch(1); }, [statusFilter]);
  // 打开弹窗时加载分类与标签选项
  useEffect(() => {
    (async () => {
      if (!visible) return;
      try {
        const [catRes, tagRes] = await Promise.all([
          listCategories(1, 200),
          listTags(1, 200, ''),
        ]);
        setCategoryOptions((catRes.list || []).map((c: any) => ({ label: c.name, value: c.id })));
        setTagOptions((tagRes.list || []).map((t: any) => ({ label: t.name, value: t.id })));
      } catch (e) {
        // 忽略加载失败
      }
    })();
  }, [visible]);

  return (
    <Card title="商品管理" bordered>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {/* 状态筛选标签 */}
        {[
          { key: 'all', label: '全部商品' },
          { key: 'on', label: '在售商品' },
          { key: 'off', label: '下架商品' },
          { key: 'unavailable', label: '不可售商品' },
        ].map((opt: any) => (
          <Button
            key={opt.key}
            variant={statusFilter === opt.key ? 'base' : 'outline'}
            theme={statusFilter === opt.key ? 'primary' : undefined}
            onClick={() => setStatusFilter(opt.key)}
          >{opt.label}</Button>
        ))}

        <Input placeholder="搜索商品名" value={keyword} onChange={(v) => setKeyword(typeof v === 'string' ? v : String((v as any)?.target?.value ?? ''))} style={{ width: 240 }} />
        <Button onClick={() => fetch(1)}>搜索</Button>
        <Button variant="outline" onClick={() => { setKeyword(''); fetch(1); }}>重置</Button>
        <div style={{ flex: 1 }} />
        <Button theme="primary" onClick={onCreate}>新增商品</Button>
        <Button variant="outline" onClick={() => fetch(pagination.current)}>刷新</Button>
      </div>
      <Table 
        columns={columns as any} 
        data={data} 
        rowKey="spuId" 
        loading={loading}
        pagination={{ current: pagination.current, pageSize: pagination.pageSize, total: pagination.total }}
        onPageChange={({ current }) => fetch(current)}
      />

      <Dialog
        header={editing ? '编辑商品' : '新增商品'}
        visible={visible}
        onClose={() => setVisible(false)}
        width="60vw"
        style={{ maxWidth: '90vw' }}
        onConfirm={async () => {
          try {
            const payload: any = {
              title: (form.title || '').trim(),
              price: Number(form.price || 0),
              originalPrice: Number(form.originalPrice || form.price || 0),
              stock: Number(form.stock || 0),
              primaryImage: Array.isArray(form.images) && form.images.length > 0 ? form.images[0] : '',
              images: Array.isArray(form.images) ? form.images : [],
              isPutOnSale: form.isPutOnSale ? 1 : 0,
              available: form.available ? 1 : 0,
              // 后端期望字段对齐
              categoryIds: (form.categoryId || '').trim() ? [String((form.categoryId || '').trim())] : [],
              tags: Array.isArray(form.tagIds) ? form.tagIds.map(String) : [],
              // 仅保留一个详情文本字段：description
              description: (form.detail || '').trim(),
              // 详情图片统一为 descriptionImages（与小程序管理端命名一致）
              descriptionImages: Array.isArray(form.detailImages) ? form.detailImages : [],
            };
            if (!payload.title) { MessagePlugin.warning('请输入商品名'); return; }
            if (editing?.spuId) payload.spuId = editing.spuId;
            await saveProduct(payload);
            MessagePlugin.success(editing ? '更新成功' : '创建成功');
            setVisible(false);
            fetch(pagination.current);
          } catch (e: any) {
            MessagePlugin.error(e?.message || '提交失败');
          }
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>商品名</div>
            <Input value={form.title} onChange={(v) => setForm({ ...form, title: typeof v === 'string' ? v : String((v as any)?.target?.value ?? '') })} />
          </div>
          {/* 分类、标签、价格并排一行 */}
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>分类</div>
              <Select
                value={form.categoryId}
                onChange={(v: any) => setForm({ ...form, categoryId: typeof v === 'string' ? v : String(v) })}
                options={categoryOptions}
                placeholder="请选择分类"
                clearable
              />
            </div>
            <div>
              <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>标签（可多选）</div>
              <Select
                value={form.tagIds}
                multiple
                onChange={(v: any) => setForm({ ...form, tagIds: Array.isArray(v) ? v.map(String) : [] })}
                options={tagOptions}
                placeholder="请选择标签"
                clearable
              />
            </div>
            <div>
              <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>价格（元）</div>
              <Input value={form.price} onChange={(v) => setForm({ ...form, price: typeof v === 'string' ? v : String((v as any)?.target?.value ?? '') })} />
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>原价（元）</div>
            <Input value={form.originalPrice} onChange={(v) => setForm({ ...form, originalPrice: typeof v === 'string' ? v : String((v as any)?.target?.value ?? '') })} />
          </div>
          <div>
            <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>库存</div>
            <Input value={form.stock} onChange={(v) => setForm({ ...form, stock: typeof v === 'string' ? v : String((v as any)?.target?.value ?? '') })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>商品图片（第一张为主图）</div>
            <ImageUploader
              value={form.images}
              onChange={(next) => setForm({ ...form, images: next })}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>详情描述</div>
            <Textarea
              value={form.detail}
              onChange={(v: any) => setForm({ ...form, detail: typeof v === 'string' ? v : String(v) })}
              placeholder="请输入商品详情描述"
              autosize={{ minRows: 3, maxRows: 8 }}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>
              <span>详情图片</span>
              <Button
                size="small"
                variant="outline"
                onClick={() => {
                  const merged = Array.from(new Set([...(Array.isArray(form.detailImages) ? form.detailImages : []), ...(Array.isArray(form.images) ? form.images : [])]));
                  setForm({ ...form, detailImages: merged });
                }}
              >导入商品图片</Button>
            </div>
            <ImageUploader
              value={form.detailImages}
              onChange={(next) => setForm({ ...form, detailImages: next })}
            />
          </div>
          <div style={{ display: 'flex', gap: 16, gridColumn: '1 / -1' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.isPutOnSale} onChange={(e) => setForm({ ...form, isPutOnSale: e.target.checked })} /> 上架
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /> 可售
            </label>
          </div>
        </div>
      </Dialog>
    </Card>
  );
}
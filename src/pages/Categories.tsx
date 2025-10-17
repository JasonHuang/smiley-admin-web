import { useEffect, useState } from 'react';
import { Card, Button, Table, Switch, MessagePlugin, Input, Dialog } from 'tdesign-react';
import { listCategories, toggleCategoryStatus, deleteCategory, createCategory } from '../services/categories';
import type { Category } from '../services/categories';

export default function Categories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  // 新增分类弹窗状态
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sort, setSort] = useState<number | ''>('');
  const [isActiveCreating, setIsActiveCreating] = useState<boolean>(true);

  const columns = [
    { colKey: 'name', title: '分类名' },
    { colKey: 'description', title: '描述' },
    { colKey: 'productCount', title: '商品数' },
    {
      colKey: 'isActive', title: '启用', cell: ({ row }: any) => (
        <Switch size="small" value={!!row.isActive} onChange={(val: boolean) => onToggle(row, val)} />
      )
    },
    {
      colKey: 'op', title: '操作', cell: ({ row }: any) => (
        <Button size="small" theme="danger" onClick={() => onDelete(row)}>删除</Button>
      )
    }
  ];

  async function fetch() {
    setLoading(true);
    try {
      const res = await listCategories(1, 100);
      setData(res.list);
    } catch (e: any) {
      MessagePlugin.error(e?.message || '读取分类失败');
    } finally {
      setLoading(false);
    }
  }

  async function onToggle(row: Category, val: boolean) {
    try {
      await toggleCategoryStatus(row.id, val);
      MessagePlugin.success(`分类已${val ? '启用' : '禁用'}`);
      fetch();
    } catch (e: any) {
      MessagePlugin.error(e?.message || '切换状态失败');
    }
  }

  async function onDelete(row: Category) {
    if (!window.confirm(`确认删除分类「${row.name}」？`)) return;
    try {
      await deleteCategory(row.id);
      MessagePlugin.success('删除成功');
      fetch();
    } catch (e: any) {
      MessagePlugin.error(e?.message || '删除失败');
    }
  }

  function onCreate() {
    setVisible(true);
    setName('');
    setDescription('');
    setSort('');
    setIsActiveCreating(true);
  }

  async function onSubmit() {
    try {
      const trimmedName = (name || '').trim();
      if (!trimmedName) {
        MessagePlugin.warning('请输入分类名');
        return;
      }
      await createCategory({
        name: trimmedName,
        description,
        sort: typeof sort === 'number' ? sort : undefined,
        isActive: isActiveCreating,
      });
      MessagePlugin.success('创建成功');
      setVisible(false);
      fetch();
    } catch (e: any) {
      MessagePlugin.error(e?.message || '提交失败');
    }
  }

  useEffect(() => { fetch(); }, []);

  return (
    <Card title="分类管理" bordered>
      <div style={{ marginBottom: 12 }}>
        <Button theme="primary" onClick={onCreate}>新增分类</Button>
        <Button variant="outline" style={{ marginLeft: 8 }} onClick={fetch}>刷新</Button>
      </div>
      <Table columns={columns as any} data={data} rowKey="id" loading={loading} />

      <Dialog
        header="新增分类"
        visible={visible}
        onClose={() => setVisible(false)}
        onConfirm={onSubmit}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>分类名</div>
            <Input
              value={name}
              onChange={(v) => setName(typeof v === 'string' ? v : String((v as any)?.target?.value ?? ''))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>描述</div>
            <Input
              value={description}
              onChange={(v) => setDescription(typeof v === 'string' ? v : String((v as any)?.target?.value ?? ''))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>排序（可选）</div>
            <Input
              type="number"
              value={typeof sort === 'number' ? String(sort) : ''}
              onChange={(v) => {
                const s = typeof v === 'string' ? v : String((v as any)?.target?.value ?? '');
                const n = Number(s);
                setSort(Number.isFinite(n) ? n : '');
              }}
              placeholder="数值越小越靠前"
            />
          </div>
          <div>
            <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>启用</div>
            <Switch size="small" value={isActiveCreating} onChange={setIsActiveCreating} />
          </div>
        </div>
      </Dialog>
    </Card>
  );
}
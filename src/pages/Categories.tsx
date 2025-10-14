import { useEffect, useState } from 'react';
import { Card, Button, Table, Switch, MessagePlugin } from 'tdesign-react';
import { listCategories, toggleCategoryStatus, deleteCategory } from '../services/categories';
import type { Category } from '../services/categories';

export default function Categories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

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

  useEffect(() => { fetch(); }, []);

  return (
    <Card title="分类管理" bordered>
      <div style={{ marginBottom: 12 }}>
        <Button theme="primary" disabled>新增分类（稍后）</Button>
        <Button variant="outline" style={{ marginLeft: 8 }} onClick={fetch}>刷新</Button>
      </div>
      <Table columns={columns as any} data={data} rowKey="id" loading={loading} />
    </Card>
  );
}
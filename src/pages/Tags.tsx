import { useEffect, useState } from 'react';
import { Card, Button, Table, Input, Dialog, MessagePlugin } from 'tdesign-react';
import { listTags, createTag, updateTag, deleteTag } from '../services/tags';
import type { Tag } from '../services/tags';

export default function Tags() {
  const [data, setData] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const columns = [
    { colKey: 'name', title: '标签名' },
    { colKey: 'usageCount', title: '使用数' },
    {
      colKey: 'op',
      title: '操作',
      cell: ({ row }: any) => (
        <div style={{ display: 'flex', gap: 8 }}>
          <Button size="small" onClick={() => onEdit(row)}>编辑</Button>
          <Button size="small" theme="danger" onClick={() => onDelete(row)}>删除</Button>
        </div>
      ),
    },
  ];

  async function fetch() {
    setLoading(true);
    try {
      const res = await listTags(1, 50);
      setData(res.list);
    } catch (e: any) {
      MessagePlugin.error(e?.message || '读取标签失败');
    } finally {
      setLoading(false);
    }
  }

  function onCreate() {
    setEditing(null);
    setName('');
    setDescription('');
    setVisible(true);
  }

  function onEdit(row: Tag) {
    setEditing(row);
    setName(row.name || '');
    setDescription(row.description || '');
    setVisible(true);
  }

  async function onDelete(row: Tag) {
    if (!row?.id) return;
    if (!window.confirm(`确认删除标签「${row.name}」？`)) return;
    try {
      await deleteTag(row.id);
      MessagePlugin.success('删除成功');
      fetch();
    } catch (e: any) {
      MessagePlugin.error(e?.message || '删除失败');
    }
  }

  async function onSubmit() {
    try {
      const trimmedName = (name || '').trim();
      if (!trimmedName) {
        MessagePlugin.warning('请输入标签名');
        return;
      }
      if (editing) {
        await updateTag(editing.id, { name: trimmedName, description });
        MessagePlugin.success('更新成功');
      } else {
        await createTag({ name: trimmedName, description });
        MessagePlugin.success('创建成功');
      }
      setVisible(false);
      fetch();
    } catch (e: any) {
      MessagePlugin.error(e?.message || '提交失败');
    }
  }

  useEffect(() => { fetch(); }, []);

  return (
    <Card title="标签管理" bordered>
      <div style={{ marginBottom: 12 }}>
        <Button theme="primary" onClick={onCreate}>新增标签</Button>
        <Button variant="outline" style={{ marginLeft: 8 }} onClick={fetch}>刷新</Button>
      </div>
      <Table columns={columns as any} data={data} rowKey="id" loading={loading} />

      <Dialog
        header={editing ? '编辑标签' : '新增标签'}
        visible={visible}
        onClose={() => setVisible(false)}
        onConfirm={onSubmit}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <div style={{ marginBottom: 6, color: 'var(--td-text-color-secondary)' }}>标签名</div>
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
        </div>
      </Dialog>
    </Card>
  );
}
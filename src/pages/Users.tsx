import { useEffect, useState } from 'react';
import { Card, Button, Table, MessagePlugin } from 'tdesign-react';
import { listUsers, setAdmin } from '../services/users';
import type { User } from '../services/users';

export default function Users() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const columns = [
    { colKey: 'nickName', title: '昵称' },
    { colKey: 'openid', title: 'OpenID' },
    { colKey: 'isAdmin', title: '管理员', cell: ({ row }: any) => (row.isAdmin ? '是' : '否') },
    { colKey: 'op', title: '操作', cell: ({ row }: any) => (<Button size="small" onClick={() => onSetAdmin(row)} disabled={row.isAdmin}>设为管理员</Button>) },
  ];

  async function fetch() {
    setLoading(true);
    try {
      const res = await listUsers(1, 100);
      setData(res.list);
    } catch (e: any) {
      MessagePlugin.error(e?.message || '读取用户失败');
    } finally {
      setLoading(false);
    }
  }

  async function onSetAdmin(row: User) {
    if (!window.confirm(`确认将用户「${row.nickName || row.openid}」设为管理员？`)) return;
    try {
      await setAdmin(row.openid, true);
      MessagePlugin.success('已设为管理员');
      fetch();
    } catch (e: any) {
      MessagePlugin.error(e?.message || '操作失败');
    }
  }

  useEffect(() => { fetch(); }, []);

  return (
    <Card title="用户管理" bordered>
      <Table columns={columns as any} data={data} rowKey="id" loading={loading} />
    </Card>
  );
}
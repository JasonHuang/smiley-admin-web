import { useEffect, useState } from 'react';
import { Button, Card, Space, Input, MessagePlugin } from 'tdesign-react';
import { ensureLogin } from '../services/cloudbase';
import { setAdminSession } from '../services/adminSession';
import { validateAdminPassword } from '../services/systemConfig';

export default function Login() {
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      await ensureLogin();
    })();
  }, []);

  async function handleLogin() {
    if (!password) {
      MessagePlugin.warning('请输入后台密码');
      return;
    }
    setLoading(true);
    try {
      const ok = await validateAdminPassword(password);
      if (ok) {
        setAdminSession('web_admin');
        MessagePlugin.success('登录成功');
        window.location.reload();
      } else {
        MessagePlugin.error('密码错误');
      }
    } catch (e: any) {
      MessagePlugin.error(e?.message || '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh', padding: 24 }}>
      <Card style={{ width: 420 }} bordered>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <h3 style={{ margin: 0 }}>管理员登录</h3>
          <Input type="password" value={password} onChange={setPassword} placeholder="请输入后台密码" />
          <Button theme="primary" loading={loading} onClick={handleLogin}>登录</Button>
        </Space>
      </Card>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { Card, Input, Button, MessagePlugin } from 'tdesign-react';
import { getAllSystemConfigs, saveSystemConfig } from '../services/systemConfig';

export default function SystemConfig() {
  const [siteName, setSiteName] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const map = await getAllSystemConfigs();
        if (!mounted) return;
        setSiteName(map.siteName || '');
        setContactEmail(map.contactEmail || '');
      } catch (e: any) {
        MessagePlugin.error(e?.message || '读取配置失败');
      }
    })();
    return () => { mounted = false; };
  }, []);

  async function onSave() {
    try {
      const ok1 = await saveSystemConfig('siteName', siteName || '');
      const ok2 = await saveSystemConfig('contactEmail', contactEmail || '');
      if (ok1 && ok2) MessagePlugin.success('保存成功');
      else MessagePlugin.warning('部分配置保存失败');
    } catch (e: any) {
      MessagePlugin.error(e?.message || '保存失败');
    }
  }

  return (
    <Card title="系统配置" bordered>
      <div style={{ display: 'grid', gap: 16, maxWidth: 520 }}>
        <div>
          <div style={{ marginBottom: 8, color: 'var(--td-text-color-secondary)' }}>商城名称</div>
          <Input
            value={siteName}
            onChange={(v) => setSiteName(typeof v === 'string' ? v : String((v as any)?.target?.value ?? ''))}
            placeholder="如 Smiley 商城"
          />
        </div>
        <div>
          <div style={{ marginBottom: 8, color: 'var(--td-text-color-secondary)' }}>联系邮箱</div>
          <Input
            value={contactEmail}
            onChange={(v) => setContactEmail(typeof v === 'string' ? v : String((v as any)?.target?.value ?? ''))}
            placeholder="admin@example.com"
          />
        </div>
        <div>
          <Button theme="primary" onClick={onSave}>保存</Button>
        </div>
      </div>
    </Card>
  );
}
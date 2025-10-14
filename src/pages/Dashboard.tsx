import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Image, Skeleton, MessagePlugin } from 'tdesign-react';
import { db, app } from '../services/cloudbase';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, categories: 0, tags: 0, users: 0 });
  const [banners, setBanners] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [p, c, t, u] = await Promise.all([
          db.collection('products').count(),
          db.collection('categories').count(),
          db.collection('tags').count(),
          db.collection('users').count(),
        ]);

        if (!mounted) return;
        setStats({
          products: p.total || 0,
          categories: c.total || 0,
          tags: t.total || 0,
          users: u.total || 0,
        });

        // 读取系统配置中的轮播图（文件ID），并获取临时URL展示
        try {
          const res: any = await app.callFunction({ name: 'systemConfig', data: { action: 'getAll' } });
          const allConfigs = res?.result?.data || {};
          const fileIds: string[] = allConfigs.carousel || allConfigs.banners || [];
          if (Array.isArray(fileIds) && fileIds.length > 0) {
            const temp = await app.getTempFileURL({ fileList: fileIds });
            const urls = temp?.fileList?.map((f: any) => f.tempFileURL).filter(Boolean) || [];
            if (mounted) setBanners(urls.slice(0, 3));
          }
        } catch (e) {
          // 配置或存储可能尚未初始化，忽略错误
        }
      } catch (e: any) {
        MessagePlugin.error(e?.message || '读取云端数据失败');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={6}><Card><Statistic title="在售商品" value={stats.products} /></Card></Col>
        <Col span={6}><Card><Statistic title="分类数量" value={stats.categories} /></Card></Col>
        <Col span={6}><Card><Statistic title="标签数量" value={stats.tags} /></Card></Col>
        <Col span={6}><Card><Statistic title="用户总数" value={stats.users} /></Card></Col>
      </Row>

      <Card title="轮播图预览" style={{ marginTop: 16 }}>
        {loading && <Skeleton rowCol={[1, 1, 1]} />}
        {!loading && banners.length === 0 && <div>暂无轮播图配置或文件</div>}
        {!loading && banners.length > 0 && (
          <Row gutter={[16, 16]}>
            {banners.map((url) => (
              <Col span={4} key={url}>
                <Image src={url} style={{ width: '100%', height: 120, objectFit: 'cover' }} />
              </Col>
            ))}
          </Row>
        )}
      </Card>
    </div>
  );
}
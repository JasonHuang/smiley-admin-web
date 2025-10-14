import { Layout, Button } from 'tdesign-react';
import { Link, useLocation } from 'react-router-dom';
import { AppIcon, DashboardIcon, UserIcon, SettingIcon, ViewListIcon, TagIcon } from 'tdesign-icons-react';
import { clearAdminSession } from '../services/adminSession';

const menuItems = [
  { path: '/', label: '仪表盘', icon: <DashboardIcon /> },
  { path: '/products', label: '商品', icon: <ViewListIcon /> },
  { path: '/categories', label: '分类', icon: <AppIcon /> },
  { path: '/tags', label: '标签', icon: <TagIcon /> },
  { path: '/users', label: '用户', icon: <UserIcon /> },
  { path: '/system', label: '系统配置', icon: <SettingIcon /> },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { Header, Content, Aside } = Layout;

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            width: '100%',
            margin: 0,
            padding: '0 24px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AppIcon size={20} />
            <span>Smiley 管理后台</span>
          </div>
          <Button size="small" variant="outline" onClick={() => { clearAdminSession(); window.location.reload(); }}>
            退出登录
          </Button>
        </div>
      </Header>
      <Layout>
        <Aside width={220} style={{ borderRight: '1px solid var(--td-gray-color-3)' }}>
          <nav style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 12px',
                    color: active ? 'var(--td-brand-color)' : 'var(--td-text-color-primary)',
                    background: active ? 'var(--td-brand-color-light)' : 'transparent',
                    borderRadius: 6,
                    textDecoration: 'none',
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </Aside>
        <Content style={{ padding: 16 }}>{children}</Content>
      </Layout>
    </Layout>
  );
}
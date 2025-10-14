import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Tags from './pages/Tags';
import Users from './pages/Users';
import SystemConfig from './pages/SystemConfig';
import Login from './pages/Login';
import { auth, ensureLogin } from './services/cloudbase';
import { isAdminLoggedIn } from './services/adminSession';

function App() {
  const [checking, setChecking] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const hasLogin = await auth.hasLoginState();
        if (!hasLogin) {
          await ensureLogin();
        }
        if (!mounted) return;
        // 路由鉴权基于管理员登录态（扫码登录写入的本地会话）
        const adminOk = isAdminLoggedIn();
        setIsAuthed(adminOk);
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) return <div style={{ padding: 24 }}>正在检查登录状态...</div>;
  if (!isAuthed) return <Login />;

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/tags" element={<Tags />} />
        <Route path="/users" element={<Users />} />
        <Route path="/system" element={<SystemConfig />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AdminLayout>
  );
}

export default App

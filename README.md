# Smiley Admin Web

基于 Vite + React + TypeScript + TDesign 的管理后台。

## 开发

1. 安装依赖：
   - `npm install`

2. 启动本地开发：
   - `npm run dev`
   - 默认地址：`http://localhost:5173/`

## 目录结构

- `src/layouts/AdminLayout.tsx`：基础布局与菜单导航
- `src/pages/`：各模块占位页面（登录、仪表盘、商品、分类、标签、用户、系统配置）
- `src/App.tsx`：路由配置
- `src/main.tsx`：入口，引入 `BrowserRouter` 和 TDesign 样式

## 后续工作

- 接入登录鉴权（与现有后端/云函数对接）
- 完成商品、分类、标签、系统配置的 CRUD 页面
- 与小程序共享数据结构与接口约定

## Docker 部署与运行

- 前置：确保本机已安装 `docker` 与 `docker compose`，并准备好 CloudBase 环境 ID（`VITE_TCB_ENV_ID`）。
- 构建镜像（可通过环境变量或构建参数传入 `VITE_TCB_ENV_ID`）：
  - 使用 Compose 构建：`docker compose build --build-arg VITE_TCB_ENV_ID=<你的ENV_ID>`
  - 或直接构建：`docker build -t smiley-admin-web:latest . --build-arg VITE_TCB_ENV_ID=<你的ENV_ID>`
- 运行（默认映射到宿主 `18080` → 容器 `80`）：
  - `docker compose up -d`
- 停止：
  - `docker compose down`

说明：
- 容器内使用 Node 的 `serve -s`（单页模式）提供静态资源，会自动将非静态路径回退到 `index.html`，保证 `react-router` 路由可用。
- 宿主机使用 Caddy 时，仅需将域名/端口反代到宿主 `18080` 即可；容器内部不需要再运行 Caddy。
- CloudBase 相关能力需要在构建阶段注入 `VITE_TCB_ENV_ID`，否则登录/数据能力不可用。

### 边缘 Caddy 反向代理示例（最小化）

```caddyfile
:80 {
  reverse_proxy 127.0.0.1:18080
}
```

```caddyfile
admin.example.com {
  reverse_proxy 127.0.0.1:18080
}
```

```caddyfile
:80 {
  reverse_proxy smiley-admin-web:80
}
```

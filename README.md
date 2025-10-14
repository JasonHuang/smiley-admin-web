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

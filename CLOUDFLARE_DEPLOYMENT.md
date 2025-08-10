# ☁️ Cloudflare Pages部署指南 - Shelf项目

## 🎯 部署方式选择

**推荐**：选择 **Next.js** (Full Stack)

### 为什么选择 Full Stack？
- ✅ 支持 App Router 和所有现代特性
- ✅ 图片优化和性能提升
- ✅ SSR/SSG 混合渲染
- ✅ 未来可扩展 API 功能

## 🚀 部署步骤

### 1. 创建 Pages 项目
1. 进入 **Pages** 部分
2. 点击 **"Create a project"**
3. 选择 **"Connect to Git"**
4. 选择你的 GitHub 仓库

### 2. 配置构建设置
#### Framework preset
- 选择：**Next.js**

#### Build configuration
```
Build command: npm run build
Build output directory: .next
Root directory: / (leave empty)
```

### 3. 部署
点击 **"Save and Deploy"** 开始构建部署

---

**部署成功后访问**: `https://your-project-name.pages.dev`
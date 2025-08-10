# 🚀 Vercel部署指南 - Shelf项目

## 快速部署步骤

### 1. 准备工作
- 确保代码已推送到GitHub仓库
- 注册/登录 [Vercel](https://vercel.com)

### 2. 导入项目
1. 在Vercel Dashboard点击 "Add New" → "Project"
2. 选择你的GitHub仓库 "Shelf"
3. 点击 "Import"

### 3. 配置部署设置
在项目配置页面：

#### Framework Preset
- 自动检测为 **Next.js**

#### Root Directory
- 保持默认：`.`（根目录）

#### Build Settings
- **Build Command**: `npm run build` (自动检测)
- **Output Directory**: `.next` (自动检测)
- **Install Command**: `npm install` (自动检测)

### 4. 环境变量设置（可选）
> **注意**：当前版本无需环境变量即可运行，以下配置仅为未来功能预留

如果需要GitHub OAuth功能，在Environment Variables部分添加：

```
Name: NEXTAUTH_URL
Value: https://your-app-name.vercel.app

Name: NEXTAUTH_SECRET  
Value: your-random-secret-string

Name: GITHUB_ID
Value: your-github-oauth-app-id

Name: GITHUB_SECRET
Value: your-github-oauth-app-secret
```

### 5. 部署
点击 **"Deploy"** 按钮开始部署

## 🔧 故障排除

### 环境变量错误
如果出现类似错误：
```
Environment Variable "NEXTAUTH_URL" references Secret "nextauth-url"
```

**解决方案**：
1. 确保`next.config.js`中没有`env`配置块
2. 环境变量直接在Vercel Dashboard中配置
3. 不要在代码中硬编码环境变量引用

### 构建失败
1. 检查`package.json`中的scripts配置
2. 确保所有依赖都在`dependencies`中而非`devDependencies`
3. 检查TypeScript类型错误

### 图片加载问题
如果外部图片无法显示，检查`next.config.js`中的`images.remotePatterns`配置

## 📝 部署后配置

### 自定义域名
1. 在项目设置中点击 "Domains"
2. 添加你的域名
3. 配置DNS记录

### 性能监控
- 启用Vercel Analytics
- 配置Web Vitals监控

### 持续部署
- 每次推送到main分支自动部署
- 支持Preview部署（PR预览）

## 🔒 安全注意事项

1. **永远不要**在代码中硬编码敏感信息
2. 环境变量只在Vercel Dashboard中配置
3. 使用强随机字符串作为NEXTAUTH_SECRET
4. 定期轮换OAuth应用密钥

---

部署成功后，你的Shelf应用将在：`https://your-app-name.vercel.app`
# 📚 Shelf - 3D书签管理器

一个美观、交互式的3D书签管理器，将您保存的链接显示为带有流畅动画的堆叠卡片。将您的网络资源整理到视觉上吸引人的合集中，并将所有内容同步到您的GitHub Gist。

## ✨ 功能特性

### 🎯 核心功能
- **3D书签堆叠**: 将书签显示为逼真的3D堆叠卡片，配有流畅的Framer Motion动画
- **合集管理**: 将书签整理到主题合集中，支持自定义图标和颜色
- **可展开视图**: 点击堆叠查看合集中的所有书签
- **智能管理**: 完整的管理界面，支持搜索、筛选和排序
- **GitHub同步**: 将所有数据存储在您的个人GitHub Gist中（无需数据库）
- **离线优先**: 通过localStorage离线工作，连接时同步

### 🎨 用户体验
- **精美UI**: 采用shadcn/ui组件和Tailwind CSS的现代设计
- **响应式设计**: 在桌面、平板和移动设备上完美运行
- **流畅动画**: 使用Framer Motion的弹簧动画
- **拖拽排序**: 通过直观的交互重新排列书签和合集
- **智能表单**: 添加书签时自动获取网站元数据

### 🔧 技术特性
- **Next.js 14**: 使用App Router和Server Actions构建
- **TypeScript**: 整个应用程序的完整类型安全
- **现代技术栈**: React 18、Framer Motion、Tailwind CSS、Radix UI
- **OAuth认证**: 安全的GitHub登录集成
- **边缘就绪**: 为Vercel部署优化

## 🚀 快速开始

### 前置要求
- 已安装Node.js 18+
- 已安装Git
- GitHub账户（用于认证和数据同步）

### 1. 克隆仓库
```bash
git clone <your-repo-url>
cd shelf-web-app
```

### 2. 安装依赖
```bash
npm install
```

### 3. 环境配置
复制示例环境文件并配置您的变量：
```bash
cp .env.example .env.local
```

编辑`.env.local`文件，填入您的配置：
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret
```

### 4. GitHub OAuth设置
1. 访问 GitHub设置 → 开发者设置 → OAuth应用
2. 点击"新建OAuth应用"
3. 填写详细信息：
   - 应用名称：`Shelf`
   - 主页URL：`http://localhost:3000`
   - 授权回调URL：`http://localhost:3000/api/auth/callback/github`
4. 将Client ID和Client Secret复制到您的`.env.local`文件中

### 5. 运行开发服务器
```bash
npm run dev
```

在浏览器中打开[http://localhost:3000](http://localhost:3000)。

## 📱 使用方法

### 入门指南
1. **首次访问**: 应用通过localStorage离线工作
2. **登录**: 连接GitHub以在设备间同步数据
3. **创建合集**: 将书签整理到主题组中
4. **添加书签**: 智能表单自动获取网站元数据
5. **3D视图**: 享受美丽的3D堆叠书签

### 主要交互
- **点击堆叠**: 展开查看合集中的所有书签
- **添加书签**: 使用+按钮或点击"添加书签"
- **管理**: 切换到`/manage`进行高级整理
- **搜索**: 在所有合集中查找书签
- **置顶**: 标记重要书签将其保持在顶部

### 管理界面 (`/manage`)
- **合集侧边栏**: 在合集间切换
- **网格/列表视图**: 选择您偏好的布局
- **搜索和筛选**: 快速查找书签
- **批量操作**: 选择多个书签进行操作
- **内联编辑**: 双击编辑书签详情

## 🏗️ 项目结构

```
src/
├── app/                    # Next.js应用目录
│   ├── globals.css        # 全局样式和CSS变量
│   ├── layout.tsx         # 带有提供者的根布局
│   ├── page.tsx           # 主页（3D显示）
│   └── manage/
│       └── page.tsx       # 管理界面
├── components/
│   ├── display/           # 3D书签显示组件
│   │   ├── BookmarkCard.tsx
│   │   ├── BookmarkStack.tsx
│   │   ├── BookmarkStacksDisplay.tsx
│   │   └── ExpandedCollection.tsx
│   ├── manage/           # 管理界面组件
│   │   ├── ManagementInterface.tsx
│   │   ├── CollectionSidebar.tsx
│   │   ├── BookmarkList.tsx
│   │   └── BookmarkForm.tsx
│   ├── layout/           # 布局组件
│   │   └── Navbar.tsx
│   └── ui/               # 可复用UI组件 (shadcn/ui)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── sheet.tsx
│       └── card.tsx
└── lib/
    ├── types.ts          # TypeScript类型定义
    ├── utils.ts          # 工具函数
    ├── mock-data.ts      # 开发模拟数据
    ├── bookmark-context.tsx  # 状态管理
    └── auth-context.tsx  # 认证上下文
```

## 🎨 自定义配置

### 主题和颜色
应用使用CSS变量进行主题设置。在`src/app/globals.css`中自定义：

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
  /* ... 更多变量 */
}
```

### 动画设置
在组件中修改默认弹簧动画：
```typescript
const springTransition = {
  type: "spring",
  stiffness: 220,
  damping: 30,
  mass: 1
};
```

### 合集图标
在合集设置中添加自定义表情符号或图标字体。

## 🚀 部署

### Vercel（推荐）
1. 将代码推送到GitHub
2. 将仓库连接到Vercel
3. 在Vercel仪表板中设置环境变量
4. 每次推送时自动部署

### 手动部署
```bash
npm run build
npm run start
```

### 生产环境变量
```env
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret
GITHUB_ID=your-github-oauth-id
GITHUB_SECRET=your-github-oauth-secret
```

## 🔧 开发

### 可用脚本
```bash
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run start    # 启动生产服务器
npm run lint     # 运行ESLint
```

### 技术栈详情
- **框架**: Next.js 14 with App Router
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui组件
- **动画**: Framer Motion
- **认证**: NextAuth.js with GitHub provider
- **状态管理**: React Context + useReducer
- **存储**: GitHub Gist API + localStorage后备

## 🤝 贡献

1. Fork仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开Pull Request

## 📄 许可证

此项目采用MIT许可证 - 详情请参阅[LICENSE](LICENSE)文件。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [shadcn/ui](https://ui.shadcn.com/) - UI组件
- [Tailwind CSS](https://tailwindcss.com/) - 实用优先CSS
- [Radix UI](https://www.radix-ui.com/) - 无头UI原语

---

**用❤️为开源社区构建**
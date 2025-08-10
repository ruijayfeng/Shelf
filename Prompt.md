你是一个专业的前端/全栈开发 AI 助手，我正在开发一个开源项目，名字叫做「Bookmark3D Web App」。

该项目是一个开源网页应用，用户可以在浏览器中：

- 以可视化、3D 书签堆叠的方式展示自己收藏的网址
- 使用内建的管理视图进行添加、删除、编辑、排序、标签分类
- 所有数据托管于用户自己的 GitHub Gist，无需数据库
- 项目部署在 Vercel，每个人都可以 Fork + 登录 GitHub 即可使用

---

## 🧱【技术栈说明】

- 框架：Next.js 14（使用 App Router + Server Actions）
- 样式框架：Tailwind CSS（实用类写法）
- 动画：Framer Motion（支持 layoutId、staggerChildren）
- 组件库：shadcn/ui（Radix 基础，含 Dialog、Popover、Sheet）
- 状态管理：React Context（轻量封装）
- 存储方式：
  - 默认：GitHub Gist（通过 GitHub OAuth）
  - 登录前：localStorage 暂存编辑数据
- 部署：Vercel（支持 Edge Runtime、自动构建）

---

## 🧩【界面与交互要求】

### 🧷 1. 展示视图（3D Bookmark 视图，首页 `/`）

> 展示用户的所有书签分类（Collection），每类以「堆叠的书签卡片」形式呈现，点击堆叠顶部卡片可展开全部书签。

#### UI 要点：

- 每个 Collection 为一组 `motion.div`，模拟真实书签叠在一起（使用 translateY、rotateZ、scale 控制）
- 卡片具有立体阴影、质感（Tailwind + bg-white + rounded-xl + shadow-[...]）
- 默认展示前 3 张书签的卡片部分内容，模拟堆叠层
- 点击顶部卡片，使用 layoutId 动画过渡展开
- 展开后：
  - 全屏居中显示当前 Collection 中所有 Bookmark（带动画）
  - 背景层模糊（使用 backdrop-blur-sm + scale/opacity 动画）
  - Esc 或点击模糊背景退出展开
- 所有动画使用 Framer Motion 的 spring 动画：`stiffness: 220, damping: 30, mass: 1`

#### 卡片内容字段：

- title（大号字）
- url（hover 时可点击）
- favicon
- description（可选）
- tags（chip 风格）

---

### 🗃️ 2. 管理视图（网址管理页 `/manage`）

> 管理视图是用于 CRUD 的表格/卡片混合视图，主要强调功能性与信息密度。

#### 功能需求：

- 左侧分类栏（Collections），可切换查看每类书签
- 主区域展示该类书签列表，支持：
  - 拖拽排序（framer-motion / react-beautiful-dnd）
  - 搜索（title / url / description / tag）
  - 批量操作（选中多个 -> 删除/移动）
  - 标签过滤器（可多选标签）
- 每个 Bookmark 项目都支持内联编辑：
  - 双击 title 可改
  - tag 可点击删除或添加
- 添加新 Bookmark 弹出 Drawer（使用 `shadcn/ui` 的 Sheet）

---

### 🧾 3. 表单设计（添加/编辑 Bookmark）

> 表单用于添加新书签或编辑已有项，要求交互流畅、自动填充 URL 信息。

字段：

- title（必填，默认从 URL og:title 获取）
- url（必填）
- description（og:description，可编辑）
- favicon（自动获取）
- tags（可多选+新建）
- collectionId（所属分类）

功能：

- 填入 URL 后自动抓取 favicon、标题、描述
- 若抓取失败使用默认图标
- 自动去重（若 URL 已存在于当前分类）

---

## 💾【数据模型】

```ts
type Collection = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  order: number;
};

type Bookmark = {
  id: string;
  collectionId: string;
  title: string;
  url: string;
  description?: string;
  favicon?: string;
  image?: string;
  tags?: string[];
  pinned?: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
};
```



## 🧠【智能交互逻辑】

- 页面加载时：
  - 若未登录，使用 localStorage 的草稿数据
  - 若已登录，调用 Gist API 拉取数据
- 所有操作（增删改）都由前端完成，并最终写入 Gist（PATCH JSON 文件）
- 更新数据时添加防抖和乐观更新（可用 `useOptimistic`）

------

## 🔐【OAuth 与权限】

- 登录：GitHub OAuth（只读 email 和 Gist 权限）
- 登录后自动创建一个初始 Gist（带空白数据结构）
- 用户只操作自己的 Gist，所有请求前需验证身份
- 未登录也可使用，但数据只存在浏览器中（localStorage）

------

## 🧭【组件分层结构建议】

```
/app
  /page.tsx               // 首页展示视图
  /manage/page.tsx        // 管理视图
  /api/gist               // Gist API 代理（登录、读写）

/components
  /display/
    BookmarkStack.tsx     // 堆叠组
    BookmarkCard.tsx      // 单卡片
    ExpandModal.tsx       // 展开后的聚焦 UI
  /manage/
    BookmarkList.tsx      // 管理视图主区域
    CollectionSidebar.tsx // 左侧分类栏
    BookmarkForm.tsx      // 添加/编辑表单
    TagFilter.tsx
  /ui/                    // 复用组件：Input, Dialog, Button

/lib
  github.ts               // GitHub Gist API 包装器
  auth.ts                 // GitHub 登录逻辑
  store.ts                // 本地缓存和同步逻辑
```

------



# avoids using indigo or blue colors unless specified in the user's request
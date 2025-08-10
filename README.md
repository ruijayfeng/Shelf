# 📚 Shelf - 3D Bookmark Manager

A beautiful, interactive 3D bookmark manager that displays your saved links as stacked cards with smooth animations. Organize your web resources in visually appealing collections and sync everything to your GitHub Gist.

## ✨ Features

### 🎯 Core Features
- **3D Bookmark Stacks**: Display bookmarks as realistic 3D stacked cards with smooth Framer Motion animations
- **Collection Management**: Organize bookmarks into themed collections with custom icons and colors
- **Expandable Views**: Click on stacks to expand and view all bookmarks in a collection
- **Smart Management**: Comprehensive management interface with search, filtering, and sorting
- **GitHub Sync**: Store all data in your personal GitHub Gist (no database required)
- **Offline First**: Works offline with localStorage, syncs when connected

### 🎨 User Experience
- **Beautiful UI**: Modern design with shadcn/ui components and Tailwind CSS
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices
- **Smooth Animations**: Spring-based animations using Framer Motion
- **Drag & Drop**: Reorder bookmarks and collections with intuitive interactions
- **Smart Forms**: Auto-fetch website metadata when adding bookmarks

### 🔧 Technical Features
- **Next.js 14**: Built with App Router and Server Actions
- **TypeScript**: Full type safety throughout the application
- **Modern Stack**: React 18, Framer Motion, Tailwind CSS, Radix UI
- **OAuth Authentication**: Secure GitHub login integration
- **Edge Ready**: Optimized for Vercel deployment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Git installed
- GitHub account (for authentication and data sync)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd shelf-web-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Copy the example environment file and configure your variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
GITHUB_ID=your-github-oauth-app-id
GITHUB_SECRET=your-github-oauth-app-secret
```

### 4. GitHub OAuth Setup
1. Go to GitHub Settings → Developer settings → OAuth Apps
2. Click "New OAuth App"
3. Fill in the details:
   - Application name: `Shelf`
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy the Client ID and Client Secret to your `.env.local`

### 5. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Usage

### Getting Started
1. **First Visit**: The app works offline with localStorage
2. **Sign In**: Connect with GitHub to sync data across devices
3. **Create Collections**: Organize bookmarks into themed groups
4. **Add Bookmarks**: Smart forms auto-fetch website metadata
5. **3D View**: Enjoy your bookmarks as beautiful 3D stacks

### Key Interactions
- **Click Stack**: Expand to view all bookmarks in a collection
- **Add Bookmark**: Use the + button or click "Add Bookmark"
- **Manage**: Switch to `/manage` for advanced organization
- **Search**: Find bookmarks across all collections
- **Pin**: Mark important bookmarks to keep them at the top

### Management Interface (`/manage`)
- **Collection Sidebar**: Switch between collections
- **Grid/List Views**: Choose your preferred layout
- **Search & Filter**: Find bookmarks quickly
- **Bulk Actions**: Select multiple bookmarks for operations
- **Inline Editing**: Double-click to edit bookmark details

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles and CSS variables
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page (3D display)
│   └── manage/
│       └── page.tsx       # Management interface
├── components/
│   ├── display/           # 3D bookmark display components
│   │   ├── BookmarkCard.tsx
│   │   ├── BookmarkStack.tsx
│   │   ├── BookmarkStacksDisplay.tsx
│   │   └── ExpandedCollection.tsx
│   ├── manage/           # Management interface components
│   │   ├── ManagementInterface.tsx
│   │   ├── CollectionSidebar.tsx
│   │   ├── BookmarkList.tsx
│   │   └── BookmarkForm.tsx
│   ├── layout/           # Layout components
│   │   └── Navbar.tsx
│   └── ui/               # Reusable UI components (shadcn/ui)
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── sheet.tsx
│       └── card.tsx
└── lib/
    ├── types.ts          # TypeScript type definitions
    ├── utils.ts          # Utility functions
    ├── mock-data.ts      # Development mock data
    ├── bookmark-context.tsx  # State management
    └── auth-context.tsx  # Authentication context
```

## 🎨 Customization

### Themes & Colors
The app uses CSS variables for theming. Customize in `src/app/globals.css`:

```css
:root {
  --primary: 221.2 83.2% 53.3%;
  --secondary: 210 40% 96%;
  /* ... more variables */
}
```

### Animation Settings
Modify the default spring animation in components:
```typescript
const springTransition = {
  type: "spring",
  stiffness: 220,
  damping: 30,
  mass: 1
};
```

### Collection Icons
Add custom emoji or icon fonts in collection settings.

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on every push

### Manual Deployment
```bash
npm run build
npm run start
```

### Environment Variables for Production
```env
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-production-secret
GITHUB_ID=your-github-oauth-id
GITHUB_SECRET=your-github-oauth-secret
```

## 🔧 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Tech Stack Details
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion
- **Authentication**: NextAuth.js with GitHub provider
- **State Management**: React Context + useReducer
- **Storage**: GitHub Gist API + localStorage fallback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Radix UI](https://www.radix-ui.com/) - Headless UI primitives

---

**Built with ❤️ for the open source community**
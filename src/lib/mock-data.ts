import { Collection, Bookmark, BookmarkData } from './types';
import { generateId } from './utils';

export const defaultCollections: Collection[] = [
  {
    id: generateId(),
    name: "Development",
    icon: "⚡",
    color: "#3b82f6",
    order: 1
  },
  {
    id: generateId(),
    name: "Design",
    icon: "🎨",
    color: "#ec4899",
    order: 2
  },
  {
    id: generateId(),
    name: "Resources",
    icon: "📚",
    color: "#10b981",
    order: 3
  }
];

export const defaultBookmarks: Bookmark[] = [
  {
    id: generateId(),
    collectionId: defaultCollections[0].id,
    title: "React Documentation",
    url: "https://react.dev",
    description: "The official React documentation with guides and API reference",
    favicon: "https://react.dev/favicon.ico",
    tags: ["react", "frontend", "documentation"],
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    collectionId: defaultCollections[0].id,
    title: "Next.js",
    url: "https://nextjs.org",
    description: "The React Framework for Production",
    favicon: "https://nextjs.org/favicon.ico",
    tags: ["nextjs", "react", "framework"],
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    collectionId: defaultCollections[0].id,
    title: "TypeScript",
    url: "https://www.typescriptlang.org",
    description: "TypeScript is JavaScript with syntax for types",
    favicon: "https://www.typescriptlang.org/favicon-32x32.png",
    tags: ["typescript", "javascript", "types"],
    pinned: true,
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    collectionId: defaultCollections[1].id,
    title: "Figma",
    url: "https://figma.com",
    description: "Collaborative interface design tool",
    favicon: "https://static.figma.com/app/icon/1/favicon.svg",
    tags: ["design", "ui", "collaboration"],
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    collectionId: defaultCollections[1].id,
    title: "Dribbble",
    url: "https://dribbble.com",
    description: "Discover the world's top designers & creatives",
    favicon: "https://dribbble.com/favicon.ico",
    tags: ["design", "inspiration", "portfolio"],
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: generateId(),
    collectionId: defaultCollections[2].id,
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org",
    description: "Resources for developers, by developers",
    favicon: "https://developer.mozilla.org/favicon-48x48.bc390275e955dacb2e65.png",
    tags: ["documentation", "web", "reference"],
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const mockBookmarkData: BookmarkData = {
  collections: defaultCollections,
  bookmarks: defaultBookmarks,
  lastUpdated: new Date().toISOString()
};

export function createEmptyBookmarkData(): BookmarkData {
  return {
    collections: [],
    bookmarks: [],
    lastUpdated: new Date().toISOString()
  };
}
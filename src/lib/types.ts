export type Collection = {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  order: number;
};

export type Bookmark = {
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

export type BookmarkData = {
  collections: Collection[];
  bookmarks: Bookmark[];
  lastUpdated: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  gistId?: string;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};

export type BookmarkFormData = {
  title: string;
  url: string;
  description?: string;
  tags: string[];
  collectionId: string;
  pinned?: boolean;
};

export type CollectionFormData = {
  name: string;
  icon?: string;
  color?: string;
};

export type UrlMetadata = {
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
};

export type FilterState = {
  search: string;
  tags: string[];
  collection: string | null;
  pinned?: boolean;
};

export type SortOption = 'createdAt' | 'updatedAt' | 'title' | 'order';
export type SortDirection = 'asc' | 'desc';
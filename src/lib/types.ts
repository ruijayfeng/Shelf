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
  githubLogin?: string;
  lastSync?: string;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error?: string;
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

// GitHub Integration Types
export type GitHubIntegrationStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export type SyncStatus = 'idle' | 'syncing' | 'uploading' | 'downloading' | 'conflict' | 'error' | 'success';

export type SyncAction = 'manual' | 'auto' | 'startup' | 'beforeClose';

export type ConflictResolution = 'local' | 'remote' | 'merge';

export interface SyncState {
  status: SyncStatus;
  lastSync?: string;
  lastSyncAction?: SyncAction;
  progress?: number;
  message?: string;
  error?: string;
  gistId?: string;
  conflictData?: {
    localData: BookmarkData;
    remoteData: BookmarkData;
    message: string;
  };
}

export interface GitHubSyncSettings {
  autoSync: boolean;
  syncInterval: number; // minutes
  syncOnStartup: boolean;
  syncBeforeClose: boolean;
  conflictResolution: 'ask' | 'local' | 'remote' | 'merge';
  backupBeforeSync: boolean;
}

export interface SyncConflictData {
  type: 'data' | 'version' | 'merge';
  localData: BookmarkData;
  remoteData: BookmarkData;
  localTimestamp: string;
  remoteTimestamp: string;
  deviceId: string;
  message: string;
}

export interface SyncResult {
  success: boolean;
  action: 'uploaded' | 'downloaded' | 'merged' | 'no_change' | 'conflict';
  data?: BookmarkData;
  conflict?: SyncConflictData;
  error?: string;
  gistId?: string;
  timestamp: string;
}

export interface BackupInfo {
  id: string;
  label: string;
  created: string;
  size: number;
  deviceId: string;
  gistUrl: string;
}

// Enhanced Bookmark Context Types
export interface BookmarkContextState {
  data: BookmarkData;
  loading: boolean;
  error: string | null;
  sync: SyncState;
  settings: GitHubSyncSettings;
}

// GitHub OAuth Types
export interface GitHubOAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

export interface GitHubAuthResult {
  success: boolean;
  user?: User;
  error?: string;
  accessToken?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SyncApiResponse extends ApiResponse<BookmarkData> {
  syncResult?: SyncResult;
  conflictData?: SyncConflictData;
}

// Component Props Types
export interface SyncStatusProps {
  status: SyncStatus;
  lastSync?: string;
  error?: string;
  compact?: boolean;
  showDetails?: boolean;
}

export interface ConflictResolverProps {
  conflict: SyncConflictData;
  onResolve: (resolution: ConflictResolution) => void;
  onCancel: () => void;
  isResolving?: boolean;
}

export interface SyncPanelProps {
  syncState: SyncState;
  settings: GitHubSyncSettings;
  onSync: (action: SyncAction) => void;
  onSettingsChange: (settings: Partial<GitHubSyncSettings>) => void;
  onCreateBackup: () => void;
}

// Utility Types
export type SyncEventHandler = (result: SyncResult) => void;
export type ConflictHandler = (conflict: SyncConflictData) => void;
export type ErrorHandler = (error: string) => void;

// Hook Return Types
export interface UseSyncReturn {
  syncState: SyncState;
  settings: GitHubSyncSettings;
  sync: (action?: SyncAction) => Promise<SyncResult>;
  resolveConflict: (resolution: ConflictResolution) => Promise<SyncResult>;
  updateSettings: (settings: Partial<GitHubSyncSettings>) => void;
  createBackup: (label?: string) => Promise<BackupInfo | null>;
  clearSyncState: () => void;
}

export interface UseGitHubAuthReturn {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: () => Promise<void>;
  logout: () => void;
  refreshAuth: () => Promise<void>;
}
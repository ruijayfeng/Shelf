'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { 
  Bookmark, 
  Collection, 
  BookmarkData, 
  BookmarkFormData, 
  CollectionFormData,
  SyncState,
  SyncAction,
  SyncStatus,
  GitHubSyncSettings,
  ConflictResolution,
  SyncConflictData,
  SyncResult
} from './types';
import { mockBookmarkData, createEmptyBookmarkData } from './mock-data';
import { generateId } from './utils';
import { useToast } from '@/components/ui/toast';
import { useTranslations } from './language-context';
import { useAuth } from './auth-context';
import { gistStorage, getSyncStatusMessage } from './gist-storage';
import { githubClient } from './github';

type BookmarkAction = 
  | { type: 'LOAD_DATA'; payload: BookmarkData }
  | { type: 'ADD_BOOKMARK'; payload: BookmarkFormData }
  | { type: 'UPDATE_BOOKMARK'; payload: { id: string; data: Partial<BookmarkFormData> } }
  | { type: 'DELETE_BOOKMARK'; payload: string }
  | { type: 'REORDER_BOOKMARKS'; payload: { collectionId: string; bookmarks: Bookmark[] } }
  | { type: 'ADD_COLLECTION'; payload: CollectionFormData }
  | { type: 'UPDATE_COLLECTION'; payload: { id: string; data: Partial<CollectionFormData> } }
  | { type: 'DELETE_COLLECTION'; payload: string }
  | { type: 'REORDER_COLLECTIONS'; payload: Collection[] }
  | { type: 'TOGGLE_BOOKMARK_PIN'; payload: string }
  | { type: 'SET_SYNC_STATUS'; payload: Partial<SyncState> }
  | { type: 'SET_SYNC_SETTINGS'; payload: Partial<GitHubSyncSettings> }
  | { type: 'SET_CONFLICT_DATA'; payload: SyncConflictData | null }
  | { type: 'CLEAR_SYNC_ERROR'; payload: void };

interface BookmarkContextState {
  data: BookmarkData;
  loading: boolean;
  error: string | null;
  sync: SyncState;
  settings: GitHubSyncSettings;
}

interface BookmarkContextType extends BookmarkContextState {
  // Bookmark actions
  addBookmark: (bookmark: BookmarkFormData) => Promise<void>;
  updateBookmark: (id: string, data: Partial<BookmarkFormData>) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  toggleBookmarkPin: (id: string) => Promise<void>;
  reorderBookmarks: (collectionId: string, bookmarks: Bookmark[]) => Promise<void>;
  // Collection actions
  addCollection: (collection: CollectionFormData) => Promise<void>;
  updateCollection: (id: string, data: Partial<CollectionFormData>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  reorderCollections: (collections: Collection[]) => Promise<void>;
  // Sync actions
  syncData: (action?: SyncAction) => Promise<SyncResult>;
  resolveConflict: (resolution: ConflictResolution) => Promise<SyncResult>;
  createBackup: (label?: string) => Promise<boolean>;
  updateSyncSettings: (settings: Partial<GitHubSyncSettings>) => void;
  clearSyncError: () => void;
  // Utility functions
  getBookmarksByCollection: (collectionId: string) => Bookmark[];
  getCollectionById: (id: string) => Collection | undefined;
  getAllTags: () => string[];
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

// Default sync settings
const defaultSyncSettings: GitHubSyncSettings = {
  autoSync: true,
  syncInterval: 5, // minutes
  syncOnStartup: true,
  syncBeforeClose: true,
  conflictResolution: 'ask',
  backupBeforeSync: false,
};

// Default sync state
const defaultSyncState: SyncState = {
  status: 'idle',
  lastSync: undefined,
  lastSyncAction: undefined,
  progress: undefined,
  message: undefined,
  error: undefined,
  gistId: undefined,
  conflictData: undefined,
};

function bookmarkReducer(state: BookmarkContextState, action: BookmarkAction): BookmarkContextState {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        data: action.payload,
      };

    case 'ADD_BOOKMARK': {
      const newBookmark: Bookmark = {
        id: generateId(),
        ...action.payload,
        order: state.data.bookmarks.filter(b => b.collectionId === action.payload.collectionId).length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        data: {
          ...state.data,
          bookmarks: [...state.data.bookmarks, newBookmark],
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    case 'UPDATE_BOOKMARK': {
      const updatedBookmarks = state.data.bookmarks.map(bookmark =>
        bookmark.id === action.payload.id
          ? { ...bookmark, ...action.payload.data, updatedAt: new Date().toISOString() }
          : bookmark
      );
      return {
        ...state,
        data: {
          ...state.data,
          bookmarks: updatedBookmarks,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    case 'DELETE_BOOKMARK': {
      const filteredBookmarks = state.data.bookmarks.filter(b => b.id !== action.payload);
      return {
        ...state,
        data: {
          ...state.data,
          bookmarks: filteredBookmarks,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    case 'TOGGLE_BOOKMARK_PIN': {
      const updatedBookmarks = state.data.bookmarks.map(bookmark =>
        bookmark.id === action.payload
          ? { ...bookmark, pinned: !bookmark.pinned, updatedAt: new Date().toISOString() }
          : bookmark
      );
      return {
        ...state,
        data: {
          ...state.data,
          bookmarks: updatedBookmarks,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    case 'REORDER_BOOKMARKS': {
      const reorderedBookmarks = action.payload.bookmarks.map((bookmark, index) => ({
        ...bookmark,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      }));
      const otherBookmarks = state.data.bookmarks.filter(b => b.collectionId !== action.payload.collectionId);
      return {
        ...state,
        data: {
          ...state.data,
          bookmarks: [...otherBookmarks, ...reorderedBookmarks],
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    case 'ADD_COLLECTION': {
      const newCollection: Collection = {
        id: generateId(),
        ...action.payload,
        order: state.data.collections.length + 1,
      };
      return {
        ...state,
        data: {
          ...state.data,
          collections: [...state.data.collections, newCollection],
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    case 'UPDATE_COLLECTION': {
      const updatedCollections = state.data.collections.map(collection =>
        collection.id === action.payload.id
          ? { ...collection, ...action.payload.data }
          : collection
      );
      return {
        ...state,
        data: {
          ...state.data,
          collections: updatedCollections,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    case 'DELETE_COLLECTION': {
      const filteredCollections = state.data.collections.filter(c => c.id !== action.payload);
      const filteredBookmarks = state.data.bookmarks.filter(b => b.collectionId !== action.payload);
      return {
        ...state,
        data: {
          ...state.data,
          collections: filteredCollections,
          bookmarks: filteredBookmarks,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    case 'REORDER_COLLECTIONS': {
      const reorderedCollections = action.payload.map((collection, index) => ({
        ...collection,
        order: index + 1,
      }));
      return {
        ...state,
        data: {
          ...state.data,
          collections: reorderedCollections,
          lastUpdated: new Date().toISOString(),
        },
      };
    }

    case 'SET_SYNC_STATUS': {
      return {
        ...state,
        sync: {
          ...state.sync,
          ...action.payload,
        },
      };
    }

    case 'SET_SYNC_SETTINGS': {
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };
    }

    case 'SET_CONFLICT_DATA': {
      return {
        ...state,
        sync: {
          ...state.sync,
          conflictData: action.payload ? {
            localData: action.payload.localData,
            remoteData: action.payload.remoteData,
            message: action.payload.message,
          } : undefined,
          status: action.payload ? 'conflict' : state.sync.status,
        },
      };
    }

    case 'CLEAR_SYNC_ERROR': {
      return {
        ...state,
        sync: {
          ...state.sync,
          error: undefined,
          status: state.sync.status === 'error' ? 'idle' : state.sync.status,
        },
      };
    }

    default:
      return state;
  }
}

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const initialState: BookmarkContextState = {
    data: createEmptyBookmarkData(),
    loading: true,
    error: null,
    sync: defaultSyncState,
    settings: defaultSyncSettings,
  };
  
  const [state, dispatch] = useReducer(bookmarkReducer, initialState);
  const { toast } = useToast();
  const t = useTranslations();
  const { isAuthenticated, isConnectedToGitHub, user } = useAuth();
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<string | null>(null);

  // Load data and settings from localStorage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load bookmark data
        const storedData = localStorage.getItem('shelf-data');
        const bookmarkData = storedData ? JSON.parse(storedData) : mockBookmarkData;
        
        // Load sync settings
        const storedSettings = localStorage.getItem('shelf-sync-settings');
        const syncSettings = storedSettings ? 
          { ...defaultSyncSettings, ...JSON.parse(storedSettings) } : 
          defaultSyncSettings;
        
        dispatch({ type: 'LOAD_DATA', payload: bookmarkData });
        dispatch({ type: 'SET_SYNC_SETTINGS', payload: syncSettings });
        
        // Perform startup sync if enabled and authenticated
        if (syncSettings.syncOnStartup && isConnectedToGitHub) {
          setTimeout(() => {
            performSync('startup');
          }, 1000); // Delay to allow UI to settle
        }
        
      } catch (err) {
        console.error('Error loading data from localStorage:', err);
        dispatch({ type: 'LOAD_DATA', payload: mockBookmarkData });
      } finally {
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'idle' } });
      }
    };
    
    loadData();
  }, [isConnectedToGitHub]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!state.loading) {
      try {
        localStorage.setItem('shelf-data', JSON.stringify(state.data));
      } catch (err) {
        console.error('Error saving data to localStorage:', err);
      }
    }
  }, [state.data, state.loading]);

  // Save sync settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('shelf-sync-settings', JSON.stringify(state.settings));
    } catch (err) {
      console.error('Error saving sync settings:', err);
    }
  }, [state.settings]);

  // Auto-sync interval
  useEffect(() => {
    if (state.settings.autoSync && isConnectedToGitHub && state.settings.syncInterval > 0) {
      const interval = setInterval(() => {
        if (state.sync.status === 'idle') {
          performSync('auto');
        }
      }, state.settings.syncInterval * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [state.settings.autoSync, state.settings.syncInterval, isConnectedToGitHub, state.sync.status]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Perform sync operation
  const performSync = useCallback(async (action: SyncAction = 'manual'): Promise<SyncResult> => {
    if (!isConnectedToGitHub) {
      const result: SyncResult = {
        success: false,
        action: 'no_change',
        error: 'Not connected to GitHub',
        timestamp: new Date().toISOString(),
      };
      return result;
    }

    try {
      dispatch({ type: 'SET_SYNC_STATUS', payload: { 
        status: 'syncing',
        lastSyncAction: action,
        error: undefined 
      } });

      const syncResult = await gistStorage.syncWithGist(state.data);
      
      if (syncResult.success) {
        if (syncResult.data && syncResult.action === 'downloaded') {
          dispatch({ type: 'LOAD_DATA', payload: syncResult.data });
        }
        
        dispatch({ type: 'SET_SYNC_STATUS', payload: {
          status: 'success',
          lastSync: new Date().toISOString(),
          gistId: syncResult.gistId,
          message: getSyncStatusMessage(syncResult),
        } });
        
        if (user && syncResult.gistId) {
          const updatedUser = { ...user, gistId: syncResult.gistId, lastSync: new Date().toISOString() };
          localStorage.setItem('shelf-user', JSON.stringify(updatedUser));
        }
        
        // Auto-clear success status after 3 seconds
        setTimeout(() => {
          if (state.sync.status === 'success') {
            dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'idle' } });
          }
        }, 3000);
        
      } else if (syncResult.action === 'conflict' && syncResult.conflict) {
        const conflictData: SyncConflictData = {
          type: syncResult.conflict.type,
          localData: syncResult.conflict.localData,
          remoteData: syncResult.conflict.remoteData,
          localTimestamp: syncResult.conflict.localData.lastUpdated,
          remoteTimestamp: syncResult.conflict.remoteData.lastUpdated,
          deviceId: syncResult.conflict.localMetadata.deviceId,
          message: syncResult.conflict.message,
        };
        
        dispatch({ type: 'SET_CONFLICT_DATA', payload: conflictData });
      } else {
        dispatch({ type: 'SET_SYNC_STATUS', payload: {
          status: 'error',
          error: syncResult.error || 'Sync failed',
        } });
      }
      
      const result: SyncResult = {
        ...syncResult,
        timestamp: new Date().toISOString(),
      };
      
      return result;
      
    } catch (error) {
      console.error('Sync error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      dispatch({ type: 'SET_SYNC_STATUS', payload: {
        status: 'error',
        error: errorMessage,
      } });
      
      return {
        success: false,
        action: 'no_change',
        error: errorMessage,
        timestamp: new Date().toISOString(),
      };
    }
  }, [isConnectedToGitHub, state.data, state.sync.status, user]);

  // Debounced auto-sync after data changes
  const triggerAutoSync = useCallback(() => {
    if (state.settings.autoSync && isConnectedToGitHub && state.sync.status === 'idle') {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      
      syncTimeoutRef.current = setTimeout(() => {
        performSync('auto');
      }, 2000); // 2 second delay
    }
  }, [state.settings.autoSync, isConnectedToGitHub, state.sync.status, performSync]);

  // Action wrappers with sync integration
  const createActionWrapper = <T extends any[]>(
    actionType: BookmarkAction['type'],
    payload: (...args: T) => any,
    successMessage: (args: T) => { title: string; description?: string }
  ) => {
    return async (...args: T) => {
      const actionPayload = payload(...args);
      dispatch({ type: actionType as any, payload: actionPayload });
      
      const message = successMessage(args);
      toast({
        type: 'success',
        title: message.title,
        description: message.description
      });
      
      triggerAutoSync();
    };
  };

  const contextValue: BookmarkContextType = {
    ...state,
    
    // Bookmark actions
    addBookmark: createActionWrapper(
      'ADD_BOOKMARK',
      (bookmark: BookmarkFormData) => bookmark,
      ([bookmark]) => ({ title: t.messages.bookmarkAdded, description: bookmark.title })
    ),
    updateBookmark: createActionWrapper(
      'UPDATE_BOOKMARK',
      (id: string, data: Partial<BookmarkFormData>) => ({ id, data }),
      () => ({ title: t.messages.bookmarkUpdated })
    ),
    deleteBookmark: createActionWrapper(
      'DELETE_BOOKMARK',
      (id: string) => {
        const bookmark = state.data.bookmarks.find(b => b.id === id);
        return id;
      },
      ([id]) => {
        const bookmark = state.data.bookmarks.find(b => b.id === id);
        return { title: t.messages.bookmarkDeleted, description: bookmark?.title };
      }
    ),
    toggleBookmarkPin: createActionWrapper(
      'TOGGLE_BOOKMARK_PIN',
      (id: string) => id,
      () => ({ title: 'Bookmark updated' })
    ),
    reorderBookmarks: createActionWrapper(
      'REORDER_BOOKMARKS',
      (collectionId: string, bookmarks: Bookmark[]) => ({ collectionId, bookmarks }),
      () => ({ title: 'Bookmarks reordered' })
    ),
    
    // Collection actions
    addCollection: createActionWrapper(
      'ADD_COLLECTION',
      (collection: CollectionFormData) => collection,
      ([collection]) => ({ title: t.messages.collectionAdded, description: collection.name })
    ),
    updateCollection: createActionWrapper(
      'UPDATE_COLLECTION',
      (id: string, data: Partial<CollectionFormData>) => ({ id, data }),
      ([, data]) => ({ title: t.messages.collectionUpdated, description: data.name })
    ),
    deleteCollection: createActionWrapper(
      'DELETE_COLLECTION',
      (id: string) => {
        const collection = state.data.collections.find(c => c.id === id);
        return id;
      },
      ([id]) => {
        const collection = state.data.collections.find(c => c.id === id);
        return { title: t.messages.collectionDeleted, description: collection?.name };
      }
    ),
    reorderCollections: createActionWrapper(
      'REORDER_COLLECTIONS',
      (collections: Collection[]) => collections,
      () => ({ title: 'Collections reordered' })
    ),
    
    // Sync actions
    syncData: performSync,
    resolveConflict: useCallback(async (resolution: ConflictResolution): Promise<SyncResult> => {
      if (!state.sync.conflictData) {
        return {
          success: false,
          action: 'conflict',
          error: 'No conflict to resolve',
          timestamp: new Date().toISOString(),
        };
      }
      
      try {
        dispatch({ type: 'SET_SYNC_STATUS', payload: { status: 'syncing' } });
        
        const conflict = {
          type: state.sync.conflictData.type,
          localData: state.sync.conflictData.localData,
          remoteData: state.sync.conflictData.remoteData,
          localMetadata: {
            deviceId: state.sync.conflictData.deviceId,
            lastSync: state.sync.conflictData.localTimestamp,
            syncCount: 0,
            version: '1.0.0',
            checksum: ''
          },
          remoteMetadata: {
            deviceId: 'remote',
            lastSync: state.sync.conflictData.remoteTimestamp,
            syncCount: 0,
            version: '1.0.0',
            checksum: ''
          },
          message: state.sync.conflictData.message
        };
        
        const result = await gistStorage.resolveConflict(conflict, resolution);
        
        if (result.success && result.data) {
          dispatch({ type: 'LOAD_DATA', payload: result.data });
          dispatch({ type: 'SET_CONFLICT_DATA', payload: null });
          dispatch({ type: 'SET_SYNC_STATUS', payload: {
            status: 'success',
            lastSync: new Date().toISOString(),
            message: 'Conflict resolved successfully',
          } });
        } else {
          dispatch({ type: 'SET_SYNC_STATUS', payload: {
            status: 'error',
            error: result.error || 'Failed to resolve conflict',
          } });
        }
        
        return {
          ...result,
          timestamp: new Date().toISOString(),
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        dispatch({ type: 'SET_SYNC_STATUS', payload: {
          status: 'error',
          error: errorMessage,
        } });
        
        return {
          success: false,
          action: 'conflict',
          error: errorMessage,
          timestamp: new Date().toISOString(),
        };
      }
    }, [state.sync.conflictData]),
    
    createBackup: useCallback(async (label?: string): Promise<boolean> => {
      if (!isConnectedToGitHub) {
        toast({
          type: 'error',
          title: 'Backup failed',
          description: 'Not connected to GitHub'
        });
        return false;
      }
      
      try {
        const result = await gistStorage.createBackup(state.data, label);
        
        if (result.success) {
          toast({
            type: 'success',
            title: 'Backup created',
            description: 'Your bookmarks have been backed up to GitHub'
          });
          return true;
        } else {
          toast({
            type: 'error',
            title: 'Backup failed',
            description: result.error || 'Unknown error'
          });
          return false;
        }
      } catch (error) {
        toast({
          type: 'error',
          title: 'Backup failed',
          description: error instanceof Error ? error.message : 'Unknown error'
        });
        return false;
      }
    }, [isConnectedToGitHub, state.data, toast]),
    
    updateSyncSettings: useCallback((settings: Partial<GitHubSyncSettings>) => {
      dispatch({ type: 'SET_SYNC_SETTINGS', payload: settings });
    }, []),
    
    clearSyncError: useCallback(() => {
      dispatch({ type: 'CLEAR_SYNC_ERROR', payload: void 0 });
    }, []),
    
    // Utility functions
    getBookmarksByCollection: (collectionId: string) =>
      state.data.bookmarks
        .filter(b => b.collectionId === collectionId)
        .sort((a, b) => a.order - b.order),
    getCollectionById: (id: string) =>
      state.data.collections.find(c => c.id === id),
    getAllTags: () => {
      const allTags = state.data.bookmarks.flatMap(b => b.tags || []);
      return Array.from(new Set(allTags)).sort();
    },
  };

  return (
    <BookmarkContext.Provider value={contextValue}>
      {children}
    </BookmarkContext.Provider>
  );
}

export function useBookmarks() {
  const context = useContext(BookmarkContext);
  if (context === undefined) {
    throw new Error('useBookmarks must be used within a BookmarkProvider');
  }
  return context;
}
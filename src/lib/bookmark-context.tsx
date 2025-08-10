'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Bookmark, Collection, BookmarkData, BookmarkFormData, CollectionFormData } from './types';
import { mockBookmarkData, createEmptyBookmarkData } from './mock-data';
import { generateId } from './utils';

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
  | { type: 'TOGGLE_BOOKMARK_PIN'; payload: string };

interface BookmarkContextType {
  data: BookmarkData;
  loading: boolean;
  error: string | null;
  // Bookmark actions
  addBookmark: (bookmark: BookmarkFormData) => void;
  updateBookmark: (id: string, data: Partial<BookmarkFormData>) => void;
  deleteBookmark: (id: string) => void;
  toggleBookmarkPin: (id: string) => void;
  reorderBookmarks: (collectionId: string, bookmarks: Bookmark[]) => void;
  // Collection actions
  addCollection: (collection: CollectionFormData) => void;
  updateCollection: (id: string, data: Partial<CollectionFormData>) => void;
  deleteCollection: (id: string) => void;
  reorderCollections: (collections: Collection[]) => void;
  // Utility functions
  getBookmarksByCollection: (collectionId: string) => Bookmark[];
  getCollectionById: (id: string) => Collection | undefined;
  getAllTags: () => string[];
}

const BookmarkContext = createContext<BookmarkContextType | undefined>(undefined);

function bookmarkReducer(state: BookmarkData, action: BookmarkAction): BookmarkData {
  switch (action.type) {
    case 'LOAD_DATA':
      return action.payload;

    case 'ADD_BOOKMARK': {
      const newBookmark: Bookmark = {
        id: generateId(),
        ...action.payload,
        order: state.bookmarks.filter(b => b.collectionId === action.payload.collectionId).length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return {
        ...state,
        bookmarks: [...state.bookmarks, newBookmark],
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'UPDATE_BOOKMARK': {
      const updatedBookmarks = state.bookmarks.map(bookmark =>
        bookmark.id === action.payload.id
          ? { ...bookmark, ...action.payload.data, updatedAt: new Date().toISOString() }
          : bookmark
      );
      return {
        ...state,
        bookmarks: updatedBookmarks,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'DELETE_BOOKMARK': {
      const filteredBookmarks = state.bookmarks.filter(b => b.id !== action.payload);
      return {
        ...state,
        bookmarks: filteredBookmarks,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'TOGGLE_BOOKMARK_PIN': {
      const updatedBookmarks = state.bookmarks.map(bookmark =>
        bookmark.id === action.payload
          ? { ...bookmark, pinned: !bookmark.pinned, updatedAt: new Date().toISOString() }
          : bookmark
      );
      return {
        ...state,
        bookmarks: updatedBookmarks,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'REORDER_BOOKMARKS': {
      const reorderedBookmarks = action.payload.bookmarks.map((bookmark, index) => ({
        ...bookmark,
        order: index + 1,
        updatedAt: new Date().toISOString(),
      }));
      const otherBookmarks = state.bookmarks.filter(b => b.collectionId !== action.payload.collectionId);
      return {
        ...state,
        bookmarks: [...otherBookmarks, ...reorderedBookmarks],
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'ADD_COLLECTION': {
      const newCollection: Collection = {
        id: generateId(),
        ...action.payload,
        order: state.collections.length + 1,
      };
      return {
        ...state,
        collections: [...state.collections, newCollection],
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'UPDATE_COLLECTION': {
      const updatedCollections = state.collections.map(collection =>
        collection.id === action.payload.id
          ? { ...collection, ...action.payload.data }
          : collection
      );
      return {
        ...state,
        collections: updatedCollections,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'DELETE_COLLECTION': {
      const filteredCollections = state.collections.filter(c => c.id !== action.payload);
      const filteredBookmarks = state.bookmarks.filter(b => b.collectionId !== action.payload);
      return {
        ...state,
        collections: filteredCollections,
        bookmarks: filteredBookmarks,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'REORDER_COLLECTIONS': {
      const reorderedCollections = action.payload.map((collection, index) => ({
        ...collection,
        order: index + 1,
      }));
      return {
        ...state,
        collections: reorderedCollections,
        lastUpdated: new Date().toISOString(),
      };
    }

    default:
      return state;
  }
}

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const [data, dispatch] = useReducer(bookmarkReducer, createEmptyBookmarkData());
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('shelf-data');
      if (stored) {
        const parsedData = JSON.parse(stored);
        dispatch({ type: 'LOAD_DATA', payload: parsedData });
      } else {
        // Use mock data for development
        dispatch({ type: 'LOAD_DATA', payload: mockBookmarkData });
      }
    } catch (err) {
      console.error('Error loading data from localStorage:', err);
      dispatch({ type: 'LOAD_DATA', payload: mockBookmarkData });
    } finally {
      setLoading(false);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (!loading) {
      try {
        localStorage.setItem('shelf-data', JSON.stringify(data));
      } catch (err) {
        console.error('Error saving data to localStorage:', err);
        setError('Failed to save data to local storage');
      }
    }
  }, [data, loading]);

  const contextValue: BookmarkContextType = {
    data,
    loading,
    error,
    
    // Bookmark actions
    addBookmark: (bookmark: BookmarkFormData) => 
      dispatch({ type: 'ADD_BOOKMARK', payload: bookmark }),
    updateBookmark: (id: string, data: Partial<BookmarkFormData>) =>
      dispatch({ type: 'UPDATE_BOOKMARK', payload: { id, data } }),
    deleteBookmark: (id: string) =>
      dispatch({ type: 'DELETE_BOOKMARK', payload: id }),
    toggleBookmarkPin: (id: string) =>
      dispatch({ type: 'TOGGLE_BOOKMARK_PIN', payload: id }),
    reorderBookmarks: (collectionId: string, bookmarks: Bookmark[]) =>
      dispatch({ type: 'REORDER_BOOKMARKS', payload: { collectionId, bookmarks } }),
    
    // Collection actions
    addCollection: (collection: CollectionFormData) =>
      dispatch({ type: 'ADD_COLLECTION', payload: collection }),
    updateCollection: (id: string, data: Partial<CollectionFormData>) =>
      dispatch({ type: 'UPDATE_COLLECTION', payload: { id, data } }),
    deleteCollection: (id: string) =>
      dispatch({ type: 'DELETE_COLLECTION', payload: id }),
    reorderCollections: (collections: Collection[]) =>
      dispatch({ type: 'REORDER_COLLECTIONS', payload: collections }),
    
    // Utility functions
    getBookmarksByCollection: (collectionId: string) =>
      data.bookmarks
        .filter(b => b.collectionId === collectionId)
        .sort((a, b) => a.order - b.order),
    getCollectionById: (id: string) =>
      data.collections.find(c => c.id === id),
    getAllTags: () => {
      const allTags = data.bookmarks.flatMap(b => b.tags || []);
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
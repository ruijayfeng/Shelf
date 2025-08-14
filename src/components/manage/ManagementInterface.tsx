'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CollectionSidebar } from './CollectionSidebar';
import { BookmarkList } from './BookmarkList';
import { BookmarkForm } from './BookmarkForm';
import { useBookmarks } from '@/lib/bookmark-context';
import { useTranslations } from '@/lib/language-context';
import { FilterState, BookmarkFormData } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export function ManagementInterface() {
  const { data, loading, getBookmarksByCollection } = useBookmarks();
  const t = useTranslations();
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(
    data.collections[0]?.id || null
  );
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    tags: [],
    collection: null,
    pinned: undefined
  });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <motion.div
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const selectedCollection = selectedCollectionId 
    ? data.collections.find(c => c.id === selectedCollectionId)
    : null;

  const bookmarks = selectedCollectionId 
    ? getBookmarksByCollection(selectedCollectionId)
    : [];

  const handleAddBookmark = () => {
    setEditingBookmark(null);
    setIsFormOpen(true);
  };

  const handleEditBookmark = (bookmarkId: string) => {
    setEditingBookmark(bookmarkId);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingBookmark(null);
  };

  const handleFormSubmit = (data: BookmarkFormData) => {
    // The form will handle the actual submission
    handleFormClose();
  };

  if (data.collections.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[500px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white rounded-lg p-8 shadow-lg max-w-md"
        >
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">{t.manage.noCollections}</h2>
          <p className="text-gray-600 mb-6">
            {t.manage.noCollectionsDesc}
          </p>
          <motion.button
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {t.manage.createFirstCollection}
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-80px)] bg-gray-50">
      {/* Sidebar */}
      <CollectionSidebar
        collections={data.collections}
        selectedCollectionId={selectedCollectionId}
        onCollectionSelect={setSelectedCollectionId}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedCollection && (
          <BookmarkList
            collection={selectedCollection}
            bookmarks={bookmarks}
            filters={filters}
            onFiltersChange={setFilters}
            onAddBookmark={handleAddBookmark}
            onEditBookmark={handleEditBookmark}
          />
        )}
      </div>

      {/* Bookmark Form Sheet */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col">
          <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
            <SheetHeader>
              <SheetTitle>
                {editingBookmark ? t.form.editBookmark : t.form.addBookmark}
              </SheetTitle>
            </SheetHeader>
          </div>
          <div className="flex-1 px-6 py-4 overflow-y-auto">
            <BookmarkForm
              collectionId={selectedCollectionId || ''}
              bookmarkId={editingBookmark}
              onSubmit={handleFormSubmit}
              onCancel={handleFormClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
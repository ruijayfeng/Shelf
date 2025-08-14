'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Search, Plus, Filter, Grid, List, MoreHorizontal, ExternalLink, Pin, Edit, Trash2, GripVertical } from 'lucide-react';
import { Collection, Bookmark, FilterState } from '@/lib/types';
import { useBookmarks } from '@/lib/bookmark-context';
import { useTranslations } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, extractDomain, formatDate } from '@/lib/utils';
import Image from 'next/image';

interface BookmarkListProps {
  collection: Collection;
  bookmarks: Bookmark[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onAddBookmark: () => void;
  onEditBookmark: (id: string) => void;
}

export function BookmarkList({
  collection,
  bookmarks,
  filters,
  onFiltersChange,
  onAddBookmark,
  onEditBookmark
}: BookmarkListProps) {
  const { deleteBookmark, toggleBookmarkPin, getAllTags, reorderBookmarks } = useBookmarks();
  const t = useTranslations();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedBookmarks, setSelectedBookmarks] = useState<Set<string>>(new Set());
  const [isDragDisabled, setIsDragDisabled] = useState(false);

  const allTags = getAllTags();

  // Disable drag when there are active filters
  const hasFilters = Boolean(filters.search) || filters.tags.length > 0 || filters.pinned !== undefined;

  // Filter bookmarks based on current filters
  const filteredBookmarks = useMemo(() => {
    const filtered = bookmarks.filter(bookmark => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          bookmark.title.toLowerCase().includes(searchLower) ||
          bookmark.url.toLowerCase().includes(searchLower) ||
          (bookmark.description && bookmark.description.toLowerCase().includes(searchLower)) ||
          (bookmark.tags && bookmark.tags.some(tag => tag.toLowerCase().includes(searchLower)));
        
        if (!matchesSearch) return false;
      }

      // Tag filters
      if (filters.tags.length > 0) {
        const hasMatchingTag = bookmark.tags?.some(tag => filters.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Pinned filter
      if (filters.pinned !== undefined) {
        if (filters.pinned && !bookmark.pinned) return false;
        if (!filters.pinned && bookmark.pinned) return false;
      }

      return true;
    });

    // Sort bookmarks: pinned first, then by order
    return filtered.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.order - b.order;
    });
  }, [bookmarks, filters]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;
    if (hasFilters) return; // Don't allow reordering when filters are active

    const items = Array.from(filteredBookmarks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update the order of bookmarks
    reorderBookmarks(collection.id, items);
  };

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleTagFilter = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    
    onFiltersChange({ ...filters, tags: newTags });
  };

  const handleDeleteBookmark = (id: string) => {
    if (confirm(t.messages.confirmDeleteBookmark)) {
      deleteBookmark(id);
    }
  };

  const handleTogglePin = (id: string) => {
    toggleBookmarkPin(id);
  };

  const handleBookmarkSelect = (id: string) => {
    const newSelected = new Set(selectedBookmarks);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedBookmarks(newSelected);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 220,
        damping: 30
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{collection.icon || '📚'}</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{collection.name}</h1>
              <p className="text-sm text-gray-600">
                {filteredBookmarks.length} of {bookmarks.length} bookmarks
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            
            <Button onClick={onAddBookmark}>
              <Plus className="h-4 w-4 mr-2" />
              {t.manage.addBookmark}
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={t.manage.search}
                value={filters.search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              {t.common.filter}
            </Button>
          </div>

          {/* Tag Filters */}
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700">{t.form.tags}:</span>
              {allTags.slice(0, 10).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagFilter(tag)}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-full transition-colors",
                    filters.tags.includes(tag)
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {filteredBookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <div className="text-6xl mb-4">{collection.icon || '📚'}</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {filters.search || filters.tags.length > 0 ? t.common.noResults : t.manage.noCollections.replace('Collections', 'bookmarks')}
            </h3>
            <p className="text-center mb-6 max-w-md">
              {filters.search || filters.tags.length > 0 
                ? (t.common.search + ' ' + t.common.filter).toLowerCase()
                : t.manage.noCollectionsDesc.replace('合集', '书签').replace('collection', 'bookmark')
              }
            </p>
            <Button onClick={onAddBookmark}>
              <Plus className="h-4 w-4 mr-2" />
              {t.manage.addBookmark}
            </Button>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="bookmarks" direction={viewMode === 'grid' ? 'horizontal' : 'vertical'}>
              {(provided, snapshot) => (
                <motion.div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    viewMode === 'grid' 
                      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                      : "space-y-4"
                  )}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence>
                    {filteredBookmarks.map((bookmark, index) => (
                      <Draggable
                        key={bookmark.id}
                        draggableId={bookmark.id}
                        index={index}
                        isDragDisabled={hasFilters}
                      >
                        {(provided, snapshot) => (
                          <motion.div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            key={bookmark.id}
                            variants={itemVariants}
                            layout
                            className={cn(
                              "group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200",
                              viewMode === 'grid' ? "h-64" : "h-24 flex",
                              snapshot.isDragging && "ring-2 ring-blue-500 shadow-xl",
                              hasFilters && "cursor-default"
                            )}
                          >
                  {/* Grid View */}
                  {viewMode === 'grid' && (
                    <div className="h-full flex flex-col">
                      {/* Header */}
                      <div className="p-4 flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            {!hasFilters && (
                              <div
                                {...provided.dragHandleProps}
                                className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                              >
                                <GripVertical className="h-3 w-3 text-gray-400" />
                              </div>
                            )}
                            {bookmark.favicon && (
                              <div className="w-4 h-4 flex-shrink-0">
                                <Image
                                  src={bookmark.favicon}
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="w-full h-full object-cover rounded"
                                />
                              </div>
                            )}
                            <span className="text-xs text-gray-500 truncate">
                              {extractDomain(bookmark.url)}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {bookmark.pinned && (
                              <Pin className="h-3 w-3 text-amber-500 fill-current" />
                            )}
                            <button
                              onClick={() => handleTogglePin(bookmark.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Pin className={cn(
                                "h-3 w-3",
                                bookmark.pinned ? "text-amber-500 fill-current" : "text-gray-400"
                              )} />
                            </button>
                          </div>
                        </div>

                        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2">
                          {bookmark.title}
                        </h3>
                        
                        {bookmark.description && (
                          <p className="text-xs text-gray-600 line-clamp-3 mb-3">
                            {bookmark.description}
                          </p>
                        )}
                      </div>

                      {/* Footer */}
                      <div className="p-4 pt-0 mt-auto">
                        {bookmark.tags && bookmark.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {bookmark.tags.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                            {bookmark.tags.length > 2 && (
                              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-500 rounded">
                                +{bookmark.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {formatDate(bookmark.updatedAt)}
                          </span>
                          
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => window.open(bookmark.url, '_blank')}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <ExternalLink className="h-3 w-3 text-gray-400" />
                            </button>
                            <button
                              onClick={() => onEditBookmark(bookmark.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Edit className="h-3 w-3 text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteBookmark(bookmark.id)}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Trash2 className="h-3 w-3 text-gray-400" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* List View */}
                  {viewMode === 'list' && (
                    <div className="flex items-center p-4 w-full">
                      {!hasFilters && (
                        <div
                          {...provided.dragHandleProps}
                          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing mr-3"
                        >
                          <GripVertical className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        {bookmark.favicon && (
                          <div className="w-4 h-4 flex-shrink-0">
                            <Image
                              src={bookmark.favicon}
                              alt=""
                              width={16}
                              height={16}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 truncate">
                              {bookmark.title}
                            </h3>
                            {bookmark.pinned && (
                              <Pin className="h-3 w-3 text-amber-500 fill-current flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {extractDomain(bookmark.url)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 flex-shrink-0">
                        {bookmark.tags && bookmark.tags.length > 0 && (
                          <div className="flex space-x-1">
                            {bookmark.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <span className="text-xs text-gray-500">
                          {formatDate(bookmark.updatedAt)}
                        </span>
                        
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => window.open(bookmark.url, '_blank')}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          </button>
                          <button
                            onClick={() => onEditBookmark(bookmark.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Edit className="h-3 w-3 text-gray-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteBookmark(bookmark.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Trash2 className="h-3 w-3 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                          </motion.div>
                        )}
                      </Draggable>
                    ))}
                  </AnimatePresence>
                  {provided.placeholder}
                </motion.div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
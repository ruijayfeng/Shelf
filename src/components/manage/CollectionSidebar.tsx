'use client';

import { motion } from 'framer-motion';
import { Plus, Settings, Folder } from 'lucide-react';
import { Collection } from '@/lib/types';
import { useBookmarks } from '@/lib/bookmark-context';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface CollectionSidebarProps {
  collections: Collection[];
  selectedCollectionId: string | null;
  onCollectionSelect: (id: string) => void;
}

export function CollectionSidebar({ 
  collections, 
  selectedCollectionId, 
  onCollectionSelect 
}: CollectionSidebarProps) {
  const { getBookmarksByCollection } = useBookmarks();

  const sortedCollections = [...collections].sort((a, b) => a.order - b.order);

  const sidebarVariants = {
    hidden: { x: -300, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 220,
        damping: 30,
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 }
  };

  return (
    <motion.div
      className="w-72 bg-white border-r border-gray-200 flex flex-col"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Collections</h2>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Collections List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {sortedCollections.map((collection) => {
          const bookmarkCount = getBookmarksByCollection(collection.id).length;
          const isSelected = selectedCollectionId === collection.id;

          return (
            <motion.div
              key={collection.id}
              variants={itemVariants}
              className={cn(
                "relative group rounded-lg transition-all duration-200 cursor-pointer",
                isSelected 
                  ? "bg-blue-50 text-blue-700 shadow-sm" 
                  : "hover:bg-gray-50 text-gray-700"
              )}
              onClick={() => onCollectionSelect(collection.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center p-3">
                {/* Collection Icon */}
                <div 
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm mr-3 flex-shrink-0",
                    isSelected ? "bg-blue-100" : "bg-gray-100"
                  )}
                  style={{ 
                    backgroundColor: collection.color ? `${collection.color}20` : undefined 
                  }}
                >
                  {collection.icon || <Folder className="h-4 w-4" />}
                </div>

                {/* Collection Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {collection.name}
                  </h3>
                  <p className={cn(
                    "text-xs",
                    isSelected ? "text-blue-600" : "text-gray-500"
                  )}>
                    {bookmarkCount} {bookmarkCount === 1 ? 'bookmark' : 'bookmarks'}
                  </p>
                </div>

                {/* Settings Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto w-auto",
                    isSelected && "opacity-100"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    // Handle collection settings
                  }}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>

              {/* Active indicator */}
              {isSelected && (
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"
                  layoutId="collection-indicator"
                  transition={{ type: "spring", stiffness: 220, damping: 30 }}
                />
              )}

              {/* Collection color accent */}
              {collection.color && (
                <div
                  className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full opacity-60"
                  style={{ backgroundColor: collection.color }}
                />
              )}
            </motion.div>
          );
        })}

        {/* Add Collection Button */}
        <motion.div
          variants={itemVariants}
          className="mt-4"
        >
          <Button
            variant="outline"
            className="w-full justify-start text-gray-600 border-dashed"
          >
            <Plus className="h-4 w-4 mr-3" />
            New Collection
          </Button>
        </motion.div>
      </div>

      {/* Stats Footer */}
      <motion.div
        variants={itemVariants}
        className="p-4 border-t border-gray-200 bg-gray-50"
      >
        <div className="text-sm text-gray-600">
          <div className="flex justify-between items-center">
            <span>Total Collections</span>
            <span className="font-medium">{collections.length}</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span>Total Bookmarks</span>
            <span className="font-medium">
              {collections.reduce((total, collection) => 
                total + getBookmarksByCollection(collection.id).length, 0
              )}
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Collection, Bookmark } from '@/lib/types';
import { BookmarkCard } from './BookmarkCard';
import { cn } from '@/lib/utils';

interface BookmarkStackProps {
  collection: Collection;
  bookmarks: Bookmark[];
  onExpand?: (collection: Collection) => void;
}

export function BookmarkStack({ collection, bookmarks, onExpand }: BookmarkStackProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Show up to 3 cards in the stack
  const displayedBookmarks = bookmarks.slice(0, 3);
  const remainingCount = Math.max(0, bookmarks.length - 3);

  const handleStackClick = () => {
    if (onExpand) {
      onExpand(collection);
    }
  };

  const stackVariants = {
    initial: {
      scale: 1,
      y: 0,
    },
    hover: {
      scale: 1.02,
      y: -4,
      transition: {
        type: "spring",
        stiffness: 220,
        damping: 30,
        mass: 1
      }
    }
  };

  if (bookmarks.length === 0) {
    return (
      <motion.div
        className="bookmark-stack relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="w-80 h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500">
          <span className="text-4xl mb-2">{collection.icon || '📚'}</span>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">{collection.name}</h3>
          <p className="text-sm">No bookmarks yet</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="bookmark-stack relative cursor-pointer"
      variants={stackVariants}
      initial="initial"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleStackClick}
      style={{ perspective: '1000px' }}
    >
      {/* Collection header */}
      <motion.div
        className="absolute -top-12 left-0 right-0 z-20 flex items-center justify-between px-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{collection.icon || '📚'}</span>
          <h3 className="text-lg font-semibold text-gray-800">{collection.name}</h3>
        </div>
        <span className="text-sm text-gray-500 bg-white/80 backdrop-blur-sm rounded-full px-2 py-1">
          {bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
        </span>
      </motion.div>

      {/* Stacked cards */}
      <div className="relative">
        <AnimatePresence>
          {displayedBookmarks.map((bookmark, index) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              stackIndex={index}
              isExpanded={false}
              className={cn(
                "absolute top-0 left-0",
                index === 0 && "relative"
              )}
            />
          ))}
        </AnimatePresence>

        {/* Remaining count indicator */}
        {remainingCount > 0 && (
          <motion.div
            className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center text-sm font-semibold shadow-lg z-20"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 30 }}
          >
            +{remainingCount}
          </motion.div>
        )}

        {/* Collection color accent */}
        {collection.color && (
          <motion.div
            className="absolute -bottom-1 left-4 right-4 h-1 rounded-full opacity-60"
            style={{ backgroundColor: collection.color }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: isHovered ? 1 : 0.7 }}
            transition={{ type: "spring", stiffness: 220, damping: 30 }}
          />
        )}
      </div>

      {/* Hover glow effect */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-xl opacity-0"
        style={{
          background: `radial-gradient(circle at center, ${collection.color || '#3b82f6'}20, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
}
'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { BookmarkStack } from './BookmarkStack';
import { ExpandedCollection } from './ExpandedCollection';
import { useBookmarks } from '@/lib/bookmark-context';
import { Collection } from '@/lib/types';
import { Plus } from 'lucide-react';

export function BookmarkStacksDisplay() {
  const { data, loading } = useBookmarks();
  const [expandedCollection, setExpandedCollection] = useState<Collection | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <motion.div
          className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        />
      </div>
    );
  }

  const sortedCollections = [...data.collections].sort((a, b) => a.order - b.order);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    show: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 220,
        damping: 30,
        mass: 1
      }
    }
  };

  const handleExpandCollection = (collection: Collection) => {
    setExpandedCollection(collection);
  };

  const handleCloseExpanded = () => {
    setExpandedCollection(null);
  };

  if (data.collections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl p-12 shadow-lg max-w-md"
        >
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to Shelf</h2>
          <p className="text-gray-600 mb-6">
            Create your first collection to start organizing your bookmarks in beautiful 3D stacks.
          </p>
          <motion.button
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="h-5 w-5 mr-2" />
            Create Collection
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-16 py-12"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {sortedCollections.map((collection) => (
          <motion.div
            key={collection.id}
            variants={itemVariants}
            className="flex justify-center"
          >
            <BookmarkStack
              collection={collection}
              bookmarks={data.bookmarks
                .filter(b => b.collectionId === collection.id)
                .sort((a, b) => {
                  // Pinned bookmarks first
                  if (a.pinned && !b.pinned) return -1;
                  if (!a.pinned && b.pinned) return 1;
                  return a.order - b.order;
                })}
              onExpand={handleExpandCollection}
            />
          </motion.div>
        ))}

        {/* Add new collection placeholder */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center"
        >
          <motion.div
            className="w-80 h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-500 cursor-pointer group hover:border-blue-400 hover:text-blue-600 transition-all duration-200"
            whileHover={{ 
              scale: 1.02,
              y: -4,
              transition: { type: "spring", stiffness: 220, damping: 30 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-50 transition-colors"
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <Plus className="h-6 w-6" />
            </motion.div>
            <h3 className="text-lg font-semibold mb-1">New Collection</h3>
            <p className="text-sm">Click to create</p>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Expanded collection modal */}
      {expandedCollection && (
        <ExpandedCollection
          collection={expandedCollection}
          bookmarks={data.bookmarks
            .filter(b => b.collectionId === expandedCollection.id)
            .sort((a, b) => {
              if (a.pinned && !b.pinned) return -1;
              if (!a.pinned && b.pinned) return 1;
              return a.order - b.order;
            })}
          onClose={handleCloseExpanded}
        />
      )}
    </>
  );
}
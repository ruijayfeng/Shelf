'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect } from 'react';
import { X, Settings, Plus } from 'lucide-react';
import { Collection, Bookmark } from '@/lib/types';
import { BookmarkCard } from './BookmarkCard';
import { useTranslations } from '@/lib/language-context';
import { Button } from '@/components/ui/button';

interface ExpandedCollectionProps {
  collection: Collection;
  bookmarks: Bookmark[];
  onClose: () => void;
}

export function ExpandedCollection({ collection, bookmarks, onClose }: ExpandedCollectionProps) {
  const t = useTranslations();
  
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 220,
        damping: 30,
        mass: 1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: 50,
      transition: { duration: 0.2 }
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2,
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { 
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

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-7xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
          variants={modalVariants}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{collection.icon || '📚'}</span>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{collection.name}</h2>
                  <p className="text-sm text-gray-600">
                    {bookmarks.length} {bookmarks.length === 1 ? t.home.bookmark : t.home.bookmarks}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t.manage.addBookmark}
                </Button>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {bookmarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <div className="text-6xl mb-4">{collection.icon || '📚'}</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">{t.manage.noCollections.replace('Collections', 'bookmarks')}</h3>
                <p className="text-center mb-6 max-w-md">
                  {t.home.subtitle.replace('合集', '书签').replace('collection', 'bookmark')}
                </p>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t.manage.addBookmark}
                </Button>
              </div>
            ) : (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {bookmarks.map((bookmark, index) => (
                  <motion.div
                    key={bookmark.id}
                    variants={cardVariants}
                    custom={index}
                  >
                    <BookmarkCard
                      bookmark={bookmark}
                      isExpanded={true}
                      className="w-full h-48 transform-none"
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Collection color accent */}
          {collection.color && (
            <div
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: collection.color }}
            />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
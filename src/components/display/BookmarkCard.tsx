'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Pin } from 'lucide-react';
import { Bookmark } from '@/lib/types';
import { cn, extractDomain } from '@/lib/utils';
import Image from 'next/image';

interface BookmarkCardProps {
  bookmark: Bookmark;
  stackIndex?: number;
  isExpanded?: boolean;
  onClick?: () => void;
  className?: string;
}

export function BookmarkCard({ 
  bookmark, 
  stackIndex = 0, 
  isExpanded = false,
  onClick,
  className 
}: BookmarkCardProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExpanded && bookmark.url) {
      window.open(bookmark.url, '_blank');
    } else if (onClick) {
      onClick();
    }
  };

  const cardVariants = {
    stacked: {
      y: stackIndex * 4,
      rotate: stackIndex * 2 - 2,
      scale: 1 - stackIndex * 0.02,
      zIndex: 10 - stackIndex,
    },
    expanded: {
      y: 0,
      rotate: 0,
      scale: 1,
      zIndex: 10,
    },
    hover: {
      y: stackIndex * 4 - 8,
      rotate: stackIndex * 2 - 2,
      scale: 1 - stackIndex * 0.02 + 0.05,
      zIndex: 15,
    }
  };

  const springTransition = {
    type: "spring",
    stiffness: 220,
    damping: 30,
    mass: 1
  };

  return (
    <motion.div
      layout
      layoutId={`bookmark-${bookmark.id}`}
      variants={cardVariants}
      animate={isExpanded ? "expanded" : "stacked"}
      whileHover={!isExpanded ? "hover" : undefined}
      transition={springTransition}
      onClick={handleClick}
      className={cn(
        "bookmark-card relative w-80 h-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden cursor-pointer",
        "transform-gpu perspective-1000",
        isExpanded && "cursor-pointer hover:shadow-xl",
        className
      )}
      style={{
        backfaceVisibility: 'hidden',
        transformStyle: 'preserve-3d'
      }}
    >
      {/* Pinned indicator */}
      {bookmark.pinned && (
        <div className="absolute top-3 right-3 z-20">
          <Pin className="h-4 w-4 text-amber-500 fill-current" />
        </div>
      )}

      {/* Background image */}
      {bookmark.image && (
        <div className="absolute inset-0 opacity-10">
          <Image
            src={bookmark.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 400px) 100vw, 400px"
          />
        </div>
      )}

      {/* Content */}
      <div className="relative h-full p-6 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Header with favicon and domain */}
          <div className="flex items-center space-x-3">
            {bookmark.favicon ? (
              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={bookmark.favicon}
                  alt=""
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex-shrink-0" />
            )}
            <span className="text-sm text-gray-500 truncate">
              {extractDomain(bookmark.url)}
            </span>
            {isExpanded && (
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto flex-shrink-0" />
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 leading-tight">
            {bookmark.title}
          </h3>

          {/* Description */}
          {bookmark.description && (
            <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
              {bookmark.description}
            </p>
          )}
        </div>

        {/* Tags */}
        {bookmark.tags && bookmark.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {bookmark.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full"
              >
                {tag}
              </span>
            ))}
            {bookmark.tags.length > 3 && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-500 rounded-full">
                +{bookmark.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </motion.div>
  );
}
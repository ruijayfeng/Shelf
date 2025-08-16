/**
 * Conflict Resolver Component
 * Handles sync conflicts between local and remote bookmark data
 * Provides visual comparison and resolution options
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  GitBranch,
  GitMerge,
  Monitor,
  Cloud,
  Calendar,
  BookmarkIcon,
  FolderIcon,
  ArrowRight,
  Check,
  X,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ConflictResolverProps, ConflictResolution, BookmarkData, Bookmark, Collection } from '@/lib/types';
import { useTranslations } from '@/lib/language-context';
import { cn } from '@/lib/utils';

/**
 * Data Statistics Component
 */
function DataStats({ 
  data, 
  label, 
  timestamp,
  className 
}: { 
  data: BookmarkData; 
  label: string; 
  timestamp: string;
  className?: string;
}) {
  const bookmarkCount = data.bookmarks.length;
  const collectionCount = data.collections.length;
  const tagCount = new Set(data.bookmarks.flatMap(b => b.tags || [])).size;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-sm">{label}</h3>
        <span className="text-xs text-gray-500">
          {new Date(timestamp).toLocaleString()}
        </span>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-blue-600">{collectionCount}</div>
          <div className="text-xs text-gray-600">Collections</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-green-600">{bookmarkCount}</div>
          <div className="text-xs text-gray-600">Bookmarks</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-purple-600">{tagCount}</div>
          <div className="text-xs text-gray-600">Tags</div>
        </div>
      </div>
    </div>
  );
}

/**
 * Data Comparison Component
 */
function DataComparison({ 
  localData, 
  remoteData, 
  localTimestamp, 
  remoteTimestamp 
}: {
  localData: BookmarkData;
  remoteData: BookmarkData;
  localTimestamp: string;
  remoteTimestamp: string;
}) {
  const [showDetails, setShowDetails] = useState(false);

  // Calculate differences
  const differences = useMemo(() => {
    const localBookmarkIds = new Set(localData.bookmarks.map(b => b.id));
    const remoteBookmarkIds = new Set(remoteData.bookmarks.map(b => b.id));
    const localCollectionIds = new Set(localData.collections.map(c => c.id));
    const remoteCollectionIds = new Set(remoteData.collections.map(c => c.id));

    return {
      localOnlyBookmarks: localData.bookmarks.filter(b => !remoteBookmarkIds.has(b.id)),
      remoteOnlyBookmarks: remoteData.bookmarks.filter(b => !localBookmarkIds.has(b.id)),
      localOnlyCollections: localData.collections.filter(c => !remoteCollectionIds.has(c.id)),
      remoteOnlyCollections: remoteData.collections.filter(c => !localCollectionIds.has(c.id)),
      modifiedBookmarks: localData.bookmarks.filter(localBookmark => {
        const remoteBookmark = remoteData.bookmarks.find(b => b.id === localBookmark.id);
        return remoteBookmark && (
          localBookmark.updatedAt !== remoteBookmark.updatedAt ||
          localBookmark.title !== remoteBookmark.title ||
          localBookmark.url !== remoteBookmark.url
        );
      }),
      modifiedCollections: localData.collections.filter(localCollection => {
        const remoteCollection = remoteData.collections.find(c => c.id === localCollection.id);
        return remoteCollection && localCollection.name !== remoteCollection.name;
      })
    };
  }, [localData, remoteData]);

  const hasDifferences = Object.values(differences).some(arr => arr.length > 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Local Data */}
        <Card className="p-4 border-blue-200 bg-blue-50/50">
          <DataStats
            data={localData}
            label="Local Data"
            timestamp={localTimestamp}
          />
        </Card>

        {/* Remote Data */}
        <Card className="p-4 border-green-200 bg-green-50/50">
          <DataStats
            data={remoteData}
            label="Remote Data"
            timestamp={remoteTimestamp}
          />
        </Card>
      </div>

      {/* Differences Toggle */}
      {hasDifferences && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2"
          >
            {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showDetails ? 'Hide' : 'Show'} Differences
          </Button>
        </div>
      )}

      {/* Detailed Differences */}
      <AnimatePresence>
        {showDetails && hasDifferences && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 border-t pt-4"
          >
            {/* Modified Items */}
            {differences.modifiedBookmarks.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-yellow-700">
                  Modified Bookmarks ({differences.modifiedBookmarks.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {differences.modifiedBookmarks.map(bookmark => (
                    <div key={bookmark.id} className="text-xs p-2 bg-yellow-50 rounded border">
                      <div className="font-medium">{bookmark.title}</div>
                      <div className="text-gray-600 truncate">{bookmark.url}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Local Only Items */}
            {(differences.localOnlyBookmarks.length > 0 || differences.localOnlyCollections.length > 0) && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-blue-700">
                  Local Only ({differences.localOnlyBookmarks.length + differences.localOnlyCollections.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {differences.localOnlyCollections.map(collection => (
                    <div key={collection.id} className="text-xs p-2 bg-blue-50 rounded border flex items-center gap-2">
                      <FolderIcon className="w-3 h-3" />
                      <span className="font-medium">{collection.name}</span>
                    </div>
                  ))}
                  {differences.localOnlyBookmarks.map(bookmark => (
                    <div key={bookmark.id} className="text-xs p-2 bg-blue-50 rounded border flex items-center gap-2">
                      <BookmarkIcon className="w-3 h-3" />
                      <span className="font-medium truncate">{bookmark.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Remote Only Items */}
            {(differences.remoteOnlyBookmarks.length > 0 || differences.remoteOnlyCollections.length > 0) && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-green-700">
                  Remote Only ({differences.remoteOnlyBookmarks.length + differences.remoteOnlyCollections.length})
                </h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {differences.remoteOnlyCollections.map(collection => (
                    <div key={collection.id} className="text-xs p-2 bg-green-50 rounded border flex items-center gap-2">
                      <FolderIcon className="w-3 h-3" />
                      <span className="font-medium">{collection.name}</span>
                    </div>
                  ))}
                  {differences.remoteOnlyBookmarks.map(bookmark => (
                    <div key={bookmark.id} className="text-xs p-2 bg-green-50 rounded border flex items-center gap-2">
                      <BookmarkIcon className="w-3 h-3" />
                      <span className="font-medium truncate">{bookmark.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * Resolution Option Component
 */
function ResolutionOption({
  icon: Icon,
  title,
  description,
  resolution,
  isSelected,
  isRecommended = false,
  onClick
}: {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  resolution: ConflictResolution;
  isSelected: boolean;
  isRecommended?: boolean;
  onClick: (resolution: ConflictResolution) => void;
}) {
  return (
    <button
      onClick={() => onClick(resolution)}
      className={cn(
        'w-full p-4 border-2 rounded-lg text-left transition-all',
        'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : 'border-gray-200 hover:border-gray-300',
        isRecommended && !isSelected && 'border-green-300 bg-green-50/50'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isSelected 
            ? 'bg-blue-500 text-white' 
            : isRecommended 
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 text-gray-600'
        )}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">{title}</h3>
            {isRecommended && (
              <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                Recommended
              </span>
            )}
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </p>
        </div>
        
        <div className={cn(
          'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center',
          isSelected 
            ? 'border-blue-500 bg-blue-500' 
            : 'border-gray-300'
        )}>
          {isSelected && <Check className="w-3 h-3 text-white" />}
        </div>
      </div>
    </button>
  );
}

/**
 * Main Conflict Resolver Component
 */
export default function ConflictResolver({
  conflict,
  onResolve,
  onCancel,
  isResolving = false
}: ConflictResolverProps) {
  const [selectedResolution, setSelectedResolution] = useState<ConflictResolution>('merge');
  const t = useTranslations();

  const resolutionOptions = [
    {
      resolution: 'local' as ConflictResolution,
      icon: Monitor,
      title: 'Keep Local Changes',
      description: 'Use your local bookmarks and overwrite remote data',
      isRecommended: false
    },
    {
      resolution: 'remote' as ConflictResolution,
      icon: Cloud,
      title: 'Use Remote Changes',
      description: 'Replace local bookmarks with remote data from GitHub',
      isRecommended: false
    },
    {
      resolution: 'merge' as ConflictResolution,
      icon: GitMerge,
      title: 'Merge Changes',
      description: 'Automatically combine local and remote changes when possible',
      isRecommended: true
    }
  ];

  const handleResolve = () => {
    onResolve(selectedResolution);
  };

  const timeDiff = Math.abs(
    new Date(conflict.localTimestamp).getTime() - 
    new Date(conflict.remoteTimestamp).getTime()
  );
  const hoursDiff = Math.round(timeDiff / (1000 * 60 * 60));

  return (
    <Dialog open={true} onOpenChange={onCancel}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Sync Conflict Detected
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Conflict Summary */}
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <GitBranch className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">
                  Conflicting Changes Detected
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                  {conflict.message}
                  {hoursDiff > 0 && (
                    <span className="block mt-1">
                      Local and remote data were modified {hoursDiff} hours apart.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Data Comparison */}
          <DataComparison
            localData={conflict.localData}
            remoteData={conflict.remoteData}
            localTimestamp={conflict.localTimestamp}
            remoteTimestamp={conflict.remoteTimestamp}
          />

          {/* Resolution Options */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 dark:text-gray-100">
              Choose Resolution Strategy
            </h3>
            
            <div className="space-y-3">
              {resolutionOptions.map((option) => (
                <ResolutionOption
                  key={option.resolution}
                  icon={option.icon}
                  title={option.title}
                  description={option.description}
                  resolution={option.resolution}
                  isSelected={selectedResolution === option.resolution}
                  isRecommended={option.isRecommended}
                  onClick={setSelectedResolution}
                />
              ))}
            </div>
          </div>

          {/* Warning for destructive actions */}
          {(selectedResolution === 'local' || selectedResolution === 'remote') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-red-700 dark:text-red-300 text-xs">
                  <strong>Warning:</strong> This action will permanently {selectedResolution === 'local' ? 'overwrite remote' : 'replace local'} data. 
                  Consider creating a backup first.
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isResolving}
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                // Create backup before resolving (if supported)
                handleResolve();
              }}
              disabled={isResolving}
              className="flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Resolve Conflict
            </Button>
            
            <Button
              onClick={handleResolve}
              disabled={isResolving}
              className="flex items-center gap-2"
            >
              {isResolving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isResolving ? 'Resolving...' : 'Apply Resolution'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
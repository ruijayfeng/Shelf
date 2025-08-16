/**
 * Sync Status Component
 * Displays GitHub synchronization status with visual indicators
 * Supports compact and detailed modes
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  Upload,
  Download,
  Clock,
  WifiOff
} from 'lucide-react';
import { SyncStatusProps, SyncStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatRateLimitReset } from '@/lib/github';

/**
 * Get status icon based on sync status
 */
function getStatusIcon(status: SyncStatus, isAnimated: boolean = true) {
  const iconClass = cn('w-4 h-4', {
    'animate-spin': isAnimated && (status === 'syncing' || status === 'uploading' || status === 'downloading')
  });

  switch (status) {
    case 'idle':
      return <Cloud className={iconClass} />;
    case 'syncing':
      return <RefreshCw className={iconClass} />;
    case 'uploading':
      return <Upload className={iconClass} />;
    case 'downloading':
      return <Download className={iconClass} />;
    case 'success':
      return <CheckCircle className={iconClass} />;
    case 'error':
      return <AlertCircle className={iconClass} />;
    case 'conflict':
      return <AlertTriangle className={iconClass} />;
    default:
      return <CloudOff className={iconClass} />;
  }
}

/**
 * Get status color based on sync status
 */
function getStatusColor(status: SyncStatus): string {
  switch (status) {
    case 'idle':
      return 'text-gray-500 dark:text-gray-400';
    case 'syncing':
    case 'uploading':
    case 'downloading':
      return 'text-blue-500 dark:text-blue-400';
    case 'success':
      return 'text-green-500 dark:text-green-400';
    case 'error':
      return 'text-red-500 dark:text-red-400';
    case 'conflict':
      return 'text-yellow-500 dark:text-yellow-400';
    default:
      return 'text-gray-500 dark:text-gray-400';
  }
}

/**
 * Get status background based on sync status
 */
function getStatusBackground(status: SyncStatus): string {
  switch (status) {
    case 'syncing':
    case 'uploading':
    case 'downloading':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    case 'success':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    case 'error':
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    case 'conflict':
      return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    default:
      return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  }
}

/**
 * Get user-friendly status message
 */
function getStatusMessage(status: SyncStatus, lastSync?: string, error?: string): string {
  switch (status) {
    case 'idle':
      return lastSync ? `Last sync: ${formatTime(lastSync)}` : 'Ready to sync';
    case 'syncing':
      return 'Synchronizing...';
    case 'uploading':
      return 'Uploading to GitHub...';
    case 'downloading':
      return 'Downloading from GitHub...';
    case 'success':
      return lastSync ? `Synced ${formatTime(lastSync)}` : 'Sync successful';
    case 'error':
      return error || 'Sync failed';
    case 'conflict':
      return 'Sync conflict - action required';
    default:
      return 'Not connected';
  }
}

/**
 * Format timestamp for display
 */
function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'just now';
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // More than 24 hours
  const days = Math.floor(diff / 86400000);
  return `${days}d ago`;
}

/**
 * Compact Sync Status Component
 * Shows minimal status indicator
 */
export function CompactSyncStatus({ 
  status, 
  lastSync, 
  error,
  className 
}: SyncStatusProps & { className?: string }) {
  const statusColor = getStatusColor(status);
  const message = getStatusMessage(status, lastSync, error);

  return (
    <div 
      className={cn(
        'flex items-center gap-2 text-sm',
        statusColor,
        className
      )}
      title={message}
    >
      {getStatusIcon(status)}
      <span className="hidden sm:inline truncate max-w-32">
        {status === 'syncing' || status === 'uploading' || status === 'downloading' 
          ? 'Syncing...' 
          : status === 'success' && lastSync
            ? formatTime(lastSync)
            : status === 'error'
              ? 'Error'
              : status === 'conflict'
                ? 'Conflict'
                : 'Idle'
        }
      </span>
    </div>
  );
}

/**
 * Detailed Sync Status Component
 * Shows full status information with progress
 */
export function DetailedSyncStatus({ 
  status, 
  lastSync, 
  error, 
  showDetails = true 
}: SyncStatusProps) {
  const statusColor = getStatusColor(status);
  const statusBg = getStatusBackground(status);
  const message = getStatusMessage(status, lastSync, error);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          'rounded-lg border p-3 transition-colors',
          statusBg
        )}
      >
        <div className="flex items-center gap-3">
          <div className={statusColor}>
            {getStatusIcon(status)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className={cn('font-medium text-sm', statusColor)}>
              {getStatusTitle(status)}
            </div>
            
            {showDetails && (
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">
                {message}
              </div>
            )}
          </div>
          
          {(status === 'syncing' || status === 'uploading' || status === 'downloading') && (
            <div className="flex-shrink-0">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
            </div>
          )}
        </div>
        
        {/* Progress bar for active sync operations */}
        {(status === 'syncing' || status === 'uploading' || status === 'downloading') && (
          <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <motion.div
                className="bg-current h-1 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity, 
                  repeatType: 'reverse',
                  ease: 'easeInOut'
                }}
              />
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Get status title for detailed view
 */
function getStatusTitle(status: SyncStatus): string {
  switch (status) {
    case 'idle':
      return 'Ready';
    case 'syncing':
      return 'Synchronizing';
    case 'uploading':
      return 'Uploading';
    case 'downloading':
      return 'Downloading';
    case 'success':
      return 'Synchronized';
    case 'error':
      return 'Sync Error';
    case 'conflict':
      return 'Sync Conflict';
    default:
      return 'Disconnected';
  }
}

/**
 * Sync Status Badge Component
 * Simple badge-style status indicator
 */
export function SyncStatusBadge({ 
  status, 
  lastSync, 
  error,
  size = 'sm' 
}: SyncStatusProps & { size?: 'sm' | 'md' | 'lg' }) {
  const statusColor = getStatusColor(status);
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 rounded-full border bg-white dark:bg-gray-900',
      sizeClasses[size],
      statusColor,
      'border-current/20'
    )}>
      <div className={iconSizes[size]}>
        {getStatusIcon(status, false)}
      </div>
      <span className="font-medium">
        {getStatusTitle(status)}
      </span>
    </div>
  );
}

/**
 * Connection Status Component
 * Shows GitHub connection status
 */
export function ConnectionStatus({ 
  isConnected, 
  isLoading = false,
  className 
}: { 
  isConnected: boolean; 
  isLoading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {isLoading ? (
        <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
      ) : isConnected ? (
        <Cloud className="w-4 h-4 text-green-500" />
      ) : (
        <WifiOff className="w-4 h-4 text-gray-400" />
      )}
      
      <span className={cn(
        'text-sm font-medium',
        isConnected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
      )}>
        {isLoading ? 'Connecting...' : isConnected ? 'Connected' : 'Disconnected'}
      </span>
    </div>
  );
}

/**
 * Sync Activity Indicator
 * Minimal dot indicator for active sync
 */
export function SyncActivityDot({ 
  status,
  className 
}: { 
  status: SyncStatus;
  className?: string;
}) {
  const isActive = status === 'syncing' || status === 'uploading' || status === 'downloading';
  const isSuccess = status === 'success';
  const isError = status === 'error' || status === 'conflict';
  
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'w-2 h-2 rounded-full transition-colors',
        {
          'bg-blue-500 animate-pulse': isActive,
          'bg-green-500': isSuccess,
          'bg-red-500': isError,
          'bg-gray-300 dark:bg-gray-600': !isActive && !isSuccess && !isError
        }
      )} />
    </div>
  );
}

/**
 * Main Sync Status Component (Default Export)
 * Adaptive component that shows compact or detailed view based on props
 */
export default function SyncStatus(props: SyncStatusProps) {
  if (props.compact) {
    return <CompactSyncStatus {...props} />;
  }
  
  return <DetailedSyncStatus {...props} />;
}
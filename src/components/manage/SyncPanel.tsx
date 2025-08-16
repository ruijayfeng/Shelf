/**
 * Sync Control Panel Component
 * Provides controls for GitHub synchronization settings and actions
 * Includes manual sync, settings, backup creation, and status display
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  Settings,
  Save,
  Download,
  Upload,
  Archive,
  Clock,
  AlertTriangle,
  Github,
  ExternalLink,
  MoreVertical,
  Shield,
  Timer,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DetailedSyncStatus, ConnectionStatus } from '@/components/ui/sync-status';
import { SyncPanelProps, GitHubSyncSettings, SyncAction } from '@/lib/types';
import { useAuth } from '@/lib/auth-context';
import { useTranslations } from '@/lib/language-context';
import { cn } from '@/lib/utils';

/**
 * Sync Settings Dialog Component
 */
function SyncSettingsDialog({ 
  isOpen, 
  onClose, 
  settings, 
  onSettingsChange 
}: {
  isOpen: boolean;
  onClose: () => void;
  settings: GitHubSyncSettings;
  onSettingsChange: (settings: Partial<GitHubSyncSettings>) => void;
}) {
  const [localSettings, setLocalSettings] = useState(settings);
  const t = useTranslations();

  const handleSave = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    setLocalSettings(settings);
  };

  const intervalOptions = [
    { value: 1, label: '1 minute' },
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' },
  ];

  const conflictOptions = [
    { value: 'ask', label: 'Ask me each time' },
    { value: 'local', label: 'Prefer local changes' },
    { value: 'remote', label: 'Prefer remote changes' },
    { value: 'merge', label: 'Auto-merge when possible' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Sync Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto Sync */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Automatic Synchronization</h3>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.autoSync}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  autoSync: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Enable automatic sync</span>
            </label>

            {localSettings.autoSync && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="ml-6 space-y-3"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Sync interval
                  </label>
                  <select
                    value={localSettings.syncInterval}
                    onChange={(e) => setLocalSettings(prev => ({ 
                      ...prev, 
                      syncInterval: parseInt(e.target.value) 
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {intervalOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sync Triggers */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Sync Triggers</h3>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.syncOnStartup}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  syncOnStartup: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Sync when app starts</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.syncBeforeClose}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  syncBeforeClose: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Sync before closing</span>
            </label>
          </div>

          {/* Conflict Resolution */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Conflict Resolution</h3>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                When conflicts occur
              </label>
              <select
                value={localSettings.conflictResolution}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  conflictResolution: e.target.value as any
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {conflictOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Backup Settings */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm">Backup Options</h3>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={localSettings.backupBeforeSync}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  backupBeforeSync: e.target.checked 
                }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Create backup before each sync</span>
            </label>
          </div>
        </div>

        <div className="flex justify-between gap-3 pt-4 border-t">
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Quick Action Button Component
 */
function QuickActionButton({
  icon: Icon,
  label,
  description,
  onClick,
  loading = false,
  disabled = false,
  variant = 'default'
}: {
  icon: React.ComponentType<any>;
  label: string;
  description: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'secondary';
}) {
  const variants = {
    default: 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
    primary: 'border-blue-200 hover:border-blue-300 hover:bg-blue-50 text-blue-700',
    secondary: 'border-green-200 hover:border-green-300 hover:bg-green-50 text-green-700'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'w-full p-4 border rounded-lg text-left transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant]
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {loading ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Icon className="w-5 h-5" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm">{label}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {description}
          </div>
        </div>
      </div>
    </button>
  );
}

/**
 * Main Sync Panel Component
 */
export default function SyncPanel({
  syncState,
  settings,
  onSync,
  onSettingsChange,
  onCreateBackup
}: SyncPanelProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const { isAuthenticated, isConnectedToGitHub, login, gitHubRateLimit } = useAuth();
  const t = useTranslations();

  const isSyncing = ['syncing', 'uploading', 'downloading'].includes(syncState.status);
  const hasConflict = syncState.status === 'conflict';
  const hasError = syncState.status === 'error';

  const handleManualSync = () => {
    onSync('manual');
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      await onCreateBackup();
    } finally {
      setIsCreatingBackup(false);
    }
  };

  // If not authenticated, show connection prompt
  if (!isAuthenticated) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <Github className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </div>
          
          <div>
            <h3 className="font-semibold text-lg">Connect to GitHub</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Sign in with GitHub to sync your bookmarks across devices
            </p>
          </div>
          
          <Button onClick={login} className="flex items-center gap-2">
            <Github className="w-4 h-4" />
            Connect GitHub
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <ConnectionStatus 
            isConnected={isConnectedToGitHub}
            className="flex-1"
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </Card>

      {/* Sync Status */}
      <DetailedSyncStatus
        status={syncState.status}
        lastSync={syncState.lastSync}
        error={syncState.error}
        showDetails={true}
      />

      {/* Conflict Alert */}
      {hasConflict && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">
                Sync Conflict Detected
              </h4>
              <p className="text-yellow-700 dark:text-yellow-300 text-xs mt-1">
                {syncState.conflictData?.message || 'Your local changes conflict with remote changes'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      {isConnectedToGitHub && (
        <div className="space-y-3">
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
            Quick Actions
          </h3>
          
          <div className="grid gap-3">
            <QuickActionButton
              icon={RefreshCw}
              label="Sync Now"
              description="Manually synchronize your bookmarks with GitHub"
              onClick={handleManualSync}
              loading={isSyncing}
              disabled={isSyncing}
              variant="primary"
            />
            
            <QuickActionButton
              icon={Download}
              label="Download from GitHub"
              description="Replace local data with remote bookmarks"
              onClick={() => onSync('manual')}
              loading={isSyncing}
              disabled={isSyncing}
            />
            
            <QuickActionButton
              icon={Upload}
              label="Upload to GitHub"
              description="Force upload local bookmarks to GitHub"
              onClick={() => onSync('manual')}
              loading={isSyncing}
              disabled={isSyncing}
            />
            
            <QuickActionButton
              icon={Archive}
              label="Create Backup"
              description="Create a backup copy of your bookmarks"
              onClick={handleCreateBackup}
              loading={isCreatingBackup}
              disabled={isSyncing || isCreatingBackup}
              variant="secondary"
            />
          </div>
        </div>
      )}

      {/* Rate Limit Info */}
      {gitHubRateLimit && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                API Rate Limit
              </span>
            </div>
            
            <div className="text-right">
              <div className="font-medium">
                {gitHubRateLimit.remaining} / {gitHubRateLimit.limit}
              </div>
              <div className="text-xs text-gray-500">
                Resets in {Math.ceil((gitHubRateLimit.reset - Date.now()) / (1000 * 60))}m
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all"
                style={{
                  width: `${(gitHubRateLimit.remaining / gitHubRateLimit.limit) * 100}%`
                }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Settings Dialog */}
      <SyncSettingsDialog
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={onSettingsChange}
      />
    </div>
  );
}
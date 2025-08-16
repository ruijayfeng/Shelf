/**
 * GitHub Gist Storage Service
 * Handles synchronization of bookmark data with GitHub Gists
 * Features: Conflict resolution, backup/restore, data versioning
 */

import { BookmarkData, Collection, Bookmark } from './types';
import { githubClient, GitHubGist, GitHubAPIError, isAuthError, isRateLimitError } from './github';

// Configuration constants
const GIST_FILENAME = 'shelf-bookmarks.json';
const GIST_DESCRIPTION = 'Shelf 3D Bookmark Manager - Bookmark Data';
const BACKUP_FILENAME_PREFIX = 'shelf-bookmarks-backup-';
const METADATA_FILENAME = 'shelf-metadata.json';
const DATA_VERSION = '1.0.0';

/**
 * Gist Storage Types
 */
export interface GistMetadata {
  version: string;
  lastSync: string;
  deviceId: string;
  syncCount: number;
  checksum: string;
}

export interface GistDataPackage {
  data: BookmarkData;
  metadata: GistMetadata;
}

export interface SyncConflict {
  type: 'data' | 'version' | 'merge';
  localData: BookmarkData;
  remoteData: BookmarkData;
  localMetadata: GistMetadata;
  remoteMetadata: GistMetadata;
  message: string;
}

export interface SyncResult {
  success: boolean;
  action: 'uploaded' | 'downloaded' | 'merged' | 'no_change' | 'conflict';
  data?: BookmarkData;
  conflict?: SyncConflict;
  error?: string;
  gistId?: string;
}

export interface BackupResult {
  success: boolean;
  backupId?: string;
  error?: string;
}

/**
 * Gist Storage Service Class
 */
export class GistStorageService {
  private deviceId: string;
  private lastKnownGistId: string | null = null;

  constructor() {
    this.deviceId = this.getDeviceId();
    this.loadGistIdFromStorage();
  }

  /**
   * Get or generate device ID for conflict resolution
   */
  private getDeviceId(): string {
    if (typeof window === 'undefined') return 'server';
    
    let deviceId = localStorage.getItem('shelf-device-id');
    if (!deviceId) {
      deviceId = 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('shelf-device-id', deviceId);
    }
    return deviceId;
  }

  /**
   * Load stored gist ID
   */
  private loadGistIdFromStorage(): void {
    if (typeof window !== 'undefined') {
      this.lastKnownGistId = localStorage.getItem('shelf-bookmark-gist-id');
    }
  }

  /**
   * Store gist ID
   */
  private storeGistId(gistId: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shelf-bookmark-gist-id', gistId);
    }
    this.lastKnownGistId = gistId;
  }

  /**
   * Generate checksum for data integrity verification
   */
  private generateChecksum(data: BookmarkData): string {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Create metadata for sync tracking
   */
  private createMetadata(data: BookmarkData, syncCount: number = 0): GistMetadata {
    return {
      version: DATA_VERSION,
      lastSync: new Date().toISOString(),
      deviceId: this.deviceId,
      syncCount: syncCount + 1,
      checksum: this.generateChecksum(data),
    };
  }

  /**
   * Find existing bookmark gist
   */
  private async findBookmarkGist(): Promise<GitHubGist | null> {
    try {
      // First try the stored gist ID
      if (this.lastKnownGistId) {
        try {
          const gist = await githubClient.getGist(this.lastKnownGistId);
          if (gist && gist.files[GIST_FILENAME]) {
            return gist;
          }
        } catch (error) {
          // Gist might not exist anymore, continue with search
          console.warn('Stored gist ID not found, searching for bookmark gist...');
        }
      }

      // Search through all gists
      const bookmarkGist = await githubClient.findBookmarkGist();
      if (bookmarkGist && bookmarkGist.files[GIST_FILENAME]) {
        this.storeGistId(bookmarkGist.id);
        return bookmarkGist;
      }

      return null;
    } catch (error) {
      console.error('Error finding bookmark gist:', error);
      throw error;
    }
  }

  /**
   * Parse gist data with error handling
   */
  private parseGistData(gist: GitHubGist): GistDataPackage | null {
    try {
      const dataFile = gist.files[GIST_FILENAME];
      const metadataFile = gist.files[METADATA_FILENAME];

      if (!dataFile || !dataFile.content) {
        throw new Error('Bookmark data file not found in gist');
      }

      const data: BookmarkData = JSON.parse(dataFile.content);
      let metadata: GistMetadata;

      if (metadataFile && metadataFile.content) {
        metadata = JSON.parse(metadataFile.content);
      } else {
        // Create default metadata for legacy gists
        metadata = this.createMetadata(data);
      }

      // Validate data structure
      if (!data.collections || !data.bookmarks || !data.lastUpdated) {
        throw new Error('Invalid bookmark data structure');
      }

      // Verify checksum if available
      if (metadata.checksum) {
        const calculatedChecksum = this.generateChecksum(data);
        if (calculatedChecksum !== metadata.checksum) {
          console.warn('Checksum mismatch detected, data may be corrupted');
        }
      }

      return { data, metadata };
    } catch (error) {
      console.error('Error parsing gist data:', error);
      return null;
    }
  }

  /**
   * Create new bookmark gist
   */
  private async createBookmarkGist(data: BookmarkData): Promise<GitHubGist> {
    try {
      const metadata = this.createMetadata(data);
      
      const files = {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2)
        },
        [METADATA_FILENAME]: {
          content: JSON.stringify(metadata, null, 2)
        }
      };

      const gist = await githubClient.createGist(GIST_DESCRIPTION, files, false);
      this.storeGistId(gist.id);
      
      return gist;
    } catch (error) {
      console.error('Error creating bookmark gist:', error);
      throw error;
    }
  }

  /**
   * Update existing bookmark gist
   */
  private async updateBookmarkGist(
    gistId: string, 
    data: BookmarkData, 
    currentMetadata?: GistMetadata
  ): Promise<GitHubGist> {
    try {
      const syncCount = currentMetadata ? currentMetadata.syncCount : 0;
      const metadata = this.createMetadata(data, syncCount);
      
      const files = {
        [GIST_FILENAME]: {
          content: JSON.stringify(data, null, 2)
        },
        [METADATA_FILENAME]: {
          content: JSON.stringify(metadata, null, 2)
        }
      };

      return await githubClient.updateGist(gistId, GIST_DESCRIPTION, files);
    } catch (error) {
      console.error('Error updating bookmark gist:', error);
      throw error;
    }
  }

  /**
   * Detect conflicts between local and remote data
   */
  private detectConflict(
    localData: BookmarkData,
    remotePackage: GistDataPackage
  ): SyncConflict | null {
    const localUpdated = new Date(localData.lastUpdated).getTime();
    const remoteUpdated = new Date(remotePackage.data.lastUpdated).getTime();
    const lastSync = new Date(remotePackage.metadata.lastSync).getTime();

    // No conflict if remote is newer and from different device
    if (remoteUpdated > localUpdated && remotePackage.metadata.deviceId !== this.deviceId) {
      return null;
    }

    // No conflict if local is newer and we're the last sync device
    if (localUpdated > remoteUpdated && remotePackage.metadata.deviceId === this.deviceId) {
      return null;
    }

    // Conflict detected
    const conflictType: SyncConflict['type'] = 
      Math.abs(localUpdated - remoteUpdated) < 5000 ? 'merge' : 'data';

    return {
      type: conflictType,
      localData,
      remoteData: remotePackage.data,
      localMetadata: this.createMetadata(localData),
      remoteMetadata: remotePackage.metadata,
      message: this.getConflictMessage(conflictType, localUpdated, remoteUpdated)
    };
  }

  /**
   * Generate conflict message
   */
  private getConflictMessage(
    type: SyncConflict['type'], 
    localTime: number, 
    remoteTime: number
  ): string {
    const timeDiff = Math.abs(localTime - remoteTime);
    const minutesDiff = Math.round(timeDiff / (1000 * 60));

    switch (type) {
      case 'merge':
        return `Changes made simultaneously on different devices (${minutesDiff} minutes apart)`;
      case 'data':
        return `Data conflict: Local changes are ${localTime > remoteTime ? 'newer' : 'older'} than remote`;
      default:
        return 'Data synchronization conflict detected';
    }
  }

  /**
   * Merge conflicting data intelligently
   */
  private mergeData(localData: BookmarkData, remoteData: BookmarkData): BookmarkData {
    const mergedCollections = new Map<string, Collection>();
    const mergedBookmarks = new Map<string, Bookmark>();

    // Merge collections (prefer most recent)
    [...localData.collections, ...remoteData.collections].forEach(collection => {
      const existing = mergedCollections.get(collection.id);
      if (!existing || new Date(collection.name).getTime() > new Date(existing.name).getTime()) {
        mergedCollections.set(collection.id, collection);
      }
    });

    // Merge bookmarks (prefer most recent)
    [...localData.bookmarks, ...remoteData.bookmarks].forEach(bookmark => {
      const existing = mergedBookmarks.get(bookmark.id);
      if (!existing || new Date(bookmark.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        mergedBookmarks.set(bookmark.id, bookmark);
      }
    });

    return {
      collections: Array.from(mergedCollections.values()),
      bookmarks: Array.from(mergedBookmarks.values()),
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Upload local data to GitHub Gist
   */
  async uploadToGist(data: BookmarkData): Promise<SyncResult> {
    try {
      if (!githubClient.isAuthenticated()) {
        return {
          success: false,
          action: 'uploaded',
          error: 'Not authenticated with GitHub'
        };
      }

      let gist: GitHubGist;
      const existingGist = await this.findBookmarkGist();

      if (existingGist) {
        gist = await this.updateBookmarkGist(existingGist.id, data);
      } else {
        gist = await this.createBookmarkGist(data);
      }

      return {
        success: true,
        action: 'uploaded',
        data,
        gistId: gist.id
      };

    } catch (error) {
      console.error('Error uploading to gist:', error);
      
      let errorMessage = 'Failed to upload data to GitHub';
      if (isAuthError(error)) {
        errorMessage = 'Authentication failed. Please re-authenticate with GitHub.';
      } else if (isRateLimitError(error)) {
        errorMessage = `Rate limit exceeded. ${error.message}`;
      } else if (error instanceof GitHubAPIError) {
        errorMessage = error.message;
      }

      return {
        success: false,
        action: 'uploaded',
        error: errorMessage
      };
    }
  }

  /**
   * Download data from GitHub Gist
   */
  async downloadFromGist(): Promise<SyncResult> {
    try {
      if (!githubClient.isAuthenticated()) {
        return {
          success: false,
          action: 'downloaded',
          error: 'Not authenticated with GitHub'
        };
      }

      const gist = await this.findBookmarkGist();
      if (!gist) {
        return {
          success: false,
          action: 'downloaded',
          error: 'No bookmark data found in GitHub Gists'
        };
      }

      const gistPackage = this.parseGistData(gist);
      if (!gistPackage) {
        return {
          success: false,
          action: 'downloaded',
          error: 'Failed to parse bookmark data from gist'
        };
      }

      return {
        success: true,
        action: 'downloaded',
        data: gistPackage.data,
        gistId: gist.id
      };

    } catch (error) {
      console.error('Error downloading from gist:', error);
      
      let errorMessage = 'Failed to download data from GitHub';
      if (isAuthError(error)) {
        errorMessage = 'Authentication failed. Please re-authenticate with GitHub.';
      } else if (isRateLimitError(error)) {
        errorMessage = `Rate limit exceeded. ${error.message}`;
      } else if (error instanceof GitHubAPIError) {
        errorMessage = error.message;
      }

      return {
        success: false,
        action: 'downloaded',
        error: errorMessage
      };
    }
  }

  /**
   * Synchronize local data with GitHub Gist
   */
  async syncWithGist(localData: BookmarkData): Promise<SyncResult> {
    try {
      if (!githubClient.isAuthenticated()) {
        return {
          success: false,
          action: 'no_change',
          error: 'Not authenticated with GitHub'
        };
      }

      const gist = await this.findBookmarkGist();
      
      // No remote data, upload local data
      if (!gist) {
        return await this.uploadToGist(localData);
      }

      const remotePackage = this.parseGistData(gist);
      if (!remotePackage) {
        // Remote data is corrupted, upload local data
        return await this.uploadToGist(localData);
      }

      // Check for conflicts
      const conflict = this.detectConflict(localData, remotePackage);
      if (conflict) {
        return {
          success: false,
          action: 'conflict',
          conflict,
          gistId: gist.id
        };
      }

      // Determine sync direction
      const localUpdated = new Date(localData.lastUpdated).getTime();
      const remoteUpdated = new Date(remotePackage.data.lastUpdated).getTime();

      if (localUpdated > remoteUpdated) {
        // Upload local changes
        return await this.uploadToGist(localData);
      } else if (remoteUpdated > localUpdated) {
        // Download remote changes
        return {
          success: true,
          action: 'downloaded',
          data: remotePackage.data,
          gistId: gist.id
        };
      } else {
        // No changes needed
        return {
          success: true,
          action: 'no_change',
          data: localData,
          gistId: gist.id
        };
      }

    } catch (error) {
      console.error('Error syncing with gist:', error);
      
      let errorMessage = 'Failed to synchronize with GitHub';
      if (isAuthError(error)) {
        errorMessage = 'Authentication failed. Please re-authenticate with GitHub.';
      } else if (isRateLimitError(error)) {
        errorMessage = `Rate limit exceeded. ${error.message}`;
      } else if (error instanceof GitHubAPIError) {
        errorMessage = error.message;
      }

      return {
        success: false,
        action: 'no_change',
        error: errorMessage
      };
    }
  }

  /**
   * Resolve sync conflict with user choice
   */
  async resolveConflict(
    conflict: SyncConflict,
    resolution: 'local' | 'remote' | 'merge'
  ): Promise<SyncResult> {
    try {
      let dataToUpload: BookmarkData;

      switch (resolution) {
        case 'local':
          dataToUpload = conflict.localData;
          break;
        case 'remote':
          return {
            success: true,
            action: 'downloaded',
            data: conflict.remoteData
          };
        case 'merge':
          dataToUpload = this.mergeData(conflict.localData, conflict.remoteData);
          break;
        default:
          throw new Error('Invalid conflict resolution');
      }

      return await this.uploadToGist(dataToUpload);

    } catch (error) {
      console.error('Error resolving conflict:', error);
      return {
        success: false,
        action: 'conflict',
        error: 'Failed to resolve sync conflict'
      };
    }
  }

  /**
   * Create backup of current data
   */
  async createBackup(data: BookmarkData, label?: string): Promise<BackupResult> {
    try {
      if (!githubClient.isAuthenticated()) {
        return {
          success: false,
          error: 'Not authenticated with GitHub'
        };
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupLabel = label || `Auto-backup-${timestamp}`;
      const description = `${GIST_DESCRIPTION} - Backup: ${backupLabel}`;
      
      const files = {
        [`${BACKUP_FILENAME_PREFIX}${timestamp}.json`]: {
          content: JSON.stringify(data, null, 2)
        },
        'backup-info.json': {
          content: JSON.stringify({
            label: backupLabel,
            created: new Date().toISOString(),
            deviceId: this.deviceId,
            dataVersion: DATA_VERSION
          }, null, 2)
        }
      };

      const gist = await githubClient.createGist(description, files, false);
      
      return {
        success: true,
        backupId: gist.id
      };

    } catch (error) {
      console.error('Error creating backup:', error);
      return {
        success: false,
        error: 'Failed to create backup'
      };
    }
  }

  /**
   * Get stored gist ID
   */
  getStoredGistId(): string | null {
    return this.lastKnownGistId;
  }

  /**
   * Clear stored gist ID (for testing or reset)
   */
  clearStoredGistId(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('shelf-bookmark-gist-id');
    }
    this.lastKnownGistId = null;
  }
}

/**
 * Singleton instance for global use
 */
export const gistStorage = new GistStorageService();

/**
 * Utility functions for sync status
 */
export function getSyncStatusMessage(result: SyncResult): string {
  switch (result.action) {
    case 'uploaded':
      return result.success ? 'Data uploaded to GitHub successfully' : result.error || 'Upload failed';
    case 'downloaded':
      return result.success ? 'Data downloaded from GitHub successfully' : result.error || 'Download failed';
    case 'merged':
      return 'Data merged successfully';
    case 'no_change':
      return result.success ? 'Data is already up to date' : result.error || 'Sync failed';
    case 'conflict':
      return result.conflict?.message || 'Sync conflict detected';
    default:
      return 'Unknown sync status';
  }
}

export function isConflictResolvable(conflict: SyncConflict): boolean {
  return conflict.type === 'merge' || conflict.type === 'data';
}
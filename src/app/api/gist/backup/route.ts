/**
 * GitHub Gist Backup API Route
 * Handles bookmark data backup and restore operations
 * POST /api/gist/backup - Create backup of bookmark data
 * GET /api/gist/backup - List available backups
 */

import { NextRequest, NextResponse } from 'next/server';
import { githubClient, isAuthError, isRateLimitError } from '@/lib/github';
import { gistStorage } from '@/lib/gist-storage';
import { BookmarkData, BackupInfo, ApiResponse } from '@/lib/types';

/**
 * POST handler for creating backups
 * Creates a new backup of the provided bookmark data
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { data, label, action = 'create' } = body;

    // Validate authentication
    if (!githubClient.isAuthenticated()) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with GitHub. Please authenticate first.',
      }, { status: 401 });
    }

    // Handle different backup actions
    switch (action) {
      case 'create':
        return await handleCreateBackup(data, label);
      case 'restore':
        return await handleRestoreBackup(body.backupId);
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown backup action: ${action}`,
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Gist backup API error:', error);
    
    let errorMessage = 'Backup operation failed';
    let statusCode = 500;

    if (isAuthError(error)) {
      errorMessage = 'Authentication failed. Please re-authenticate with GitHub.';
      statusCode = 401;
    } else if (isRateLimitError(error)) {
      errorMessage = `Rate limit exceeded. ${error.message}`;
      statusCode = 429;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    const response: ApiResponse = {
      success: false,
      error: errorMessage
    };

    return NextResponse.json(response, { status: statusCode });
  }
}

/**
 * GET handler for listing backups
 * Returns list of available backup Gists
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    if (!githubClient.isAuthenticated()) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with GitHub',
      }, { status: 401 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const backupId = searchParams.get('id');

    // If specific backup ID requested, return that backup
    if (backupId) {
      return await handleGetBackup(backupId);
    }

    // Otherwise, list all available backups
    return await handleListBackups();

  } catch (error) {
    console.error('Gist backup list API error:', error);
    
    let errorMessage = 'Failed to retrieve backups';
    if (isAuthError(error)) {
      errorMessage = 'Authentication failed';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

/**
 * DELETE handler for removing backups
 * Deletes a specific backup Gist
 */
export async function DELETE(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { backupId } = body;

    // Validate authentication
    if (!githubClient.isAuthenticated()) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with GitHub',
      }, { status: 401 });
    }

    // Validate backup ID
    if (!backupId || typeof backupId !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'Backup ID is required',
      }, { status: 400 });
    }

    // Delete the backup Gist
    await githubClient.deleteGist(backupId);

    return NextResponse.json({
      success: true,
      message: 'Backup deleted successfully'
    });

  } catch (error) {
    console.error('Gist backup delete API error:', error);
    
    let errorMessage = 'Failed to delete backup';
    let statusCode = 500;

    if (isAuthError(error)) {
      errorMessage = 'Authentication failed';
      statusCode = 401;
    } else if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('Not Found')) {
        errorMessage = 'Backup not found or already deleted';
        statusCode = 404;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
}

/**
 * Handle backup creation
 */
async function handleCreateBackup(data: BookmarkData, label?: string) {
  // Validate bookmark data
  if (!data || !data.collections || !data.bookmarks) {
    return NextResponse.json({
      success: false,
      error: 'Invalid bookmark data provided',
    }, { status: 400 });
  }

  // Create backup
  const backupResult = await gistStorage.createBackup(data, label);

  if (!backupResult.success) {
    return NextResponse.json({
      success: false,
      error: backupResult.error || 'Failed to create backup',
    }, { status: 500 });
  }

  // Get backup info
  const backupInfo = await getBackupInfo(backupResult.backupId!);

  const response: ApiResponse<BackupInfo> = {
    success: true,
    data: backupInfo,
    message: 'Backup created successfully'
  };

  return NextResponse.json(response);
}

/**
 * Handle backup restoration
 */
async function handleRestoreBackup(backupId: string) {
  // Validate backup ID
  if (!backupId || typeof backupId !== 'string') {
    return NextResponse.json({
      success: false,
      error: 'Backup ID is required',
    }, { status: 400 });
  }

  try {
    // Get the backup Gist
    const gist = await githubClient.getGist(backupId);
    
    // Find the backup data file
    const backupFile = Object.values(gist.files).find(file => 
      file.filename.includes('backup') && file.filename.endsWith('.json')
    );

    if (!backupFile || !backupFile.content) {
      return NextResponse.json({
        success: false,
        error: 'Backup data not found in the specified Gist',
      }, { status: 404 });
    }

    // Parse backup data
    const backupData: BookmarkData = JSON.parse(backupFile.content);

    // Validate backup data structure
    if (!backupData.collections || !backupData.bookmarks) {
      return NextResponse.json({
        success: false,
        error: 'Invalid backup data structure',
      }, { status: 400 });
    }

    const response: ApiResponse<BookmarkData> = {
      success: true,
      data: backupData,
      message: 'Backup restored successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Backup restore error:', error);
    
    let errorMessage = 'Failed to restore backup';
    if (error instanceof Error) {
      if (error.message.includes('Not Found')) {
        errorMessage = 'Backup not found';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Backup data is corrupted';
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}

/**
 * Handle listing all backups
 */
async function handleListBackups() {
  try {
    // Get all user gists
    const gists = await githubClient.getGists();
    
    // Filter backup gists
    const backupGists = gists.filter(gist => 
      gist.description.toLowerCase().includes('backup') &&
      gist.description.toLowerCase().includes('shelf')
    );

    // Convert to BackupInfo format
    const backups: BackupInfo[] = await Promise.all(
      backupGists.map(async (gist) => {
        try {
          return await getBackupInfo(gist.id);
        } catch (error) {
          // If we can't parse a backup, include basic info
          return {
            id: gist.id,
            label: gist.description,
            created: gist.created_at,
            size: calculateGistSize(gist),
            deviceId: 'unknown',
            gistUrl: gist.html_url
          };
        }
      })
    );

    // Sort by creation date (newest first)
    backups.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

    const response: ApiResponse<BackupInfo[]> = {
      success: true,
      data: backups,
      message: `Found ${backups.length} backup(s)`
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('List backups error:', error);
    throw error;
  }
}

/**
 * Handle getting specific backup info
 */
async function handleGetBackup(backupId: string) {
  try {
    const backupInfo = await getBackupInfo(backupId);
    
    const response: ApiResponse<BackupInfo> = {
      success: true,
      data: backupInfo,
      message: 'Backup information retrieved successfully'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Get backup error:', error);
    
    let errorMessage = 'Failed to get backup information';
    let statusCode = 500;

    if (error instanceof Error) {
      if (error.message.includes('Not Found')) {
        errorMessage = 'Backup not found';
        statusCode = 404;
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: statusCode });
  }
}

/**
 * Get backup information from a Gist
 */
async function getBackupInfo(gistId: string): Promise<BackupInfo> {
  const gist = await githubClient.getGist(gistId);
  
  // Try to get backup info from backup-info.json
  const infoFile = gist.files['backup-info.json'];
  if (infoFile && infoFile.content) {
    try {
      const info = JSON.parse(infoFile.content);
      return {
        id: gist.id,
        label: info.label || gist.description,
        created: info.created || gist.created_at,
        size: calculateGistSize(gist),
        deviceId: info.deviceId || 'unknown',
        gistUrl: gist.html_url
      };
    } catch (error) {
      // Fallback to parsing from description
    }
  }

  // Fallback: extract info from description and files
  return {
    id: gist.id,
    label: extractLabelFromDescription(gist.description),
    created: gist.created_at,
    size: calculateGistSize(gist),
    deviceId: 'unknown',
    gistUrl: gist.html_url
  };
}

/**
 * Calculate total size of a Gist
 */
function calculateGistSize(gist: any): number {
  return Object.values(gist.files).reduce((total: number, file: any) => {
    return total + (file.size || 0);
  }, 0);
}

/**
 * Extract label from backup description
 */
function extractLabelFromDescription(description: string): string {
  const match = description.match(/Backup: (.+)$/);
  return match ? match[1] : description;
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
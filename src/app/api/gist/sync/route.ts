/**
 * GitHub Gist Sync API Route
 * Handles bookmark data synchronization with GitHub Gists
 * POST /api/gist/sync - Sync local data with GitHub Gist
 * GET /api/gist/sync - Get sync status and remote data
 */

import { NextRequest, NextResponse } from 'next/server';
import { githubClient, isAuthError, isRateLimitError } from '@/lib/github';
import { gistStorage, getSyncStatusMessage } from '@/lib/gist-storage';
import { BookmarkData, SyncApiResponse, ConflictResolution } from '@/lib/types';

/**
 * POST handler for data synchronization
 * Syncs local bookmark data with GitHub Gist
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { data, action = 'sync', resolution } = body;

    // Validate authentication
    if (!githubClient.isAuthenticated()) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated with GitHub. Please authenticate first.',
      }, { status: 401 });
    }

    // Handle different sync actions
    switch (action) {
      case 'sync':
        return await handleSync(data);
      case 'upload':
        return await handleUpload(data);
      case 'download':
        return await handleDownload();
      case 'resolve_conflict':
        return await handleConflictResolution(data, resolution);
      default:
        return NextResponse.json({
          success: false,
          error: `Unknown sync action: ${action}`,
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Gist sync API error:', error);
    
    let errorMessage = 'Sync operation failed';
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

    const response: SyncApiResponse = {
      success: false,
      error: errorMessage
    };

    return NextResponse.json(response, { status: statusCode });
  }
}

/**
 * GET handler for sync status and remote data
 * Returns current sync status and available remote data
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
    const includeData = searchParams.get('include_data') === 'true';

    // Get sync information
    const syncInfo = {
      authenticated: true,
      gistId: gistStorage.getStoredGistId(),
      rateLimit: githubClient.getRateLimit(),
    };

    // Optionally include remote data
    if (includeData) {
      const downloadResult = await gistStorage.downloadFromGist();
      
      const response: SyncApiResponse = {
        success: downloadResult.success,
        data: downloadResult.data,
        error: downloadResult.error,
        syncResult: downloadResult,
        message: getSyncStatusMessage(downloadResult)
      };

      return NextResponse.json({
        ...response,
        syncInfo
      });
    }

    return NextResponse.json({
      success: true,
      syncInfo,
      message: 'Sync status retrieved successfully'
    });

  } catch (error) {
    console.error('Gist sync status API error:', error);
    
    let errorMessage = 'Failed to get sync status';
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
 * Handle bidirectional sync operation
 */
async function handleSync(localData: BookmarkData) {
  // Validate local data
  if (!localData || !localData.collections || !localData.bookmarks) {
    return NextResponse.json({
      success: false,
      error: 'Invalid bookmark data provided',
    }, { status: 400 });
  }

  // Perform sync operation
  const syncResult = await gistStorage.syncWithGist(localData);
  
  const response: SyncApiResponse = {
    success: syncResult.success,
    data: syncResult.data,
    error: syncResult.error,
    syncResult,
    message: getSyncStatusMessage(syncResult)
  };

  // Handle conflicts
  if (syncResult.action === 'conflict' && syncResult.conflict) {
    response.conflictData = {
      type: syncResult.conflict.type,
      localData: syncResult.conflict.localData,
      remoteData: syncResult.conflict.remoteData,
      localTimestamp: syncResult.conflict.localData.lastUpdated,
      remoteTimestamp: syncResult.conflict.remoteData.lastUpdated,
      deviceId: syncResult.conflict.localMetadata.deviceId,
      message: syncResult.conflict.message
    };
  }

  const statusCode = syncResult.success ? 200 : 
    (syncResult.action === 'conflict' ? 409 : 500);

  return NextResponse.json(response, { status: statusCode });
}

/**
 * Handle upload-only operation
 */
async function handleUpload(localData: BookmarkData) {
  // Validate local data
  if (!localData || !localData.collections || !localData.bookmarks) {
    return NextResponse.json({
      success: false,
      error: 'Invalid bookmark data provided',
    }, { status: 400 });
  }

  // Perform upload operation
  const uploadResult = await gistStorage.uploadToGist(localData);
  
  const response: SyncApiResponse = {
    success: uploadResult.success,
    data: uploadResult.data,
    error: uploadResult.error,
    syncResult: uploadResult,
    message: getSyncStatusMessage(uploadResult)
  };

  return NextResponse.json(response, { 
    status: uploadResult.success ? 200 : 500 
  });
}

/**
 * Handle download-only operation
 */
async function handleDownload() {
  // Perform download operation
  const downloadResult = await gistStorage.downloadFromGist();
  
  const response: SyncApiResponse = {
    success: downloadResult.success,
    data: downloadResult.data,
    error: downloadResult.error,
    syncResult: downloadResult,
    message: getSyncStatusMessage(downloadResult)
  };

  return NextResponse.json(response, { 
    status: downloadResult.success ? 200 : 500 
  });
}

/**
 * Handle conflict resolution
 */
async function handleConflictResolution(
  conflictData: any, 
  resolution: ConflictResolution
) {
  // Validate conflict resolution parameters
  if (!conflictData || !resolution) {
    return NextResponse.json({
      success: false,
      error: 'Conflict data and resolution method are required',
    }, { status: 400 });
  }

  if (!['local', 'remote', 'merge'].includes(resolution)) {
    return NextResponse.json({
      success: false,
      error: 'Invalid conflict resolution method',
    }, { status: 400 });
  }

  // Reconstruct conflict object
  const conflict = {
    type: conflictData.type || 'data',
    localData: conflictData.localData,
    remoteData: conflictData.remoteData,
    localMetadata: {
      deviceId: conflictData.deviceId || 'unknown',
      lastSync: conflictData.localTimestamp || new Date().toISOString(),
      syncCount: 0,
      version: '1.0.0',
      checksum: ''
    },
    remoteMetadata: {
      deviceId: 'remote',
      lastSync: conflictData.remoteTimestamp || new Date().toISOString(),
      syncCount: 0,
      version: '1.0.0',
      checksum: ''
    },
    message: conflictData.message || 'Conflict resolution'
  };

  // Resolve conflict
  const resolveResult = await gistStorage.resolveConflict(conflict, resolution);
  
  const response: SyncApiResponse = {
    success: resolveResult.success,
    data: resolveResult.data,
    error: resolveResult.error,
    syncResult: resolveResult,
    message: getSyncStatusMessage(resolveResult)
  };

  return NextResponse.json(response, { 
    status: resolveResult.success ? 200 : 500 
  });
}

/**
 * PUT handler for updating sync settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { gistId } = body;

    if (gistId && typeof gistId === 'string') {
      // Store the gist ID (this would typically be done through user preferences)
      // For now, we'll just validate that the gist exists
      if (githubClient.isAuthenticated()) {
        try {
          await githubClient.getGist(gistId);
          return NextResponse.json({
            success: true,
            message: 'Gist ID updated successfully'
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Invalid or inaccessible Gist ID'
          }, { status: 400 });
        }
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid request parameters'
    }, { status: 400 });

  } catch (error) {
    console.error('Gist sync settings update error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update sync settings'
    }, { status: 500 });
  }
}

/**
 * DELETE handler for clearing sync data
 */
export async function DELETE() {
  try {
    // Clear stored gist ID
    gistStorage.clearStoredGistId();
    
    return NextResponse.json({
      success: true,
      message: 'Sync data cleared successfully'
    });

  } catch (error) {
    console.error('Gist sync data clear error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clear sync data'
    }, { status: 500 });
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
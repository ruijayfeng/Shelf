/**
 * GitHub OAuth Authentication Route
 * Handles GitHub OAuth flow initiation
 * GET /api/auth/github - Redirect to GitHub OAuth
 */

import { NextRequest, NextResponse } from 'next/server';
import { githubClient } from '@/lib/github';

/**
 * GET handler for GitHub OAuth initiation
 * Redirects user to GitHub OAuth authorization page
 */
export async function GET(request: NextRequest) {
  try {
    // Get environment variables
    const clientId = process.env.GITHUB_CLIENT_ID;
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    
    if (!clientId) {
      console.error('GitHub OAuth Error: GITHUB_CLIENT_ID not configured');
      return NextResponse.json(
        { 
          success: false, 
          error: 'GitHub OAuth not configured. Please check environment variables.' 
        },
        { status: 500 }
      );
    }

    // Generate callback URL
    const redirectUri = `${baseUrl}/api/auth/github/callback`;
    
    // Generate GitHub OAuth authorization URL
    const authUrl = githubClient.generateAuthUrl(
      clientId,
      redirectUri,
      ['gist'] // Request gist scope for bookmark storage
    );

    // Log OAuth initiation for debugging
    console.log('GitHub OAuth initiated:', {
      clientId: clientId.substring(0, 8) + '...',
      redirectUri,
      timestamp: new Date().toISOString()
    });

    // Redirect to GitHub OAuth
    return NextResponse.redirect(authUrl);

  } catch (error) {
    console.error('GitHub OAuth initiation error:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initiate GitHub authentication',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST handler for programmatic OAuth URL generation
 * Returns OAuth URL without redirect (for client-side handling)
 */
export async function POST(request: NextRequest) {
  try {
    // Get environment variables
    const clientId = process.env.GITHUB_CLIENT_ID;
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
    
    if (!clientId) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'GitHub OAuth not configured' 
        },
        { status: 500 }
      );
    }

    // Parse request body for custom parameters
    const body = await request.json().catch(() => ({}));
    const { scopes = ['gist'], returnUrl } = body;

    // Generate callback URL
    const redirectUri = `${baseUrl}/api/auth/github/callback`;
    
    // Generate GitHub OAuth authorization URL
    const authUrl = githubClient.generateAuthUrl(
      clientId,
      redirectUri,
      scopes
    );

    // Return OAuth URL for client-side redirect
    return NextResponse.json({
      success: true,
      authUrl,
      redirectUri,
      scopes
    });

  } catch (error) {
    console.error('GitHub OAuth URL generation error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to generate GitHub authentication URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
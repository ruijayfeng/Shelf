/**
 * GitHub OAuth Callback Route
 * Handles GitHub OAuth callback and token exchange
 * GET /api/auth/github/callback - Process OAuth callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { githubClient, GitHubAuthError, isAuthError } from '@/lib/github';
import { GitHubAuthResult } from '@/lib/types';

/**
 * GET handler for GitHub OAuth callback
 * Processes authorization code and exchanges for access token
 */
export async function GET(request: NextRequest) {
  try {
    // Extract search parameters from callback URL
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors from GitHub
    if (error) {
      console.error('GitHub OAuth error:', { error, errorDescription });
      
      const errorMessage = getOAuthErrorMessage(error, errorDescription);
      return redirectWithError(errorMessage);
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('GitHub OAuth callback missing required parameters:', { code: !!code, state: !!state });
      return redirectWithError('Invalid OAuth callback: Missing authorization code or state');
    }

    // Get environment variables
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';

    if (!clientId || !clientSecret) {
      console.error('GitHub OAuth callback error: Missing environment variables');
      return redirectWithError('GitHub OAuth not properly configured');
    }

    // Generate redirect URI (must match the one used in authorization)
    const redirectUri = `${baseUrl}/api/auth/github/callback`;

    // Exchange authorization code for access token
    console.log('Exchanging GitHub OAuth code for token...');
    const tokenResponse = await githubClient.exchangeCodeForToken(
      code,
      state,
      clientId,
      clientSecret,
      redirectUri
    );

    if (!tokenResponse.access_token) {
      console.error('GitHub OAuth token exchange failed: No access token received');
      return redirectWithError('Failed to authenticate with GitHub: No access token');
    }

    // Set the access token in the GitHub client
    githubClient.setAccessToken(tokenResponse.access_token);

    // Get user information from GitHub
    console.log('Fetching GitHub user information...');
    const user = await githubClient.getCurrentUser();

    // Log successful authentication
    console.log('GitHub OAuth successful:', {
      userId: user.id,
      username: user.name,
      timestamp: new Date().toISOString()
    });

    // Store authentication result in session/localStorage via client-side script
    const authResult: GitHubAuthResult = {
      success: true,
      user,
      accessToken: tokenResponse.access_token
    };

    // Create HTML response with client-side script to handle auth result
    const htmlResponse = createAuthSuccessPage(authResult);
    
    return new NextResponse(htmlResponse, {
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    
    let errorMessage = 'Authentication with GitHub failed';
    
    if (isAuthError(error)) {
      errorMessage = error.message;
    } else if (error instanceof Error) {
      errorMessage = `Authentication error: ${error.message}`;
    }

    return redirectWithError(errorMessage);
  }
}

/**
 * Create HTML page for successful authentication
 * Uses client-side script to update auth state and redirect
 */
function createAuthSuccessPage(authResult: GitHubAuthResult): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub Authentication - Shelf</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }
        .auth-container {
            text-align: center;
            max-width: 400px;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        .success-icon {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: bounce 1s infinite;
        }
        .loading {
            margin-top: 1rem;
        }
        .spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            border-top: 2px solid white;
            animation: spin 1s linear infinite;
        }
        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="success-icon">✅</div>
        <h1>Authentication Successful!</h1>
        <p>You have been successfully authenticated with GitHub.</p>
        <p>Welcome, <strong>${authResult.user?.name || 'User'}</strong>!</p>
        <div class="loading">
            <div class="spinner"></div>
            <p>Redirecting you back to Shelf...</p>
        </div>
    </div>

    <script>
        // Store authentication result
        const authResult = ${JSON.stringify(authResult)};
        
        try {
            // Store user data in localStorage
            if (authResult.user) {
                localStorage.setItem('shelf-user', JSON.stringify(authResult.user));
            }
            
            // Store access token securely (in practice, this might be handled differently)
            if (authResult.accessToken) {
                localStorage.setItem('shelf-github-token', authResult.accessToken);
            }
            
            // Dispatch custom event to notify the app of successful authentication
            const authEvent = new CustomEvent('github-auth-success', {
                detail: authResult
            });
            window.dispatchEvent(authEvent);
            
            // Redirect after a short delay
            setTimeout(() => {
                // Try to redirect to the management page first, fallback to home
                const targetUrl = localStorage.getItem('auth-return-url') || '/manage';
                localStorage.removeItem('auth-return-url');
                window.location.href = targetUrl;
            }, 2000);
            
        } catch (error) {
            console.error('Error handling authentication result:', error);
            // Fallback redirect on error
            setTimeout(() => {
                window.location.href = '/manage?auth-error=storage-failed';
            }, 1000);
        }
    </script>
</body>
</html>`;
}

/**
 * Get user-friendly error message for OAuth errors
 */
function getOAuthErrorMessage(error: string, description: string | null): string {
  switch (error) {
    case 'access_denied':
      return 'GitHub authentication was cancelled. Please try again if you want to sync your bookmarks.';
    case 'redirect_uri_mismatch':
      return 'Authentication configuration error. Please contact support.';
    case 'invalid_client':
      return 'GitHub application not properly configured. Please contact support.';
    case 'unsupported_response_type':
      return 'GitHub authentication method not supported.';
    case 'invalid_scope':
      return 'Requested permissions not available.';
    case 'server_error':
      return 'GitHub authentication service temporarily unavailable. Please try again later.';
    case 'temporarily_unavailable':
      return 'GitHub authentication temporarily unavailable. Please try again in a few minutes.';
    default:
      return description || `GitHub authentication error: ${error}`;
  }
}

/**
 * Create error redirect response
 */
function redirectWithError(errorMessage: string): NextResponse {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3001';
  const errorUrl = `${baseUrl}/manage?auth-error=${encodeURIComponent(errorMessage)}`;
  
  return NextResponse.redirect(errorUrl);
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
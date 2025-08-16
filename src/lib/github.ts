/**
 * GitHub API Client
 * Provides comprehensive GitHub API integration for Shelf 3D Bookmark Manager
 * Features: OAuth flow, Gist operations, error handling, rate limiting
 */

import { User } from './types';

// GitHub API Configuration
const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_OAUTH_BASE = 'https://github.com/login/oauth';

// Rate limiting and retry configuration
const DEFAULT_RETRY_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY = 1000; // ms
const RATE_LIMIT_BUFFER = 10; // Keep 10 requests as buffer

/**
 * GitHub API Response Types
 */
export interface GitHubUser {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

export interface GitHubGist {
  id: string;
  description: string;
  public: boolean;
  created_at: string;
  updated_at: string;
  files: {
    [filename: string]: {
      filename: string;
      type: string;
      language: string | null;
      raw_url: string;
      size: number;
      content?: string;
    };
  };
  owner: {
    login: string;
    id: number;
    avatar_url: string;
  };
  html_url: string;
  git_pull_url: string;
  git_push_url: string;
}

export interface GitHubTokenResponse {
  access_token: string;
  scope: string;
  token_type: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface GitHubRateLimit {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  used: number;
}

/**
 * GitHub API Error Types
 */
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

export class GitHubRateLimitError extends GitHubAPIError {
  constructor(
    message: string,
    public resetTime: number
  ) {
    super(message, 403);
    this.name = 'GitHubRateLimitError';
  }
}

export class GitHubAuthError extends GitHubAPIError {
  constructor(message: string) {
    super(message, 401);
    this.name = 'GitHubAuthError';
  }
}

/**
 * GitHub API Client Class
 * Comprehensive client for GitHub API operations
 */
export class GitHubClient {
  private accessToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private rateLimit: GitHubRateLimit | null = null;
  private requestQueue: Promise<any>[] = [];

  constructor() {
    // Initialize token from storage if available
    this.loadTokenFromStorage();
  }

  /**
   * Load access token from localStorage
   */
  private loadTokenFromStorage(): void {
    try {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem('shelf-github-token');
        const storedExpiry = localStorage.getItem('shelf-github-token-expiry');
        
        if (storedToken && storedExpiry) {
          const expiryTime = parseInt(storedExpiry, 10);
          if (Date.now() < expiryTime) {
            this.accessToken = storedToken;
            this.tokenExpiresAt = expiryTime;
          } else {
            // Token expired, clean up
            this.clearStoredToken();
          }
        }
      }
    } catch (error) {
      console.error('Error loading GitHub token from storage:', error);
    }
  }

  /**
   * Store access token in localStorage
   */
  private storeToken(token: string, expiresIn?: number): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('shelf-github-token', token);
        
        if (expiresIn) {
          const expiryTime = Date.now() + (expiresIn * 1000);
          localStorage.setItem('shelf-github-token-expiry', expiryTime.toString());
          this.tokenExpiresAt = expiryTime;
        }
      }
    } catch (error) {
      console.error('Error storing GitHub token:', error);
    }
  }

  /**
   * Clear stored token
   */
  private clearStoredToken(): void {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('shelf-github-token');
        localStorage.removeItem('shelf-github-token-expiry');
      }
      this.accessToken = null;
      this.tokenExpiresAt = null;
    } catch (error) {
      console.error('Error clearing GitHub token:', error);
    }
  }

  /**
   * Generate GitHub OAuth authorization URL
   */
  generateAuthUrl(clientId: string, redirectUri: string, scopes: string[] = ['gist']): string {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      state: this.generateRandomState(),
      allow_signup: 'true'
    });

    // Store state for validation
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('github-oauth-state', params.get('state')!);
    }

    return `${GITHUB_OAUTH_BASE}/authorize?${params.toString()}`;
  }

  /**
   * Generate random state for OAuth security
   */
  private generateRandomState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    code: string,
    state: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string
  ): Promise<GitHubTokenResponse> {
    // Validate state
    if (typeof window !== 'undefined') {
      const storedState = sessionStorage.getItem('github-oauth-state');
      if (storedState !== state) {
        throw new GitHubAuthError('Invalid OAuth state parameter');
      }
      sessionStorage.removeItem('github-oauth-state');
    }

    const response = await fetch(`${GITHUB_OAUTH_BASE}/access_token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      throw new GitHubAuthError(`Failed to exchange code for token: ${response.statusText}`);
    }

    const tokenData: GitHubTokenResponse = await response.json();

    if (tokenData.access_token) {
      this.accessToken = tokenData.access_token;
      this.storeToken(tokenData.access_token, tokenData.expires_in);
    }

    return tokenData;
  }

  /**
   * Check if client is authenticated
   */
  isAuthenticated(): boolean {
    if (!this.accessToken) return false;
    
    if (this.tokenExpiresAt && Date.now() >= this.tokenExpiresAt) {
      this.clearStoredToken();
      return false;
    }
    
    return true;
  }

  /**
   * Set access token manually (for server-side usage)
   */
  setAccessToken(token: string): void {
    this.accessToken = token;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Logout and clear tokens
   */
  logout(): void {
    this.clearStoredToken();
  }

  /**
   * Make authenticated API request with comprehensive error handling
   */
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.isAuthenticated()) {
      throw new GitHubAuthError('Not authenticated with GitHub');
    }

    // Check rate limit before making request
    await this.checkRateLimit();

    const url = endpoint.startsWith('http') ? endpoint : `${GITHUB_API_BASE}${endpoint}`;
    
    const headers = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Shelf-Bookmark-Manager/1.0',
      ...options.headers,
    };

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    return this.makeRequestWithRetry<T>(url, requestOptions);
  }

  /**
   * Make request with automatic retry logic
   */
  private async makeRequestWithRetry<T>(
    url: string,
    options: RequestInit,
    attempt: number = 1
  ): Promise<T> {
    try {
      const response = await fetch(url, options);
      
      // Update rate limit info from headers
      this.updateRateLimitFromHeaders(response.headers);

      if (response.ok) {
        return await response.json();
      }

      // Handle specific error cases
      if (response.status === 401) {
        this.clearStoredToken();
        throw new GitHubAuthError('Authentication failed. Please re-authenticate.');
      }

      if (response.status === 403) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.message?.includes('rate limit')) {
          const resetTime = parseInt(response.headers.get('X-RateLimit-Reset') || '0', 10) * 1000;
          throw new GitHubRateLimitError(
            `Rate limit exceeded. Resets at ${new Date(resetTime).toLocaleTimeString()}`,
            resetTime
          );
        }
      }

      if (response.status >= 500 && attempt < DEFAULT_RETRY_ATTEMPTS) {
        // Server error, retry with exponential backoff
        await this.delay(DEFAULT_RETRY_DELAY * Math.pow(2, attempt - 1));
        return this.makeRequestWithRetry<T>(url, options, attempt + 1);
      }

      // Other errors
      const errorData = await response.json().catch(() => ({}));
      throw new GitHubAPIError(
        errorData.message || `GitHub API error: ${response.statusText}`,
        response.status,
        errorData
      );

    } catch (error) {
      if (error instanceof GitHubAPIError) {
        throw error;
      }

      // Network error, retry if attempts remaining
      if (attempt < DEFAULT_RETRY_ATTEMPTS) {
        await this.delay(DEFAULT_RETRY_DELAY * Math.pow(2, attempt - 1));
        return this.makeRequestWithRetry<T>(url, options, attempt + 1);
      }

      throw new GitHubAPIError(
        `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0
      );
    }
  }

  /**
   * Update rate limit information from response headers
   */
  private updateRateLimitFromHeaders(headers: Headers): void {
    const limit = headers.get('X-RateLimit-Limit');
    const remaining = headers.get('X-RateLimit-Remaining');
    const reset = headers.get('X-RateLimit-Reset');
    const used = headers.get('X-RateLimit-Used');

    if (limit && remaining && reset) {
      this.rateLimit = {
        limit: parseInt(limit, 10),
        remaining: parseInt(remaining, 10),
        reset: parseInt(reset, 10) * 1000, // Convert to milliseconds
        used: used ? parseInt(used, 10) : 0,
      };
    }
  }

  /**
   * Check rate limit and delay if necessary
   */
  private async checkRateLimit(): Promise<void> {
    if (!this.rateLimit) return;

    if (this.rateLimit.remaining <= RATE_LIMIT_BUFFER) {
      const now = Date.now();
      const resetTime = this.rateLimit.reset;
      
      if (now < resetTime) {
        const delayMs = resetTime - now + 1000; // Add 1 second buffer
        console.warn(`Rate limit approaching. Waiting ${Math.round(delayMs / 1000)}s until reset.`);
        await this.delay(delayMs);
      }
    }
  }

  /**
   * Get current rate limit status
   */
  getRateLimit(): GitHubRateLimit | null {
    return this.rateLimit;
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get authenticated user information
   */
  async getUser(): Promise<GitHubUser> {
    return this.makeRequest<GitHubUser>('/user');
  }

  /**
   * Convert GitHub user to Shelf user format
   */
  async getCurrentUser(): Promise<User> {
    const githubUser = await this.getUser();
    
    return {
      id: githubUser.id.toString(),
      name: githubUser.name || githubUser.login,
      email: githubUser.email || `${githubUser.login}@users.noreply.github.com`,
      avatar: githubUser.avatar_url,
      gistId: undefined, // Will be set when first gist is created
    };
  }

  /**
   * Get all user's gists
   */
  async getGists(): Promise<GitHubGist[]> {
    return this.makeRequest<GitHubGist[]>('/gists');
  }

  /**
   * Get specific gist by ID
   */
  async getGist(gistId: string): Promise<GitHubGist> {
    return this.makeRequest<GitHubGist>(`/gists/${gistId}`);
  }

  /**
   * Create a new gist
   */
  async createGist(
    description: string,
    files: { [filename: string]: { content: string } },
    isPublic: boolean = false
  ): Promise<GitHubGist> {
    return this.makeRequest<GitHubGist>('/gists', {
      method: 'POST',
      body: JSON.stringify({
        description,
        public: isPublic,
        files,
      }),
    });
  }

  /**
   * Update existing gist
   */
  async updateGist(
    gistId: string,
    description?: string,
    files?: { [filename: string]: { content: string } | null }
  ): Promise<GitHubGist> {
    const payload: any = {};
    
    if (description !== undefined) {
      payload.description = description;
    }
    
    if (files !== undefined) {
      payload.files = files;
    }

    return this.makeRequest<GitHubGist>(`/gists/${gistId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  /**
   * Delete a gist
   */
  async deleteGist(gistId: string): Promise<void> {
    await this.makeRequest<void>(`/gists/${gistId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Search for specific gist by description pattern
   */
  async findBookmarkGist(): Promise<GitHubGist | null> {
    try {
      const gists = await this.getGists();
      
      // Look for gist with bookmark-related description
      const bookmarkGist = gists.find(gist => 
        gist.description.toLowerCase().includes('shelf') ||
        gist.description.toLowerCase().includes('bookmark') ||
        Object.keys(gist.files).some(filename => 
          filename.includes('shelf') || 
          filename.includes('bookmark')
        )
      );

      return bookmarkGist || null;
    } catch (error) {
      console.error('Error finding bookmark gist:', error);
      return null;
    }
  }
}

/**
 * Singleton instance for global use
 */
export const githubClient = new GitHubClient();

/**
 * Utility function to check if error is rate limit related
 */
export function isRateLimitError(error: any): error is GitHubRateLimitError {
  return error instanceof GitHubRateLimitError;
}

/**
 * Utility function to check if error is authentication related
 */
export function isAuthError(error: any): error is GitHubAuthError {
  return error instanceof GitHubAuthError;
}

/**
 * Format time until rate limit reset
 */
export function formatRateLimitReset(resetTime: number): string {
  const now = Date.now();
  const diffMs = resetTime - now;
  
  if (diffMs <= 0) return 'now';
  
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));
  if (diffMinutes < 60) return `${diffMinutes}m`;
  
  const diffHours = Math.ceil(diffMinutes / 60);
  return `${diffHours}h`;
}
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState, GitHubAuthResult } from './types';
import { githubClient, isAuthError } from './github';

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isConnectedToGitHub: boolean;
  gitHubRateLimit: any;
  lastSyncTime?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: undefined,
  });

  const [gitHubConnected, setGitHubConnected] = useState(false);
  const [rateLimit, setRateLimit] = useState(null);

  useEffect(() => {
    // Check for existing session on mount
    checkExistingSession();
    
    // Listen for GitHub auth success events from OAuth callback
    const handleGitHubAuthSuccess = (event: CustomEvent) => {
      handleAuthResult(event.detail);
    };
    
    window.addEventListener('github-auth-success', handleGitHubAuthSuccess as EventListener);
    
    return () => {
      window.removeEventListener('github-auth-success', handleGitHubAuthSuccess as EventListener);
    };
  }, []);

  const checkExistingSession = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      // Check for stored user and GitHub token
      const storedUser = localStorage.getItem('shelf-user');
      const hasGitHubToken = githubClient.isAuthenticated();
      
      if (storedUser && hasGitHubToken) {
        const user = JSON.parse(storedUser);
        
        // Verify the GitHub token is still valid
        try {
          const currentUser = await githubClient.getCurrentUser();
          const updatedUser = {
            ...user,
            ...currentUser,
            lastSync: user.lastSync // Preserve sync time
          };
          
          localStorage.setItem('shelf-user', JSON.stringify(updatedUser));
          
          setAuthState({
            user: updatedUser,
            isAuthenticated: true,
            isLoading: false,
            error: undefined,
          });
          
          setGitHubConnected(true);
          updateRateLimit();
          
        } catch (error) {
          console.warn('GitHub token validation failed:', error);
          
          if (isAuthError(error)) {
            // Token is invalid, clear it but keep user for local functionality
            githubClient.logout();
            setGitHubConnected(false);
            
            setAuthState({
              user: JSON.parse(storedUser),
              isAuthenticated: true, // Still authenticated locally
              isLoading: false,
              error: 'GitHub connection expired. Please reconnect for cloud sync.',
            });
          } else {
            throw error;
          }
        }
      } else if (storedUser) {
        // User exists but no GitHub token (local-only mode)
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false,
          error: undefined,
        });
        setGitHubConnected(false);
      } else {
        // No user at all
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: undefined,
        });
        setGitHubConnected(false);
      }
    } catch (error) {
      console.error('Error checking existing session:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Failed to verify authentication status',
      });
      setGitHubConnected(false);
    }
  }, []);

  const login = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      // Store return URL for after authentication
      const currentPath = window.location.pathname;
      if (currentPath !== '/') {
        localStorage.setItem('auth-return-url', currentPath);
      }
      
      // Redirect to GitHub OAuth
      window.location.href = '/api/auth/github';
      
    } catch (error) {
      console.error('Login initiation failed:', error);
      setAuthState(prev => ({ 
        ...prev, 
        isLoading: false,
        error: 'Failed to start authentication process'
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    try {
      // Clear all stored authentication data
      localStorage.removeItem('shelf-user');
      localStorage.removeItem('auth-return-url');
      
      // Logout from GitHub client
      githubClient.logout();
      
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: undefined,
      });
      
      setGitHubConnected(false);
      setRateLimit(null);
      
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if there's an error
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: undefined,
      });
      setGitHubConnected(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    await checkExistingSession();
  }, [checkExistingSession]);
  
  // Handle GitHub authentication result from OAuth callback
  const handleAuthResult = useCallback(async (authResult: GitHubAuthResult) => {
    try {
      if (authResult.success && authResult.user) {
        setAuthState({
          user: authResult.user,
          isAuthenticated: true,
          isLoading: false,
          error: undefined,
        });
        
        setGitHubConnected(true);
        updateRateLimit();
        
      } else {
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: authResult.error || 'Authentication failed',
        }));
      }
    } catch (error) {
      console.error('Error handling auth result:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to process authentication result',
      }));
    }
  }, []);
  
  // Update rate limit information
  const updateRateLimit = useCallback(() => {
    if (githubClient.isAuthenticated()) {
      const rateLimitInfo = githubClient.getRateLimit();
      setRateLimit(rateLimitInfo);
    }
  }, []);
  
  // Periodically update rate limit info
  useEffect(() => {
    if (gitHubConnected) {
      const interval = setInterval(updateRateLimit, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [gitHubConnected, updateRateLimit]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    refreshUser,
    isConnectedToGitHub: gitHubConnected,
    gitHubRateLimit: rateLimit,
    lastSyncTime: authState.user?.lastSync,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
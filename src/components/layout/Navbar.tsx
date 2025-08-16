'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Settings, User, LogIn, LogOut, Bookmark, Globe } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/language-context';
import { useBookmarks } from '@/lib/bookmark-context';
import { Button } from '@/components/ui/button';
import { CompactSyncStatus, SyncActivityDot } from '@/components/ui/sync-status';
import { cn } from '@/lib/utils';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, login, logout, isLoading, isConnectedToGitHub } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { sync } = useBookmarks();

  const navItems = [
    { href: '/', label: t.nav.home, icon: Bookmark },
    { href: '/manage', label: t.nav.manage, icon: Settings },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      logout();
    } else {
      try {
        await login();
      } catch (error) {
        console.error('Login failed:', error);
      }
    }
  };

  return (
    <motion.nav
      className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-sm border-b border-gray-200"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 220, damping: 30, mass: 1 }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="flex items-center space-x-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">S</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Shelf</span>
            </motion.div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    className={cn(
                      "relative px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive 
                        ? "text-blue-600" 
                        : "text-gray-600 hover:text-gray-900"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                        layoutId="nav-indicator"
                        transition={{ type: "spring", stiffness: 220, damping: 30 }}
                      />
                    )}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3">
            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="flex items-center space-x-2"
              title={language === 'en' ? 'Switch to Chinese' : '切换到英文'}
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">
                {language === 'en' ? '中文' : 'EN'}
              </span>
            </Button>
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                {/* User Avatar with Sync Indicator */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <User className="h-4 w-4 text-white" />
                      )}
                    </div>
                    {/* Sync Activity Indicator */}
                    {isConnectedToGitHub && (
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <SyncActivityDot 
                          status={sync.status}
                          className="w-3 h-3 bg-white rounded-full p-0.5"
                        />
                      </div>
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    {isConnectedToGitHub ? (
                      <CompactSyncStatus 
                        status={sync.status}
                        lastSync={sync.lastSync}
                        error={sync.error}
                        compact={true}
                        className="text-xs"
                      />
                    ) : (
                      <p className="text-xs text-gray-500">GitHub not connected</p>
                    )}
                  </div>
                </div>

                {/* Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAuthAction}
                  disabled={isLoading}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">
                    {language === 'en' ? 'Sign Out' : '退出'}
                  </span>
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleAuthAction}
                disabled={isLoading}
              >
                <LogIn className="h-4 w-4 mr-2" />
                {isLoading 
                  ? (language === 'en' ? 'Connecting...' : '连接中...')
                  : (language === 'en' ? 'Sign In with GitHub' : '使用GitHub登录')
                }
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden border-t border-gray-200">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link key={item.href} href={item.href} className="flex-1">
                <motion.div
                  className={cn(
                    "flex flex-col items-center py-2 text-xs font-medium",
                    isActive 
                      ? "text-blue-600" 
                      : "text-gray-600"
                  )}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  <span>{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
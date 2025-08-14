'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ExternalLink, Tag, X } from 'lucide-react';
import { BookmarkFormData, UrlMetadata } from '@/lib/types';
import { useBookmarks } from '@/lib/bookmark-context';
import { useTranslations } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface BookmarkFormProps {
  collectionId: string;
  bookmarkId?: string | null;
  onSubmit: (data: BookmarkFormData) => void;
  onCancel: () => void;
}

export function BookmarkForm({ 
  collectionId, 
  bookmarkId, 
  onSubmit, 
  onCancel 
}: BookmarkFormProps) {
  const { data, addBookmark, updateBookmark, getCollectionById } = useBookmarks();
  const t = useTranslations();
  const [formData, setFormData] = useState<BookmarkFormData>({
    title: '',
    url: '',
    description: '',
    tags: [],
    collectionId: collectionId,
    pinned: false
  });
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [urlMetadata, setUrlMetadata] = useState<UrlMetadata | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const collection = getCollectionById(collectionId);
  const isEditing = !!bookmarkId;
  const existingBookmark = isEditing 
    ? data.bookmarks.find(b => b.id === bookmarkId)
    : null;

  // Initialize form data for editing
  useEffect(() => {
    if (isEditing && existingBookmark) {
      setFormData({
        title: existingBookmark.title,
        url: existingBookmark.url,
        description: existingBookmark.description || '',
        tags: existingBookmark.tags || [],
        collectionId: existingBookmark.collectionId,
        pinned: existingBookmark.pinned || false
      });
    }
  }, [isEditing, existingBookmark]);

  // Mock URL metadata fetching
  const fetchUrlMetadata = async (url: string): Promise<UrlMetadata> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock metadata based on domain
    const domain = new URL(url).hostname.toLowerCase();
    
    if (domain.includes('github.com')) {
      return {
        title: 'GitHub Repository',
        description: 'A code repository hosted on GitHub',
        favicon: 'https://github.githubassets.com/favicon.ico',
        image: undefined
      };
    } else if (domain.includes('stackoverflow.com')) {
      return {
        title: 'Stack Overflow Question',
        description: 'Programming questions and answers',
        favicon: 'https://cdn.sstatic.net/Sites/stackoverflow/Img/favicon.ico',
        image: undefined
      };
    } else if (domain.includes('youtube.com')) {
      return {
        title: 'YouTube Video',
        description: 'Video content from YouTube',
        favicon: 'https://www.youtube.com/favicon.ico',
        image: undefined
      };
    } else {
      return {
        title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Website`,
        description: `Content from ${domain}`,
        favicon: `https://${domain}/favicon.ico`,
        image: undefined
      };
    }
  };

  const handleUrlChange = async (url: string) => {
    setFormData(prev => ({ ...prev, url }));
    setErrors(prev => ({ ...prev, url: '' }));

    if (url && isValidUrl(url) && !isEditing) {
      setIsFetchingMetadata(true);
      try {
        const metadata = await fetchUrlMetadata(url);
        setUrlMetadata(metadata);
        
        // Auto-fill form fields if they're empty
        setFormData(prev => ({
          ...prev,
          title: prev.title || metadata.title || '',
          description: prev.description || metadata.description || ''
        }));
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      } finally {
        setIsFetchingMetadata(false);
      }
    }
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t.form.titleRequired;
    }

    if (!formData.url.trim()) {
      newErrors.url = t.form.urlRequired;
    } else if (!isValidUrl(formData.url)) {
      newErrors.url = t.form.invalidUrl;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && bookmarkId) {
        updateBookmark(bookmarkId, formData);
      } else {
        addBookmark(formData);
      }
      onSubmit(formData);
    } catch (error) {
      console.error('Failed to save bookmark:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <form id="bookmark-form" onSubmit={handleSubmit} className="flex-1 space-y-6">
      {/* URL Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{t.form.url}</label>
        <div className="relative">
          <Input
            type="url"
            placeholder={t.form.urlPlaceholder}
            value={formData.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className={cn(
              "pr-10",
              errors.url && "border-red-500 focus:ring-red-500"
            )}
          />
          {isFetchingMetadata && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            </div>
          )}
          {formData.url && isValidUrl(formData.url) && !isFetchingMetadata && (
            <button
              type="button"
              onClick={() => window.open(formData.url, '_blank')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
        {errors.url && (
          <p className="text-sm text-red-600">{errors.url}</p>
        )}
      </div>

      {/* URL Metadata Preview */}
      {urlMetadata && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gray-50 rounded-lg border"
        >
          <div className="flex items-start space-x-3">
            {urlMetadata.favicon && (
              <div className="w-6 h-6 flex-shrink-0">
                <Image
                  src={urlMetadata.favicon}
                  alt=""
                  width={24}
                  height={24}
                  className="w-full h-full object-cover rounded"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">
                {urlMetadata.title}
              </p>
              {urlMetadata.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                  {urlMetadata.description}
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Title Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{t.form.title}</label>
        <Input
          placeholder={t.form.titlePlaceholder}
          value={formData.title}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, title: e.target.value }));
            setErrors(prev => ({ ...prev, title: '' }));
          }}
          className={errors.title ? "border-red-500 focus:ring-red-500" : ""}
        />
        {errors.title && (
          <p className="text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      {/* Description Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{t.form.description}</label>
        <textarea
          placeholder={t.form.descriptionPlaceholder}
          rows={3}
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Tags Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{t.form.tags}</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="ml-2 hover:text-blue-600"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex space-x-2">
          <Input
            placeholder={t.form.addTag}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleAddTag}
            disabled={!newTag.trim()}
          >
            <Tag className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Collection Display */}
      {collection && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{collection.icon || '📚'}</span>
            <span className="text-sm font-medium text-gray-700">
              {t.form.saveTo} {collection.name}
            </span>
          </div>
        </div>
      )}

      {/* Pin Toggle */}
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          id="pinned"
          checked={formData.pinned}
          onChange={(e) => setFormData(prev => ({ ...prev, pinned: e.target.checked }))}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="pinned" className="text-sm font-medium text-gray-700">
          {t.form.pinToTop}
        </label>
      </div>

      </form>
      
      {/* Actions - Fixed at bottom */}
      <div className="sticky bottom-0 bg-background border-t border-gray-200 pt-4 mt-6">
        <div className="flex space-x-3">
          <Button
            type="submit"
            form="bookmark-form"
            disabled={isLoading}
            className="flex-1"
            onClick={handleSubmit}
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isEditing ? t.form.updateBookmark : t.form.addBookmark}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t.form.cancel}
          </Button>
        </div>
      </div>
    </div>
  );
}
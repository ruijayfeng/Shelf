'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Palette, Hash } from 'lucide-react';
import { Collection, CollectionFormData } from '@/lib/types';
import { useBookmarks } from '@/lib/bookmark-context';
import { useTranslations } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  collectionId?: string | null;
  mode: 'create' | 'edit';
}

const DEFAULT_COLORS = [
  '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899',
  '#6366F1', '#06B6D4', '#84CC16', '#F97316', '#14B8A6', '#8B5A2B'
];

const DEFAULT_ICONS = [
  '📚', '💻', '🎨', '📖', '🔧', '🎵', '🎬', '🏃', '🍔', '✈️', '🏠', '💼',
  '🎯', '💡', '🚀', '🎮', '📱', '🌟', '❤️', '🔥', '⭐', '🎪', '🎭', '🎪'
];

export function CollectionDialog({ isOpen, onClose, collectionId, mode }: CollectionDialogProps) {
  const { data, addCollection, updateCollection, deleteCollection } = useBookmarks();
  const t = useTranslations();
  
  const [formData, setFormData] = useState<CollectionFormData>({
    name: '',
    icon: '📚',
    color: DEFAULT_COLORS[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const existingCollection = collectionId 
    ? data.collections.find(c => c.id === collectionId)
    : null;

  // Initialize form data for editing
  useEffect(() => {
    if (mode === 'edit' && existingCollection) {
      setFormData({
        name: existingCollection.name,
        icon: existingCollection.icon || '📚',
        color: existingCollection.color || DEFAULT_COLORS[0]
      });
    } else if (mode === 'create') {
      setFormData({
        name: '',
        icon: '📚',
        color: DEFAULT_COLORS[0]
      });
    }
    setErrors({});
  }, [mode, existingCollection, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t.collection.nameRequired;
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
      if (mode === 'edit' && collectionId) {
        updateCollection(collectionId, formData);
      } else {
        addCollection(formData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!collectionId || !existingCollection) return;

    const confirmDelete = confirm(t.messages.confirmDeleteCollection);
    if (!confirmDelete) return;

    setIsLoading(true);
    try {
      deleteCollection(collectionId);
      onClose();
    } catch (error) {
      console.error('Failed to delete collection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIconSelect = (icon: string) => {
    setFormData(prev => ({ ...prev, icon }));
  };

  const handleColorSelect = (color: string) => {
    setFormData(prev => ({ ...prev, color }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'edit' ? t.collection.editCollection : t.collection.newCollection}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              {t.collection.name} *
            </label>
            <Input
              placeholder={t.collection.name}
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                setErrors(prev => ({ ...prev, name: '' }));
              }}
              className={errors.name ? "border-red-500 focus:ring-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Icon Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Hash className="h-4 w-4 mr-2" />
              {t.collection.icon}
            </label>
            <div className="grid grid-cols-12 gap-2 p-4 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
              {DEFAULT_ICONS.map((icon) => (
                <motion.button
                  key={icon}
                  type="button"
                  onClick={() => handleIconSelect(icon)}
                  className={`
                    p-2 rounded-lg text-xl hover:bg-white transition-colors
                    ${formData.icon === icon ? 'bg-white ring-2 ring-blue-500' : ''}
                  `}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {icon}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center">
              <Palette className="h-4 w-4 mr-2" />
              {t.collection.color}
            </label>
            <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
              {DEFAULT_COLORS.map((color) => (
                <motion.button
                  key={color}
                  type="button"
                  onClick={() => handleColorSelect(color)}
                  className={`
                    w-8 h-8 rounded-full border-2 transition-all
                    ${formData.color === color ? 'border-gray-400 scale-110' : 'border-transparent'}
                  `}
                  style={{ backgroundColor: color }}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                style={{ backgroundColor: `${formData.color}20` }}
              >
                {formData.icon}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {formData.name || t.collection.name}
                </h3>
                <p className="text-sm text-gray-600">Preview</p>
              </div>
              {formData.color && (
                <div
                  className="w-1 h-12 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <div>
              {mode === 'edit' && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                >
                  {t.collection.delete}
                </Button>
              )}
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                {t.form.cancel}
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
              >
                {mode === 'edit' ? t.collection.update : t.collection.create}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Tag as TagIcon, Plus, X, Search, Edit2, Trash2,
  ChevronRight, ChevronDown, Palette, Check, MoreVertical
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui';
import customizationService, { Tag } from '@/services/customization.service';

type CreateTagDto = {
  name: string;
  category?: string;
  color?: string;
  icon?: string;
  description?: string;
  parentId?: string;
};
import { parseApiError } from '@/services/api';

const colorPalette = [
  { name: 'Gray', value: '#6b7280', light: '#f3f4f6' },
  { name: 'Red', value: '#ef4444', light: '#fef2f2' },
  { name: 'Orange', value: '#f97316', light: '#fff7ed' },
  { name: 'Amber', value: '#f59e0b', light: '#fffbeb' },
  { name: 'Yellow', value: '#eab308', light: '#fefce8' },
  { name: 'Lime', value: '#84cc16', light: '#f7fee7' },
  { name: 'Green', value: '#22c55e', light: '#f0fdf4' },
  { name: 'Emerald', value: '#10b981', light: '#ecfdf5' },
  { name: 'Teal', value: '#14b8a6', light: '#f0fdfa' },
  { name: 'Cyan', value: '#06b6d4', light: '#ecfeff' },
  { name: 'Sky', value: '#0ea5e9', light: '#f0f9ff' },
  { name: 'Blue', value: '#3b82f6', light: '#eff6ff' },
  { name: 'Indigo', value: '#6366f1', light: '#eef2ff' },
  { name: 'Violet', value: '#8b5cf6', light: '#f5f3ff' },
  { name: 'Purple', value: '#a855f7', light: '#faf5ff' },
  { name: 'Fuchsia', value: '#d946ef', light: '#fdf4ff' },
  { name: 'Pink', value: '#ec4899', light: '#fdf2f8' },
  { name: 'Rose', value: '#f43f5e', light: '#fff1f2' },
];

interface TagEditorProps {
  tag?: Tag | null;
  parentOptions: Tag[];
  onSave: (tag: Partial<Tag>) => void;
  onCancel: () => void;
}

const TagEditor: React.FC<TagEditorProps> = ({ tag, parentOptions, onSave, onCancel }) => {
  const [name, setName] = useState(tag?.name || '');
  const [color, setColor] = useState(tag?.color || colorPalette[0].value);
  const [description, setDescription] = useState(tag?.description || '');
  const [parentId, setParentId] = useState(tag?.parentId || '');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Tag name is required');
      return;
    }
    onSave({ name, color, description, parentId: parentId || undefined });
  };

  const selectedColor = colorPalette.find(c => c.value === color) || colorPalette[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {tag ? 'Edit Tag' : 'Create Tag'}
          </h2>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Tag Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tag Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g., VIP, High Priority"
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          {/* Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Color
            </label>
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-6 h-6 rounded-lg" 
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{selectedColor.name}</span>
                </div>
                <Palette className="w-4 h-4 text-gray-400" />
              </button>

              <AnimatePresence>
                {showColorPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute left-0 right-0 mt-2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-10"
                  >
                    <div className="grid grid-cols-6 gap-2">
                      {colorPalette.map((c) => (
                        <button
                          key={c.value}
                          onClick={() => { setColor(c.value); setShowColorPicker(false); }}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform hover:scale-110 ${
                            color === c.value ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                          }`}
                          style={{ backgroundColor: c.value }}
                          title={c.name}
                        >
                          {color === c.value && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description"
              className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Parent Tag (for hierarchy) */}
          {parentOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parent Tag
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No parent (top level)</option>
                {parentOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview
            </label>
            <div className="flex items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: colorPalette.find(c => c.value === color)?.light || color + '20',
                  color 
                }}
              >
                <TagIcon className="w-3 h-3" />
                {name || 'Tag Name'}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            {tag ? 'Update Tag' : 'Create Tag'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface TagManagerProps {
  entityType?: string;
}

export const TagManager: React.FC<TagManagerProps> = ({ entityType }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; tagId: string; tagName: string }>({
    isOpen: false,
    tagId: '',
    tagName: '',
  });

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const data = await customizationService.getTags();
      setTags(data);
    } catch (error: unknown) {
      const apiError = parseApiError(error);
      toast.error(`Failed to load tags: ${apiError.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (tagData: Partial<Tag>) => {
    try {
      if (editingTag) {
        await customizationService.updateTag(editingTag.id, tagData);
        toast.success(`Tag "${tagData.name}" updated successfully`);
      } else {
        const createData: CreateTagDto = {
          name: tagData.name || '',
          color: tagData.color,
          description: tagData.description,
          parentId: tagData.parentId,
        };
        await customizationService.createTag(createData);
        toast.success(`Tag "${tagData.name}" created successfully`);
      }
      setShowEditor(false);
      setEditingTag(null);
      await loadTags();
    } catch (error: unknown) {
      const apiError = parseApiError(error);
      toast.error(`Failed to save tag: ${apiError.message}`);
    }
  };

  const handleDeleteClick = (tag: Tag) => {
    setDeleteConfirm({
      isOpen: true,
      tagId: tag.id,
      tagName: tag.name,
    });
  };

  const handleDeleteConfirm = async () => {
    try {
      await customizationService.deleteTag(deleteConfirm.tagId);
      toast.success(`Tag "${deleteConfirm.tagName}" deleted`);
      setDeleteConfirm({ isOpen: false, tagId: '', tagName: '' });
      await loadTags();
    } catch (error: unknown) {
      const apiError = parseApiError(error);
      toast.error(`Failed to delete tag: ${apiError.message}`);
    }
  };

  // Build tree structure
  const tagTree = useMemo(() => {
    const map = new Map<string, Tag & { children: Tag[] }>();
    const roots: (Tag & { children: Tag[] })[] = [];

    tags.forEach(tag => {
      map.set(tag.id, { ...tag, children: [] });
    });

    tags.forEach(tag => {
      const node = map.get(tag.id)!;
      if (tag.parentId) {
        const parent = map.get(tag.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [tags]);

  // Filter tags by search
  const filteredTags = search
    ? tags.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
    : null;

  // Get possible parents (exclude self and children)
  const getParentOptions = (excludeId?: string): Tag[] => {
    if (!excludeId) return tags.filter(t => !t.parentId);
    return tags.filter(t => t.id !== excludeId && !t.parentId);
  };

  const toggleExpand = (id: string) => {
    setExpandedTags(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderTagTree = (nodes: Tag[], depth = 0) => {
    return nodes.map(tag => (
      <div key={tag.id} style={{ marginLeft: depth * 20 }}>
        <div className="group flex items-center gap-3 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl">
          {(tag.children?.length ?? 0) > 0 && (
            <button
              onClick={() => toggleExpand(tag.id)}
              className="p-0.5 text-gray-400 hover:text-gray-600"
            >
              {expandedTags.has(tag.id) ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          {(tag.children?.length ?? 0) === 0 && <div className="w-5" />}
          
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
            style={{ 
              backgroundColor: colorPalette.find(c => c.value === tag.color)?.light || tag.color + '20',
              color: tag.color 
            }}
          >
            <TagIcon className="w-3 h-3" />
            {tag.name}
          </span>
          
          {tag.usageCount !== undefined && (
            <span className="text-xs text-gray-400">
              {tag.usageCount} items
            </span>
          )}

          <div className="flex-1" />

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => { setEditingTag(tag); setShowEditor(true); }}
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleDeleteClick(tag)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
              aria-label={`Delete tag ${tag.name}`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {(tag.children?.length ?? 0) > 0 && expandedTags.has(tag.id) && (
          <div>{renderTagTree(tag.children ?? [], depth + 1)}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Tags
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Organize and categorize your data with tags
            </p>
          </div>
          <button
            onClick={() => { setEditingTag(null); setShowEditor(true); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Tag
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tags..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Tags List */}
      <div className="p-4">
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : tags.length === 0 ? (
          <div className="text-center py-12">
            <TagIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500">No tags created yet</p>
            <p className="text-gray-400 text-sm mt-1">Create tags to organize your data</p>
          </div>
        ) : filteredTags ? (
          // Search results (flat list)
          <div className="space-y-1">
            {filteredTags.map(tag => (
              <div key={tag.id} className="group flex items-center gap-3 py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium"
                  style={{ 
                    backgroundColor: colorPalette.find(c => c.value === tag.color)?.light || tag.color + '20',
                    color: tag.color 
                  }}
                >
                  <TagIcon className="w-3 h-3" />
                  {tag.name}
                </span>
                <div className="flex-1" />
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => { setEditingTag(tag); setShowEditor(true); }}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(tag)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    aria-label={`Delete tag ${tag.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Tree view
          <div>{renderTagTree(tagTree)}</div>
        )}
      </div>

      {/* Tag Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <TagEditor
            tag={editingTag}
            parentOptions={getParentOptions(editingTag?.id)}
            onSave={handleSave}
            onCancel={() => { setShowEditor(false); setEditingTag(null); }}
          />
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, tagId: '', tagName: '' })}
        onConfirm={handleDeleteConfirm}
        title="Delete Tag"
        message={`Are you sure you want to delete the tag "${deleteConfirm.tagName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
};

export default TagManager;

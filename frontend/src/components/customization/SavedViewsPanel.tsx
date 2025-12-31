'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Eye, Plus, X, Search, Edit2, Trash2, Star,
  Filter, SortAsc, Layout, Copy, Share2, Globe,
  Lock, Users, Check, ChevronDown, Save
} from 'lucide-react';
import customizationService, { SavedView } from '@/services/customization.service';

interface ViewEditorProps {
  view?: SavedView | null;
  entityType: string;
  currentFilters?: Array<{ field: string; operator: string; value: any }>;
  currentSort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  currentColumns?: Array<{ key: string; label: string; width?: number; visible: boolean }>;
  onSave: (view: Partial<SavedView>) => void;
  onCancel: () => void;
}

const ViewEditor: React.FC<ViewEditorProps> = ({
  view,
  entityType,
  currentFilters,
  currentSort,
  currentColumns,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(view?.name || '');
  const [description, setDescription] = useState(view?.description || '');
  const [visibility, setVisibility] = useState<'private' | 'team' | 'public'>(view?.isShared ? 'team' : 'private');
  const [isDefault, setIsDefault] = useState(view?.isDefault || false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('View name is required');
      return;
    }
    onSave({
      name,
      description,
      entityType,
      filters: view?.filters ?? currentFilters ?? [],
      sorting: view?.sorting ?? currentSort ?? [],
      columns: view?.columns ?? currentColumns ?? [],
      isShared: visibility !== 'private',
      isDefault,
    });
  };

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
            {view ? 'Edit View' : 'Save Current View'}
          </h2>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* View Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              View Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="e.g., High Value Clients, Active Prospects"
              className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'
              }`}
            />
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
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

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Visibility
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'private', icon: Lock, label: 'Private', desc: 'Only you' },
                { value: 'team', icon: Users, label: 'Team', desc: 'Your team' },
                { value: 'public', icon: Globe, label: 'Public', desc: 'Everyone' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setVisibility(option.value as any)}
                  className={`p-3 flex flex-col items-center gap-1 rounded-xl border-2 transition-all ${
                    visibility === option.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <option.icon className={`w-5 h-5 ${visibility === option.value ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium ${visibility === option.value ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'}`}>
                    {option.label}
                  </span>
                  <span className="text-xs text-gray-400">{option.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Default view toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-sm">Set as default view</p>
              <p className="text-xs text-gray-500 mt-0.5">This view will load automatically</p>
            </div>
            <button
              onClick={() => setIsDefault(!isDefault)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isDefault ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
            >
              <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                isDefault ? 'translate-x-6' : ''
              }`} />
            </button>
          </div>

          {/* Preview of what's saved */}
          {!view && (
            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
                This view will save:
              </p>
              <ul className="text-xs text-amber-700 dark:text-amber-300 space-y-1">
                <li className="flex items-center gap-2">
                  <Filter className="w-3 h-3" />
                  {currentFilters?.length ?? 0} active filters
                </li>
                <li className="flex items-center gap-2">
                  <SortAsc className="w-3 h-3" />
                  {currentSort?.length ?? 0} sort rules
                </li>
                <li className="flex items-center gap-2">
                  <Layout className="w-3 h-3" />
                  {currentColumns?.length ?? 0} visible columns
                </li>
              </ul>
            </div>
          )}
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
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            <Save className="w-4 h-4" />
            {view ? 'Update View' : 'Save View'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

interface SavedViewsPanelProps {
  entityType: string;
  currentFilters?: Array<{ field: string; operator: string; value: any }>;
  currentSort?: Array<{ field: string; direction: 'asc' | 'desc' }>;
  currentColumns?: Array<{ key: string; label: string; width?: number; visible: boolean }>;
  onSelectView: (view: SavedView) => void;
}

export const SavedViewsPanel: React.FC<SavedViewsPanelProps> = ({
  entityType,
  currentFilters = [],
  currentSort = [],
  currentColumns = [],
  onSelectView,
}) => {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingView, setEditingView] = useState<SavedView | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadViews();
  }, [entityType]);

  const loadViews = async () => {
    try {
      setLoading(true);
      const data = await customizationService.getSavedViews(entityType);
      setViews(data);
      // Set default view as active
      const defaultView = data.find(v => v.isDefault);
      if (defaultView) {
        setActiveViewId(defaultView.id);
      }
    } catch (error) {
      console.error('Failed to load views:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (viewData: Partial<SavedView>) => {
    try {
      if (editingView) {
        await customizationService.updateSavedView(editingView.id, viewData);
      } else {
        await customizationService.createSavedView(viewData as any);
      }
      setShowEditor(false);
      setEditingView(null);
      await loadViews();
    } catch (error) {
      console.error('Failed to save view:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this view?')) {
      try {
        await customizationService.deleteSavedView(id);
        if (activeViewId === id) setActiveViewId(null);
        await loadViews();
      } catch (error) {
        console.error('Failed to delete view:', error);
      }
    }
  };

  const handleSelect = (view: SavedView) => {
    setActiveViewId(view.id);
    onSelectView(view);
    setShowDropdown(false);
  };

  const handleDuplicate = async (view: SavedView) => {
    try {
      await customizationService.createSavedView({
        ...view,
        name: `${view.name} (Copy)`,
        isDefault: false,
      });
      await loadViews();
    } catch (error) {
      console.error('Failed to duplicate view:', error);
    }
  };

  const activeView = views.find(v => v.id === activeViewId);

  return (
    <div className="relative">
      {/* View Selector Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Eye className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {activeView ? activeView.name : 'All Items'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        <button
          onClick={() => { setEditingView(null); setShowEditor(true); }}
          className="flex items-center gap-1.5 px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
          title="Save current view"
        >
          <Save className="w-4 h-4" />
          <span className="text-sm font-medium">Save View</span>
        </button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="absolute left-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50"
          >
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search views..."
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto py-2">
              {/* Default option */}
              <button
                onClick={() => { setActiveViewId(null); onSelectView({} as SavedView); setShowDropdown(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                  !activeViewId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <Eye className="w-4 h-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">All Items</span>
                {!activeViewId && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
              </button>

              {loading ? (
                <div className="px-4 py-2">
                  <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ) : views.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-sm text-gray-500">No saved views yet</p>
                </div>
              ) : (
                views.map(view => (
                  <div
                    key={view.id}
                    className={`group relative flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      activeViewId === view.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleSelect(view)}
                      className="flex-1 flex items-center gap-3 text-left"
                    >
                      {view.isDefault ? (
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      ) : view.isShared ? (
                        <Users className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                          {view.name}
                        </p>
                        {view.description && (
                          <p className="text-xs text-gray-400 truncate">{view.description}</p>
                        )}
                      </div>
                      {activeViewId === view.id && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => { setEditingView(view); setShowEditor(true); setShowDropdown(false); }}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded"
                        title="Edit view"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(view)}
                        className="p-1 text-gray-400 hover:text-green-600 rounded"
                        title="Duplicate view"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(view.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                        title="Delete view"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)} 
        />
      )}

      {/* View Editor Modal */}
      <AnimatePresence>
        {showEditor && (
          <ViewEditor
            view={editingView}
            entityType={entityType}
            currentFilters={currentFilters}
            currentSort={currentSort}
            currentColumns={currentColumns}
            onSave={handleSave}
            onCancel={() => { setShowEditor(false); setEditingView(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SavedViewsPanel;

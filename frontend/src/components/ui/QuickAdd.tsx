'use client';

import * as React from 'react';
import { useState, useCallback, useEffect, useRef, useMemo, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';

// ============================================================================
// Types
// ============================================================================

export type QuickAddType =
  | 'client'
  | 'task'
  | 'note'
  | 'meeting'
  | 'call'
  | 'email'
  | 'document'
  | 'reminder'
  | 'opportunity'
  | 'activity';

export interface QuickAddFormData {
  type: QuickAddType;
  title: string;
  description?: string;
  clientId?: string;
  clientName?: string;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigneeId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface QuickAddClient {
  id: string;
  name: string;
  email?: string;
  tier?: string;
}

export interface QuickAddConfig {
  enabledTypes?: QuickAddType[];
  defaultType?: QuickAddType;
  recentClients?: QuickAddClient[];
  onSubmit: (data: QuickAddFormData) => Promise<void>;
  onSearchClients?: (query: string) => Promise<QuickAddClient[]>;
}

// ============================================================================
// Context
// ============================================================================

interface QuickAddContextValue {
  isOpen: boolean;
  open: (type?: QuickAddType, prefill?: Partial<QuickAddFormData>) => void;
  close: () => void;
  toggle: () => void;
}

const QuickAddContext = createContext<QuickAddContextValue | null>(null);

export function useQuickAdd() {
  const context = useContext(QuickAddContext);
  if (!context) {
    throw new Error('useQuickAdd must be used within a QuickAddProvider');
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

export interface QuickAddProviderProps {
  children: React.ReactNode;
  config: QuickAddConfig;
}

export function QuickAddProvider({ children, config }: QuickAddProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialType, setInitialType] = useState<QuickAddType | undefined>();
  const [prefillData, setPrefillData] = useState<Partial<QuickAddFormData>>({});

  const open = useCallback((type?: QuickAddType, prefill?: Partial<QuickAddFormData>) => {
    setInitialType(type);
    setPrefillData(prefill || {});
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setInitialType(undefined);
    setPrefillData({});
  }, []);

  const toggle = useCallback(() => {
    if (isOpen) {
      close();
    } else {
      open();
    }
  }, [isOpen, open, close]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift + N to open quick add
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        toggle();
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle, close, isOpen]);

  return (
    <QuickAddContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      <QuickAddModal
        isOpen={isOpen}
        onClose={close}
        config={config}
        initialType={initialType}
        prefillData={prefillData}
      />
    </QuickAddContext.Provider>
  );
}

// ============================================================================
// Quick Add Modal
// ============================================================================

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: QuickAddConfig;
  initialType?: QuickAddType;
  prefillData?: Partial<QuickAddFormData>;
}

function QuickAddModal({
  isOpen,
  onClose,
  config,
  initialType,
  prefillData = {},
}: QuickAddModalProps) {
  const enabledTypes = config.enabledTypes || allQuickAddTypes;
  const defaultType = initialType || config.defaultType || enabledTypes[0];

  const [selectedType, setSelectedType] = useState<QuickAddType>(defaultType);
  const [title, setTitle] = useState(prefillData.title || '');
  const [description, setDescription] = useState(prefillData.description || '');
  const [selectedClient, setSelectedClient] = useState<QuickAddClient | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [clientResults, setClientResults] = useState<QuickAddClient[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const clientInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedType(initialType || defaultType);
      setTitle(prefillData.title || '');
      setDescription(prefillData.description || '');
      setSelectedClient(null);
      setClientSearch('');
      setDueDate('');
      setPriority('medium');
      setTags([]);
      setTagInput('');
      setError(null);

      // Focus title input after animation
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, initialType, defaultType, prefillData]);

  // Search clients
  useEffect(() => {
    if (!clientSearch || !config.onSearchClients) {
      setClientResults(config.recentClients || []);
      return;
    }

    const searchClients = async () => {
      try {
        const results = await config.onSearchClients!(clientSearch);
        setClientResults(results);
      } catch {
        setClientResults([]);
      }
    };

    const debounce = setTimeout(searchClients, 200);
    return () => clearTimeout(debounce);
  }, [clientSearch, config.onSearchClients, config.recentClients]);

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await config.onSubmit({
        type: selectedType,
        title: title.trim(),
        description: description.trim() || undefined,
        clientId: selectedClient?.id,
        clientName: selectedClient?.name,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        tags: tags.length > 0 ? tags : undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle tag input
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  // Get type-specific fields
  const typeConfig = getTypeConfig(selectedType);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 z-popover w-full max-w-xl"
          >
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg shadow-lg overflow-hidden">
              {/* Type Selector */}
              <div className="flex items-center gap-1 p-2 border-b border-neutral-800 overflow-x-auto scrollbar-thin">
                {enabledTypes.map((type) => {
                  const config = getTypeConfig(type);
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                        selectedType === type
                          ? 'bg-accent-600 text-white'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      )}
                    >
                      <config.icon className="w-4 h-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Title */}
                <div>
                  <input
                    ref={titleInputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={typeConfig.titlePlaceholder}
                    className={cn(
                      'w-full px-0 py-2 text-lg font-medium bg-transparent border-0',
                      'text-white placeholder-neutral-500',
                      'focus:outline-none focus:ring-0'
                    )}
                  />
                </div>

                {/* Description (optional) */}
                {typeConfig.hasDescription && (
                  <div>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={typeConfig.descriptionPlaceholder || 'Add description...'}
                      rows={2}
                      className={cn(
                        'w-full px-3 py-2 text-sm rounded-lg resize-none',
                        'bg-neutral-800 border border-neutral-700',
                        'text-white placeholder-neutral-500',
                        'focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500'
                      )}
                    />
                  </div>
                )}

                {/* Client Selector */}
                {typeConfig.hasClient && (
                  <div className="relative">
                    <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                      Client
                    </label>
                    {selectedClient ? (
                      <div className="flex items-center justify-between px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-neutral-700 flex items-center justify-center">
                            <span className="text-xs font-medium text-white">
                              {selectedClient.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {selectedClient.name}
                            </div>
                            {selectedClient.email && (
                              <div className="text-xs text-neutral-400">
                                {selectedClient.email}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedClient(null)}
                          className="p-1 rounded hover:bg-neutral-700 text-neutral-400"
                        >
                          <CloseIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          ref={clientInputRef}
                          type="text"
                          value={clientSearch}
                          onChange={(e) => setClientSearch(e.target.value)}
                          onFocus={() => setShowClientDropdown(true)}
                          placeholder="Search for a client..."
                          className={cn(
                            'w-full px-3 py-2 text-sm rounded-lg',
                            'bg-neutral-800 border border-neutral-700',
                            'text-white placeholder-neutral-500',
                            'focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500'
                          )}
                        />
                        <SearchIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />

                        {/* Client Dropdown */}
                        <AnimatePresence>
                          {showClientDropdown && clientResults.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              className="absolute top-full left-0 right-0 mt-1 z-dropdown bg-neutral-800 border border-neutral-700 rounded-lg shadow-lg overflow-hidden"
                            >
                              <div className="max-h-48 overflow-y-auto">
                                {clientResults.map((client) => (
                                  <button
                                    key={client.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedClient(client);
                                      setClientSearch('');
                                      setShowClientDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-neutral-700 transition-colors"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-neutral-600 flex items-center justify-center">
                                      <span className="text-xs font-medium text-white">
                                        {client.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-white">
                                        {client.name}
                                      </div>
                                      {client.email && (
                                        <div className="text-xs text-neutral-400">
                                          {client.email}
                                        </div>
                                      )}
                                    </div>
                                    {client.tier && (
                                      <span className="ml-auto text-xs px-1.5 py-0.5 bg-neutral-700 text-neutral-300 rounded capitalize">
                                        {client.tier}
                                      </span>
                                    )}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}

                {/* Due Date & Priority Row */}
                {(typeConfig.hasDueDate || typeConfig.hasPriority) && (
                  <div className="flex gap-3">
                    {typeConfig.hasDueDate && (
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                          {selectedType === 'meeting' ? 'Date & Time' : 'Due Date'}
                        </label>
                        <input
                          type={selectedType === 'meeting' ? 'datetime-local' : 'date'}
                          value={dueDate}
                          onChange={(e) => setDueDate(e.target.value)}
                          className={cn(
                            'w-full px-3 py-2 text-sm rounded-lg',
                            'bg-neutral-800 border border-neutral-700',
                            'text-white',
                            'focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500'
                          )}
                        />
                      </div>
                    )}
                    {typeConfig.hasPriority && (
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                          Priority
                        </label>
                        <div className="flex gap-1">
                          {(['low', 'medium', 'high', 'urgent'] as const).map((p) => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPriority(p)}
                              className={cn(
                                'flex-1 py-2 text-xs font-medium rounded-lg transition-all capitalize',
                                priority === p
                                  ? priorityColors[p].active
                                  : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                              )}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tags */}
                <div>
                  <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                    Tags
                  </label>
                  <div className={cn(
                    'flex flex-wrap items-center gap-1.5 px-3 py-2 rounded-lg',
                    'bg-neutral-800 border border-neutral-700',
                    'focus-within:ring-2 focus-within:ring-accent-500/50 focus-within:border-accent-500'
                  )}>
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-neutral-700 text-neutral-300 rounded-full text-xs"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="p-0.5 hover:text-white"
                        >
                          <CloseIcon className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      placeholder={tags.length === 0 ? 'Add tags...' : ''}
                      className="flex-1 min-w-[100px] bg-transparent border-0 text-sm text-white placeholder-neutral-500 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    Press Enter or comma to add tags
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="px-3 py-2 bg-status-error-bg border border-status-error-border rounded-lg">
                    <p className="text-sm text-status-error-text">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                  <div className="text-xs text-neutral-500">
                    <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[10px]">
                      ⌘⇧N
                    </kbd>{' '}
                    to toggle
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !title.trim()}
                      className={cn(
                        'px-4 py-2 text-sm font-medium rounded-lg transition-all',
                        'bg-accent-600 text-white hover:bg-accent-500',
                        'disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed',
                        isSubmitting && 'opacity-75'
                      )}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <LoadingSpinner className="w-4 h-4" />
                          Creating...
                        </span>
                      ) : (
                        `Create ${typeConfig.label}`
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Quick Add Button (FAB)
// ============================================================================

export interface QuickAddButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  showLabel?: boolean;
  className?: string;
}

export function QuickAddButton({
  position = 'bottom-right',
  showLabel = false,
  className,
}: QuickAddButtonProps) {
  const { open } = useQuickAdd();

  const positions = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'bottom-center': 'fixed bottom-6 left-1/2 -translate-x-1/2',
  };

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => open()}
      className={cn(
        positions[position],
        'z-50 flex items-center gap-2 px-4 py-3 rounded-full shadow-lg',
        'bg-accent-600 text-white',
        'hover:bg-accent-500 hover:shadow-xl hover:shadow-accent-500/30',
        'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-neutral-900',
        'transition-shadow duration-moderate',
        className
      )}
    >
      <PlusIcon className="w-5 h-5" />
      {showLabel && <span className="font-medium">Quick Add</span>}
    </motion.button>
  );
}

// ============================================================================
// Inline Quick Add (for embedding)
// ============================================================================

export interface InlineQuickAddProps {
  types?: QuickAddType[];
  onAdd: (type: QuickAddType) => void;
  className?: string;
}

export function InlineQuickAdd({
  types = ['task', 'note', 'meeting'],
  onAdd,
  className,
}: InlineQuickAddProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-xs text-neutral-500">Quick add:</span>
      {types.map((type) => {
        const config = getTypeConfig(type);
        return (
          <button
            key={type}
            onClick={() => onAdd(type)}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium',
              'bg-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-700',
              'transition-all duration-base'
            )}
          >
            <config.icon className="w-3.5 h-3.5" />
            {config.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Configuration
// ============================================================================

const allQuickAddTypes: QuickAddType[] = [
  'task',
  'note',
  'meeting',
  'call',
  'email',
  'client',
  'document',
  'reminder',
  'opportunity',
  'activity',
];

interface TypeConfig {
  label: string;
  icon: React.FC<{ className?: string }>;
  titlePlaceholder: string;
  descriptionPlaceholder?: string;
  hasDescription: boolean;
  hasClient: boolean;
  hasDueDate: boolean;
  hasPriority: boolean;
}

function getTypeConfig(type: QuickAddType): TypeConfig {
  const configs: Record<QuickAddType, TypeConfig> = {
    task: {
      label: 'Task',
      icon: TaskIcon,
      titlePlaceholder: 'What needs to be done?',
      descriptionPlaceholder: 'Add details...',
      hasDescription: true,
      hasClient: true,
      hasDueDate: true,
      hasPriority: true,
    },
    note: {
      label: 'Note',
      icon: NoteIcon,
      titlePlaceholder: 'Note title',
      descriptionPlaceholder: 'Write your note...',
      hasDescription: true,
      hasClient: true,
      hasDueDate: false,
      hasPriority: false,
    },
    meeting: {
      label: 'Meeting',
      icon: CalendarIcon,
      titlePlaceholder: 'Meeting title',
      descriptionPlaceholder: 'Add agenda or notes...',
      hasDescription: true,
      hasClient: true,
      hasDueDate: true,
      hasPriority: false,
    },
    call: {
      label: 'Call',
      icon: PhoneIcon,
      titlePlaceholder: 'Call purpose',
      descriptionPlaceholder: 'Call notes...',
      hasDescription: true,
      hasClient: true,
      hasDueDate: true,
      hasPriority: false,
    },
    email: {
      label: 'Email',
      icon: EmailIcon,
      titlePlaceholder: 'Email subject',
      descriptionPlaceholder: 'Draft email content...',
      hasDescription: true,
      hasClient: true,
      hasDueDate: false,
      hasPriority: false,
    },
    client: {
      label: 'Client',
      icon: PersonIcon,
      titlePlaceholder: 'Client name',
      descriptionPlaceholder: 'Additional notes...',
      hasDescription: true,
      hasClient: false,
      hasDueDate: false,
      hasPriority: false,
    },
    document: {
      label: 'Document',
      icon: DocumentIcon,
      titlePlaceholder: 'Document name',
      descriptionPlaceholder: 'Description...',
      hasDescription: true,
      hasClient: true,
      hasDueDate: false,
      hasPriority: false,
    },
    reminder: {
      label: 'Reminder',
      icon: BellIcon,
      titlePlaceholder: 'What to remember?',
      hasDescription: false,
      hasClient: true,
      hasDueDate: true,
      hasPriority: true,
    },
    opportunity: {
      label: 'Opportunity',
      icon: StarIcon,
      titlePlaceholder: 'Opportunity name',
      descriptionPlaceholder: 'Details...',
      hasDescription: true,
      hasClient: true,
      hasDueDate: true,
      hasPriority: true,
    },
    activity: {
      label: 'Activity',
      icon: ActivityIcon,
      titlePlaceholder: 'Activity description',
      hasDescription: true,
      hasClient: true,
      hasDueDate: false,
      hasPriority: false,
    },
  };

  return configs[type];
}

const priorityColors = {
  low: {
    active: 'bg-neutral-600 text-white',
  },
  medium: {
    active: 'bg-status-info-text text-white',
  },
  high: {
    active: 'bg-status-warning-text text-white',
  },
  urgent: {
    active: 'bg-status-error-text text-white',
  },
};

// ============================================================================
// Icons
// ============================================================================

function TaskIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function EmailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={cn('animate-spin', className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default QuickAddProvider;

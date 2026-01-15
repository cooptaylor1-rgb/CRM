'use client';

import * as React from 'react';
import { useState, useCallback, useEffect, useRef, createContext, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './utils';

// ============================================================================
// Types
// ============================================================================

export type CopilotContext =
  | 'client_profile'
  | 'client_list'
  | 'meeting_prep'
  | 'email_compose'
  | 'task_list'
  | 'dashboard'
  | 'portfolio_review'
  | 'document_view'
  | 'search_results'
  | 'general';

export type SuggestionType =
  | 'action'
  | 'insight'
  | 'reminder'
  | 'question'
  | 'template'
  | 'draft'
  | 'follow_up';

export interface CopilotSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  description?: string;
  confidence: number; // 0-100
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  metadata?: Record<string, unknown>;
  isNew?: boolean;
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  suggestions?: CopilotSuggestion[];
  isStreaming?: boolean;
}

export interface CopilotContextData {
  context: CopilotContext;
  clientId?: string;
  clientName?: string;
  pageTitle?: string;
  selectedItems?: string[];
  additionalContext?: Record<string, unknown>;
}

// ============================================================================
// Context
// ============================================================================

interface AICopilotContextValue {
  isOpen: boolean;
  isMinimized: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  minimize: () => void;
  maximize: () => void;
  setContext: (context: CopilotContextData) => void;
  suggestions: CopilotSuggestion[];
  sendMessage: (message: string) => Promise<void>;
  messages: CopilotMessage[];
  isLoading: boolean;
}

const AICopilotContext = createContext<AICopilotContextValue | null>(null);

export function useAICopilot() {
  const context = useContext(AICopilotContext);
  if (!context) {
    throw new Error('useAICopilot must be used within an AICopilotProvider');
  }
  return context;
}

// ============================================================================
// Provider
// ============================================================================

export interface AICopilotProviderProps {
  children: React.ReactNode;
  onSendMessage: (message: string, context: CopilotContextData) => Promise<{
    response: string;
    suggestions?: CopilotSuggestion[];
  }>;
  onGetSuggestions: (context: CopilotContextData) => Promise<CopilotSuggestion[]>;
  initialContext?: CopilotContextData;
}

export function AICopilotProvider({
  children,
  onSendMessage,
  onGetSuggestions,
  initialContext = { context: 'general' },
}: AICopilotProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [contextData, setContextData] = useState<CopilotContextData>(initialContext);
  const [suggestions, setSuggestions] = useState<CopilotSuggestion[]>([]);
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load suggestions when context changes
  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const newSuggestions = await onGetSuggestions(contextData);
        setSuggestions(newSuggestions);
      } catch (error) {
        console.error('Failed to load suggestions:', error);
      }
    };

    loadSuggestions();
  }, [contextData, onGetSuggestions]);

  const open = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    if (isOpen && !isMinimized) {
      close();
    } else {
      open();
    }
  }, [isOpen, isMinimized, open, close]);

  const minimize = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximize = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const setContext = useCallback((context: CopilotContextData) => {
    setContextData(context);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: CopilotMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const result = await onSendMessage(content, contextData);

      const assistantMessage: CopilotMessage = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        suggestions: result.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (result.suggestions) {
        setSuggestions(result.suggestions);
      }
    } catch (error) {
      const errorMessage: CopilotMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [contextData, onSendMessage]);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + J to toggle copilot
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        toggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return (
    <AICopilotContext.Provider
      value={{
        isOpen,
        isMinimized,
        open,
        close,
        toggle,
        minimize,
        maximize,
        setContext,
        suggestions,
        sendMessage,
        messages,
        isLoading,
      }}
    >
      {children}
    </AICopilotContext.Provider>
  );
}

// ============================================================================
// AI Copilot Panel
// ============================================================================

export interface AICopilotPanelProps {
  position?: 'right' | 'bottom' | 'floating';
  className?: string;
}

export function AICopilotPanel({
  position = 'right',
  className,
}: AICopilotPanelProps) {
  const {
    isOpen,
    isMinimized,
    close,
    minimize,
    maximize,
    suggestions,
    sendMessage,
    messages,
    isLoading,
  } = useAICopilot();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const positionClasses = {
    right: 'fixed right-4 top-20 bottom-4 w-96',
    bottom: 'fixed left-4 right-4 bottom-4 h-96',
    floating: 'fixed right-4 bottom-20 w-96 max-h-[70vh]',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, x: position === 'right' ? 20 : 0, y: position === 'bottom' ? 20 : 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: position === 'right' ? 20 : 0, y: position === 'bottom' ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={cn(
            'z-50 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl flex flex-col overflow-hidden',
            positionClasses[position],
            isMinimized && 'h-14',
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800 bg-neutral-800/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-purple-600 flex items-center justify-center">
                <SparklesIcon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">AI Copilot</h3>
                {!isMinimized && (
                  <p className="text-[10px] text-neutral-400">
                    Press ⌘J to toggle
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={isMinimized ? maximize : minimize}
                className="p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              >
                {isMinimized ? (
                  <MaximizeIcon className="w-4 h-4" />
                ) : (
                  <MinimizeIcon className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={close}
                className="p-1.5 rounded-lg hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <>
              {/* Suggestions */}
              {messages.length === 0 && suggestions.length > 0 && (
                <div className="p-4 border-b border-neutral-800">
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                    Suggestions
                  </h4>
                  <div className="space-y-2">
                    {suggestions.slice(0, 3).map((suggestion) => (
                      <SuggestionCard
                        key={suggestion.id}
                        suggestion={suggestion}
                        compact
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-accent-500/20 to-purple-600/20 flex items-center justify-center">
                      <SparklesIcon className="w-8 h-8 text-accent-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">
                      How can I help?
                    </h4>
                    <p className="text-sm text-neutral-400 max-w-xs mx-auto">
                      Ask me anything about your clients, upcoming meetings, or tasks.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))
                )}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <SparklesIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <LoadingDots />
                        <span className="text-xs text-neutral-400">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-800">
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    rows={1}
                    className={cn(
                      'w-full px-4 py-3 pr-12 text-sm rounded-xl resize-none',
                      'bg-neutral-800 border border-neutral-700',
                      'text-white placeholder-neutral-500',
                      'focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500'
                    )}
                    style={{ minHeight: '48px', maxHeight: '120px' }}
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className={cn(
                      'absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors',
                      input.trim() && !isLoading
                        ? 'bg-accent-600 text-white hover:bg-accent-500'
                        : 'bg-neutral-700 text-neutral-500 cursor-not-allowed'
                    )}
                  >
                    <SendIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs text-neutral-500">Try:</span>
                  {quickPrompts.slice(0, 3).map((prompt, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setInput(prompt)}
                      className="px-2 py-1 text-xs bg-neutral-800 text-neutral-400 rounded-lg hover:bg-neutral-700 hover:text-white transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </form>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Message Bubble
// ============================================================================

interface MessageBubbleProps {
  message: CopilotMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
      {/* Avatar */}
      {isUser ? (
        <div className="w-8 h-8 rounded-lg bg-neutral-700 flex items-center justify-center flex-shrink-0">
          <UserIcon className="w-4 h-4 text-neutral-300" />
        </div>
      ) : (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-purple-600 flex items-center justify-center flex-shrink-0">
          <SparklesIcon className="w-4 h-4 text-white" />
        </div>
      )}

      {/* Content */}
      <div className={cn('flex-1 max-w-[85%]', isUser && 'flex flex-col items-end')}>
        <div
          className={cn(
            'px-4 py-2.5 rounded-xl text-sm',
            isUser
              ? 'bg-accent-600 text-white rounded-br-none'
              : 'bg-neutral-800 text-neutral-100 rounded-bl-none'
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-neutral-500 mt-1">
          {formatTime(message.timestamp)}
        </span>

        {/* Suggestions */}
        {message.suggestions && message.suggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                compact
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Suggestion Card
// ============================================================================

interface SuggestionCardProps {
  suggestion: CopilotSuggestion;
  compact?: boolean;
  className?: string;
}

function SuggestionCard({
  suggestion,
  compact = false,
  className,
}: SuggestionCardProps) {
  const typeConfig = getSuggestionTypeConfig(suggestion.type);

  return (
    <div
      className={cn(
        'bg-neutral-800/50 border border-neutral-700 rounded-lg overflow-hidden',
        'hover:border-neutral-600 transition-colors',
        className
      )}
    >
      <div className={cn('p-3', compact && 'p-2.5')}>
        {/* Header */}
        <div className="flex items-start gap-2">
          <div
            className={cn(
              'flex-shrink-0 rounded-md flex items-center justify-center',
              compact ? 'w-6 h-6' : 'w-8 h-8',
              typeConfig.bgColor
            )}
          >
            <typeConfig.icon
              className={cn(
                compact ? 'w-3.5 h-3.5' : 'w-4 h-4',
                typeConfig.iconColor
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className={cn('font-medium text-white truncate', compact ? 'text-xs' : 'text-sm')}>
                {suggestion.title}
              </h4>
              {suggestion.isNew && (
                <span className="px-1.5 py-0.5 text-[8px] font-semibold bg-accent-600 text-white rounded uppercase">
                  New
                </span>
              )}
            </div>
            {suggestion.description && !compact && (
              <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2">
                {suggestion.description}
              </p>
            )}
          </div>
          {/* Confidence */}
          {suggestion.confidence >= 80 && (
            <div className="flex-shrink-0">
              <span className="text-[10px] text-green-400 font-medium">
                {suggestion.confidence}%
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        {suggestion.action && (
          <div className={cn('flex items-center gap-2', compact ? 'mt-2' : 'mt-3')}>
            <button
              onClick={suggestion.action.onClick}
              className={cn(
                'flex-1 py-1.5 text-xs font-medium rounded-md',
                'bg-accent-600/20 text-accent-400 hover:bg-accent-600/30',
                'transition-colors'
              )}
            >
              {suggestion.action.label}
            </button>
            {suggestion.secondaryAction && (
              <button
                onClick={suggestion.secondaryAction.onClick}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md',
                  'text-neutral-400 hover:text-white hover:bg-neutral-700',
                  'transition-colors'
                )}
              >
                {suggestion.secondaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Floating Copilot Trigger
// ============================================================================

export interface CopilotTriggerProps {
  position?: 'bottom-right' | 'bottom-left';
  showBadge?: boolean;
  badgeCount?: number;
  className?: string;
}

export function CopilotTrigger({
  position = 'bottom-right',
  showBadge = false,
  badgeCount = 0,
  className,
}: CopilotTriggerProps) {
  const { isOpen, toggle, suggestions } = useAICopilot();

  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
  };

  const displayBadge = showBadge || suggestions.some((s) => s.isNew);
  const displayCount = badgeCount || suggestions.filter((s) => s.isNew).length;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggle}
      className={cn(
        positionClasses[position],
        'z-40 w-14 h-14 rounded-full shadow-lg',
        'bg-gradient-to-br from-accent-500 to-purple-600',
        'hover:shadow-xl hover:shadow-accent-500/30',
        'focus:outline-none focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 focus:ring-offset-neutral-900',
        'transition-shadow duration-200',
        'flex items-center justify-center',
        isOpen && 'ring-2 ring-accent-500 ring-offset-2 ring-offset-neutral-900',
        className
      )}
    >
      <SparklesIcon className="w-6 h-6 text-white" />

      {/* Badge */}
      {displayBadge && displayCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {displayCount > 9 ? '9+' : displayCount}
        </span>
      )}
    </motion.button>
  );
}

// ============================================================================
// Inline Copilot Suggestions
// ============================================================================

export interface InlineSuggestionsProps {
  context: CopilotContext;
  maxSuggestions?: number;
  className?: string;
}

export function InlineSuggestions({
  context,
  maxSuggestions = 3,
  className,
}: InlineSuggestionsProps) {
  const { suggestions, setContext, open } = useAICopilot();

  useEffect(() => {
    setContext({ context });
  }, [context, setContext]);

  const contextSuggestions = useMemo(() => {
    return suggestions.slice(0, maxSuggestions);
  }, [suggestions, maxSuggestions]);

  if (contextSuggestions.length === 0) return null;

  return (
    <div className={cn('bg-neutral-800/30 rounded-xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-accent-400" />
          <h4 className="text-sm font-semibold text-white">AI Suggestions</h4>
        </div>
        <button
          onClick={open}
          className="text-xs text-accent-400 hover:text-accent-300"
        >
          View all
        </button>
      </div>
      <div className="space-y-2">
        {contextSuggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            compact
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Loading Dots Animation
// ============================================================================

function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 bg-neutral-400 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Configuration
// ============================================================================

const quickPrompts = [
  'Draft an email',
  'Meeting prep',
  'Client insights',
  'Review portfolio',
  'Task summary',
];

function getSuggestionTypeConfig(type: SuggestionType) {
  const configs: Record<
    SuggestionType,
    { icon: React.FC<{ className?: string }>; bgColor: string; iconColor: string }
  > = {
    action: {
      icon: ActionIcon,
      bgColor: 'bg-blue-900/30',
      iconColor: 'text-blue-400',
    },
    insight: {
      icon: InsightIcon,
      bgColor: 'bg-purple-900/30',
      iconColor: 'text-purple-400',
    },
    reminder: {
      icon: ReminderIcon,
      bgColor: 'bg-yellow-900/30',
      iconColor: 'text-yellow-400',
    },
    question: {
      icon: QuestionIcon,
      bgColor: 'bg-green-900/30',
      iconColor: 'text-green-400',
    },
    template: {
      icon: TemplateIcon,
      bgColor: 'bg-cyan-900/30',
      iconColor: 'text-cyan-400',
    },
    draft: {
      icon: DraftIcon,
      bgColor: 'bg-orange-900/30',
      iconColor: 'text-orange-400',
    },
    follow_up: {
      icon: FollowUpIcon,
      bgColor: 'bg-pink-900/30',
      iconColor: 'text-pink-400',
    },
  };

  return configs[type] || configs.action;
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// ============================================================================
// Icons
// ============================================================================

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
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

function MinimizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  );
}

function MaximizeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ActionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

function InsightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}

function ReminderIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function QuestionIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function TemplateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

function DraftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function FollowUpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  );
}

export default AICopilotProvider;

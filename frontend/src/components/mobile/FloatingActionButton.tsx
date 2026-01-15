'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/solid';

interface ActionItem {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  color?: string;
}

interface FloatingActionButtonProps {
  actions?: ActionItem[];
  onClick?: () => void;
  icon?: React.ElementType;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'bottom-center';
  color?: string;
}

export function FloatingActionButton({
  actions,
  onClick,
  icon: CustomIcon,
  label,
  position = 'bottom-right',
  color = 'bg-accent-primary',
}: FloatingActionButtonProps) {
  const [expanded, setExpanded] = useState(false);

  const hasActions = actions && actions.length > 0;
  const Icon = CustomIcon || PlusIcon;

  const handleClick = () => {
    if (hasActions) {
      setExpanded(!expanded);
    } else if (onClick) {
      onClick();
    }
  };

  const positionClasses = {
    'bottom-right': 'right-4 bottom-20',
    'bottom-left': 'left-4 bottom-20',
    'bottom-center': 'left-1/2 -translate-x-1/2 bottom-20',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-40 md:hidden`}>
      {/* Action items */}
      <AnimatePresence>
        {expanded && hasActions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-16 right-0 flex flex-col-reverse gap-3 items-end"
          >
            {actions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  action.onClick();
                  setExpanded(false);
                }}
                className="flex items-center gap-2 group"
              >
                <span className="px-3 py-1.5 bg-surface-primary rounded-lg shadow-lg text-sm font-medium text-content-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                  {action.label}
                </span>
                <div
                  className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center ${
                    action.color || 'bg-surface-primary'
                  }`}
                >
                  <action.icon
                    className={`w-6 h-6 ${
                      action.color ? 'text-white' : 'text-content-primary'
                    }`}
                  />
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop when expanded */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpanded(false)}
            className="fixed inset-0 bg-black/20 -z-10"
          />
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={handleClick}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: expanded ? 45 : 0 }}
        className={`w-14 h-14 rounded-full ${color} shadow-xl flex items-center justify-center active:shadow-lg transition-shadow`}
      >
        {expanded && hasActions ? (
          <XMarkIcon className="w-7 h-7 text-white" />
        ) : (
          <Icon className="w-7 h-7 text-white" />
        )}
      </motion.button>

      {/* Label tooltip */}
      {label && !expanded && (
        <span className="absolute right-16 top-1/2 -translate-y-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 pointer-events-none">
          {label}
        </span>
      )}
    </div>
  );
}

// Quick action FAB presets
export function QuickAddFAB({ onAddTask, onAddMeeting, onAddNote }: {
  onAddTask: () => void;
  onAddMeeting: () => void;
  onAddNote: () => void;
}) {
  const actions: ActionItem[] = [
    {
      id: 'task',
      label: 'Add Task',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      onClick: onAddTask,
      color: 'bg-blue-500',
    },
    {
      id: 'meeting',
      label: 'Schedule Meeting',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      onClick: onAddMeeting,
      color: 'bg-green-500',
    },
    {
      id: 'note',
      label: 'Add Note',
      icon: ({ className }: { className?: string }) => (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      onClick: onAddNote,
      color: 'bg-amber-500',
    },
  ];

  return <FloatingActionButton actions={actions} />;
}

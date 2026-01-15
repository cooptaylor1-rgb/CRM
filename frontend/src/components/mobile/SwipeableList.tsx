'use client';

import { useState, useRef, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo, AnimatePresence } from 'framer-motion';

export interface SwipeAction {
  id: string;
  label: string;
  icon?: React.ElementType;
  color: string;
  bgColor: string;
  onAction: () => void | Promise<void>;
}

interface SwipeableListItemProps {
  children: ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  threshold?: number;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
}

export function SwipeableListItem({
  children,
  leftActions = [],
  rightActions = [],
  threshold = 80,
  onSwipeStart,
  onSwipeEnd,
}: SwipeableListItemProps) {
  const [swiping, setSwiping] = useState(false);
  const [actionTriggered, setActionTriggered] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);

  // Calculate background opacity based on swipe distance
  const leftOpacity = useTransform(x, [0, threshold], [0, 1]);
  const rightOpacity = useTransform(x, [-threshold, 0], [1, 0]);

  // Calculate action scale
  const leftScale = useTransform(x, [0, threshold, threshold + 20], [0.8, 1, 1.1]);
  const rightScale = useTransform(x, [-threshold - 20, -threshold, 0], [1.1, 1, 0.8]);

  const handleDragStart = () => {
    setSwiping(true);
    onSwipeStart?.();
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    const offset = info.offset.x;

    // Check if we passed the threshold
    if (offset > threshold && leftActions.length > 0) {
      setActionTriggered(true);
      await leftActions[0].onAction();
      setActionTriggered(false);
    } else if (offset < -threshold && rightActions.length > 0) {
      setActionTriggered(true);
      await rightActions[0].onAction();
      setActionTriggered(false);
    }

    setSwiping(false);
    onSwipeEnd?.();
  };

  const maxLeftSwipe = leftActions.length > 0 ? threshold + 40 : 0;
  const maxRightSwipe = rightActions.length > 0 ? -(threshold + 40) : 0;

  return (
    <div ref={constraintsRef} className="relative overflow-hidden">
      {/* Left action background */}
      {leftActions.length > 0 && (
        <motion.div
          style={{ opacity: leftOpacity }}
          className={`absolute inset-y-0 left-0 flex items-center px-4 ${leftActions[0].bgColor}`}
        >
          <motion.div style={{ scale: leftScale }} className="flex items-center gap-2">
            {leftActions[0].icon && (
              <leftActions[0].icon className={`w-6 h-6 ${leftActions[0].color}`} />
            )}
            <span className={`font-medium ${leftActions[0].color}`}>
              {leftActions[0].label}
            </span>
          </motion.div>
        </motion.div>
      )}

      {/* Right action background */}
      {rightActions.length > 0 && (
        <motion.div
          style={{ opacity: rightOpacity }}
          className={`absolute inset-y-0 right-0 flex items-center justify-end px-4 ${rightActions[0].bgColor}`}
        >
          <motion.div style={{ scale: rightScale }} className="flex items-center gap-2">
            <span className={`font-medium ${rightActions[0].color}`}>
              {rightActions[0].label}
            </span>
            {rightActions[0].icon && (
              <rightActions[0].icon className={`w-6 h-6 ${rightActions[0].color}`} />
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Swipeable content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: maxRightSwipe, right: maxLeftSwipe }}
        dragElastic={0.1}
        style={{ x }}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        animate={!swiping ? { x: 0 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="relative bg-surface-primary touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
}

interface SwipeableListProps {
  children: ReactNode;
  className?: string;
}

export function SwipeableList({ children, className = '' }: SwipeableListProps) {
  return (
    <div className={`divide-y divide-border ${className}`}>
      {children}
    </div>
  );
}

// Example usage helper
export function useSwipeActions() {
  const createArchiveAction = (onArchive: () => void | Promise<void>): SwipeAction => ({
    id: 'archive',
    label: 'Archive',
    color: 'text-white',
    bgColor: 'bg-amber-500',
    onAction: onArchive,
  });

  const createDeleteAction = (onDelete: () => void | Promise<void>): SwipeAction => ({
    id: 'delete',
    label: 'Delete',
    color: 'text-white',
    bgColor: 'bg-red-500',
    onAction: onDelete,
  });

  const createCompleteAction = (onComplete: () => void | Promise<void>): SwipeAction => ({
    id: 'complete',
    label: 'Done',
    color: 'text-white',
    bgColor: 'bg-green-500',
    onAction: onComplete,
  });

  const createMarkReadAction = (onMarkRead: () => void | Promise<void>): SwipeAction => ({
    id: 'read',
    label: 'Read',
    color: 'text-white',
    bgColor: 'bg-blue-500',
    onAction: onMarkRead,
  });

  return {
    createArchiveAction,
    createDeleteAction,
    createCompleteAction,
    createMarkReadAction,
  };
}

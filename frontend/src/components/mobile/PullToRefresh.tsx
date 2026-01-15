'use client';

import { useState, useRef, ReactNode, useCallback } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
  className = '',
}: PullToRefreshProps) {
  const [refreshing, setRefreshing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const y = useMotionValue(0);

  // Transform pull distance to indicator values
  const indicatorOpacity = useTransform(y, [0, threshold / 2, threshold], [0, 0.5, 1]);
  const indicatorScale = useTransform(y, [0, threshold], [0.5, 1]);
  const indicatorRotate = useTransform(y, [0, threshold * 2], [0, 360]);

  const handleDragStart = () => {
    if (disabled || refreshing) return;
    // Only allow pull if at top of scroll
    if (containerRef.current && containerRef.current.scrollTop <= 0) {
      setPulling(true);
    }
  };

  const handleDrag = (_: any, info: PanInfo) => {
    if (!pulling || disabled || refreshing) return;

    // Only allow downward pull
    if (info.offset.y > 0) {
      // Apply resistance
      const resistance = 0.5;
      y.set(info.offset.y * resistance);
    }
  };

  const handleDragEnd = async (_: any, info: PanInfo) => {
    if (!pulling || disabled || refreshing) return;

    const currentY = y.get();

    if (currentY >= threshold) {
      // Trigger refresh
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }

    // Reset position
    setPulling(false);
  };

  // Animate back to 0 when not pulling/refreshing
  const animateY = !pulling && !refreshing ? 0 : refreshing ? threshold * 0.6 : undefined;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Pull indicator */}
      <div className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-10">
        <motion.div
          style={{
            y: useTransform(y, (value) => Math.max(0, value - 20)),
            opacity: indicatorOpacity,
            scale: indicatorScale,
          }}
          className="p-3"
        >
          <motion.div
            style={{ rotate: refreshing ? undefined : indicatorRotate }}
            animate={refreshing ? { rotate: 360 } : undefined}
            transition={refreshing ? { repeat: Infinity, duration: 1, ease: 'linear' } : undefined}
            className="p-2 bg-surface-primary rounded-full shadow-lg"
          >
            <ArrowPathIcon
              className={`w-6 h-6 ${refreshing ? 'text-accent-primary' : 'text-content-secondary'}`}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Content */}
      <motion.div
        ref={containerRef}
        drag={!disabled && !refreshing ? 'y' : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0}
        style={{ y }}
        animate={{ y: animateY }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="touch-pan-y"
      >
        {children}
      </motion.div>

      {/* Refreshing overlay */}
      {refreshing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-surface-primary/50 flex items-start justify-center pt-4 pointer-events-none"
        >
          <div className="flex items-center gap-2 text-sm text-content-secondary">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            >
              <ArrowPathIcon className="w-4 h-4" />
            </motion.div>
            <span>Refreshing...</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Simpler hook-based approach for scroll containers
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(async () => {
    const pullDistance = currentY.current - startY.current;

    if (pullDistance > 100 && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }

    startY.current = 0;
    currentY.current = 0;
  }, [onRefresh, refreshing]);

  return {
    refreshing,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

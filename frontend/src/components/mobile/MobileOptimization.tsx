'use client';

/**
 * Mobile Optimization Utilities
 *
 * This module provides comprehensive mobile optimization features including:
 * - Touch-friendly component variants
 * - Responsive hooks and utilities
 * - Offline support infrastructure
 * - Performance optimization helpers
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform } from 'framer-motion';
import {
  WifiIcon,
  SignalSlashIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  DeviceTabletIcon,
} from '@heroicons/react/24/outline';

// =============================================================================
// TYPES
// =============================================================================

type DeviceType = 'mobile' | 'tablet' | 'desktop';
type Orientation = 'portrait' | 'landscape';
type ConnectionType = 'online' | 'offline' | 'slow';

interface DeviceInfo {
  type: DeviceType;
  orientation: Orientation;
  isTouchDevice: boolean;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  isStandalone: boolean; // PWA mode
}

interface NetworkInfo {
  status: ConnectionType;
  effectiveType?: string; // 4g, 3g, 2g, slow-2g
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface OfflineQueueItem {
  id: string;
  action: string;
  data: Record<string, unknown>;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

interface MobileContextValue {
  device: DeviceInfo;
  network: NetworkInfo;
  offlineQueue: OfflineQueueItem[];
  addToOfflineQueue: (action: string, data: Record<string, unknown>) => string;
  processOfflineQueue: () => Promise<void>;
  clearOfflineQueue: () => void;
}

// =============================================================================
// BREAKPOINTS
// =============================================================================

const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
} as const;

// =============================================================================
// DEVICE DETECTION HOOK
// =============================================================================

function getDeviceType(width: number): DeviceType {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  return 'desktop';
}

function getOrientation(width: number, height: number): Orientation {
  return height > width ? 'portrait' : 'landscape';
}

function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function useDeviceInfo(): DeviceInfo {
  const [device, setDevice] = useState<DeviceInfo>({
    type: 'desktop',
    orientation: 'landscape',
    isTouchDevice: false,
    screenWidth: typeof window !== 'undefined' ? window.innerWidth : 1200,
    screenHeight: typeof window !== 'undefined' ? window.innerHeight : 800,
    pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
    isStandalone: false,
  });

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setDevice({
        type: getDeviceType(width),
        orientation: getOrientation(width, height),
        isTouchDevice: isTouchDevice(),
        screenWidth: width,
        screenHeight: height,
        pixelRatio: window.devicePixelRatio,
        isStandalone: isStandalone(),
      });
    };

    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);

    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);

  return device;
}

// =============================================================================
// NETWORK STATUS HOOK
// =============================================================================

export function useNetworkStatus(): NetworkInfo {
  const [network, setNetwork] = useState<NetworkInfo>({
    status: typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline',
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as Navigator & { connection?: {
        effectiveType?: string;
        downlink?: number;
        rtt?: number;
        saveData?: boolean;
      }}).connection;

      let status: ConnectionType = navigator.onLine ? 'online' : 'offline';

      // Detect slow connection
      if (navigator.onLine && connection) {
        if (
          connection.effectiveType === 'slow-2g' ||
          connection.effectiveType === '2g' ||
          (connection.rtt && connection.rtt > 500)
        ) {
          status = 'slow';
        }
      }

      setNetwork({
        status,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData,
      });
    };

    updateNetworkInfo();

    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    const connection = (navigator as Navigator & { connection?: EventTarget }).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', updateNetworkInfo);
      window.removeEventListener('offline', updateNetworkInfo);
      if (connection) {
        connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  return network;
}

// =============================================================================
// OFFLINE QUEUE MANAGEMENT
// =============================================================================

const OFFLINE_QUEUE_KEY = 'crm_offline_queue';

function loadOfflineQueue(): OfflineQueueItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveOfflineQueue(queue: OfflineQueueItem[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function useOfflineQueue() {
  const [queue, setQueue] = useState<OfflineQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    setQueue(loadOfflineQueue());
  }, []);

  const addToQueue = useCallback((action: string, data: Record<string, unknown>): string => {
    const item: OfflineQueueItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: 3,
    };

    setQueue((prev) => {
      const newQueue = [...prev, item];
      saveOfflineQueue(newQueue);
      return newQueue;
    });

    return item.id;
  }, []);

  const processQueue = useCallback(async () => {
    if (isProcessing || !navigator.onLine) return;

    setIsProcessing(true);
    const currentQueue = loadOfflineQueue();
    const failedItems: OfflineQueueItem[] = [];

    for (const item of currentQueue) {
      try {
        // Simulate API call - replace with actual API integration
        await new Promise((resolve, reject) => {
          setTimeout(() => {
            // Simulate 90% success rate
            if (Math.random() > 0.1) {
              resolve(true);
            } else {
              reject(new Error('Network error'));
            }
          }, 500);
        });
      } catch (error) {
        item.retries += 1;
        if (item.retries < item.maxRetries) {
          failedItems.push(item);
        } else {
          console.error(`Failed to process after ${item.maxRetries} retries:`, item);
        }
      }
    }

    setQueue(failedItems);
    saveOfflineQueue(failedItems);
    setIsProcessing(false);
  }, [isProcessing]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    saveOfflineQueue([]);
  }, []);

  // Auto-process when coming back online
  useEffect(() => {
    const handleOnline = () => {
      if (queue.length > 0) {
        processQueue();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [queue.length, processQueue]);

  return {
    queue,
    addToQueue,
    processQueue,
    clearQueue,
    isProcessing,
    pendingCount: queue.length,
  };
}

// =============================================================================
// MOBILE CONTEXT
// =============================================================================

const MobileContext = createContext<MobileContextValue | null>(null);

export function MobileProvider({ children }: { children: ReactNode }) {
  const device = useDeviceInfo();
  const network = useNetworkStatus();
  const { queue, addToQueue, processQueue, clearQueue } = useOfflineQueue();

  const value: MobileContextValue = {
    device,
    network,
    offlineQueue: queue,
    addToOfflineQueue: addToQueue,
    processOfflineQueue: processQueue,
    clearOfflineQueue: clearQueue,
  };

  return <MobileContext.Provider value={value}>{children}</MobileContext.Provider>;
}

export function useMobile(): MobileContextValue {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobile must be used within a MobileProvider');
  }
  return context;
}

// =============================================================================
// RESPONSIVE HELPERS
// =============================================================================

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.mobile - 1}px)`);
}

export function useIsTablet(): boolean {
  return useMediaQuery(
    `(min-width: ${BREAKPOINTS.mobile}px) and (max-width: ${BREAKPOINTS.tablet - 1}px)`
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery(`(min-width: ${BREAKPOINTS.tablet}px)`);
}

// =============================================================================
// TOUCH-FRIENDLY COMPONENTS
// =============================================================================

interface TouchTargetProps {
  children: ReactNode;
  onTap?: () => void;
  onLongPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSize?: number;
  className?: string;
  disabled?: boolean;
}

export function TouchTarget({
  children,
  onTap,
  onLongPress,
  onSwipeLeft,
  onSwipeRight,
  minSize = 44, // Apple's minimum touch target
  className = '',
  disabled = false,
}: TouchTargetProps) {
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    setIsPressed(true);

    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
        setIsPressed(false);
      }, 500);
    }
  }, [disabled, onLongPress]);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    setIsPressed(false);
  }, []);

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (disabled) return;

      const threshold = 50;
      if (info.offset.x < -threshold && onSwipeLeft) {
        onSwipeLeft();
      } else if (info.offset.x > threshold && onSwipeRight) {
        onSwipeRight();
      }
    },
    [disabled, onSwipeLeft, onSwipeRight]
  );

  return (
    <motion.div
      className={`
        touch-manipulation select-none
        ${disabled ? 'opacity-50 pointer-events-none' : ''}
        ${className}
      `}
      style={{ minWidth: minSize, minHeight: minSize }}
      whileTap={disabled ? undefined : { scale: 0.98 }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onClick={disabled ? undefined : onTap}
      drag={onSwipeLeft || onSwipeRight ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
    >
      {children}
    </motion.div>
  );
}

// =============================================================================
// SWIPEABLE LIST ITEM
// =============================================================================

interface SwipeableListItemProps {
  children: ReactNode;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  onSwipeComplete?: (direction: 'left' | 'right') => void;
  threshold?: number;
  className?: string;
}

export function SwipeableListItem({
  children,
  leftActions,
  rightActions,
  onSwipeComplete,
  threshold = 100,
  className = '',
}: SwipeableListItemProps) {
  const x = useMotionValue(0);
  const [swiping, setSwiping] = useState<'left' | 'right' | null>(null);

  const leftOpacity = useTransform(x, [0, threshold], [0, 1]);
  const rightOpacity = useTransform(x, [-threshold, 0], [1, 0]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > threshold) {
      const direction = info.offset.x > 0 ? 'right' : 'left';
      onSwipeComplete?.(direction);
    }
    setSwiping(null);
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Left Actions Background */}
      {leftActions && (
        <motion.div
          className="absolute inset-y-0 left-0 flex items-center px-4 bg-status-success"
          style={{ opacity: leftOpacity }}
        >
          {leftActions}
        </motion.div>
      )}

      {/* Right Actions Background */}
      {rightActions && (
        <motion.div
          className="absolute inset-y-0 right-0 flex items-center px-4 bg-status-error"
          style={{ opacity: rightOpacity }}
        >
          {rightActions}
        </motion.div>
      )}

      {/* Main Content */}
      <motion.div
        className="relative bg-white"
        style={{ x }}
        drag="x"
        dragConstraints={{ left: rightActions ? -150 : 0, right: leftActions ? 150 : 0 }}
        dragElastic={0.2}
        onDragStart={() => setSwiping(x.get() > 0 ? 'right' : 'left')}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}

// =============================================================================
// PULL TO REFRESH
// =============================================================================

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  pullDistance?: number;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  pullDistance = 80,
  className = '',
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isDragging.current = true;
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!isDragging.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const diff = currentY - startY.current;

      if (diff > 0 && containerRef.current?.scrollTop === 0) {
        e.preventDefault();
        const progress = Math.min(diff / pullDistance, 1);
        setPullProgress(progress);
      }
    },
    [isRefreshing, pullDistance]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (pullProgress >= 1 && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullProgress(0);
  }, [pullProgress, isRefreshing, onRefresh]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div ref={containerRef} className={`relative overflow-auto ${className}`}>
      {/* Pull Indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center"
        style={{ height: pullProgress * pullDistance }}
      >
        <motion.div
          animate={{ rotate: isRefreshing ? 360 : pullProgress * 360 }}
          transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : undefined}
        >
          <ArrowPathIcon
            className={`h-6 w-6 ${isRefreshing ? 'text-accent-primary' : 'text-neutral-400'}`}
          />
        </motion.div>
      </motion.div>

      {/* Content */}
      <motion.div style={{ transform: `translateY(${pullProgress * pullDistance}px)` }}>
        {children}
      </motion.div>
    </div>
  );
}

// =============================================================================
// NETWORK STATUS BANNER
// =============================================================================

interface NetworkStatusBannerProps {
  showWhenOnline?: boolean;
  className?: string;
}

export function NetworkStatusBanner({
  showWhenOnline = false,
  className = '',
}: NetworkStatusBannerProps) {
  const network = useNetworkStatus();
  const { pendingCount } = useOfflineQueue();

  if (network.status === 'online' && !showWhenOnline && pendingCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {(network.status !== 'online' || pendingCount > 0) && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className={`overflow-hidden ${className}`}
        >
          <div
            className={`
              px-4 py-2 flex items-center justify-center gap-2 text-sm
              ${network.status === 'offline'
                ? 'bg-status-error text-white'
                : network.status === 'slow'
                  ? 'bg-status-warning text-neutral-900'
                  : 'bg-status-info text-white'
              }
            `}
          >
            {network.status === 'offline' ? (
              <>
                <SignalSlashIcon className="h-4 w-4" />
                <span>You&apos;re offline. Changes will sync when connected.</span>
              </>
            ) : network.status === 'slow' ? (
              <>
                <ExclamationTriangleIcon className="h-4 w-4" />
                <span>Slow connection detected. Some features may be limited.</span>
              </>
            ) : pendingCount > 0 ? (
              <>
                <CloudArrowUpIcon className="h-4 w-4" />
                <span>Syncing {pendingCount} pending {pendingCount === 1 ? 'change' : 'changes'}...</span>
              </>
            ) : (
              <>
                <WifiIcon className="h-4 w-4" />
                <span>You&apos;re back online!</span>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// RESPONSIVE CONTAINER
// =============================================================================

interface ResponsiveContainerProps {
  children: ReactNode;
  mobile?: ReactNode;
  tablet?: ReactNode;
  desktop?: ReactNode;
  className?: string;
}

export function ResponsiveContainer({
  children,
  mobile,
  tablet,
  desktop,
  className = '',
}: ResponsiveContainerProps) {
  const device = useDeviceInfo();

  const content =
    device.type === 'mobile' && mobile
      ? mobile
      : device.type === 'tablet' && tablet
        ? tablet
        : device.type === 'desktop' && desktop
          ? desktop
          : children;

  return <div className={className}>{content}</div>;
}

// =============================================================================
// DEVICE PREVIEW (for development)
// =============================================================================

interface DevicePreviewProps {
  show?: boolean;
}

export function DevicePreview({ show = false }: DevicePreviewProps) {
  const device = useDeviceInfo();
  const network = useNetworkStatus();

  if (!show) return null;

  const DeviceIcon =
    device.type === 'mobile'
      ? DevicePhoneMobileIcon
      : device.type === 'tablet'
        ? DeviceTabletIcon
        : ComputerDesktopIcon;

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-neutral-900 text-white text-xs rounded-lg p-3 shadow-lg">
      <div className="flex items-center gap-2 mb-2">
        <DeviceIcon className="h-4 w-4" />
        <span className="font-medium capitalize">{device.type}</span>
        <span className="text-neutral-400">·</span>
        <span className="text-neutral-400">{device.orientation}</span>
      </div>
      <div className="text-neutral-400 space-y-1">
        <div>{device.screenWidth} × {device.screenHeight}</div>
        <div>Touch: {device.isTouchDevice ? 'Yes' : 'No'}</div>
        <div className="flex items-center gap-1">
          Network:
          <span className={
            network.status === 'online' ? 'text-status-success' :
            network.status === 'slow' ? 'text-status-warning' :
            'text-status-error'
          }>
            {network.status}
          </span>
          {network.effectiveType && <span>({network.effectiveType})</span>}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// SAFE AREA INSETS
// =============================================================================

export function SafeAreaInsets({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
      }}
    >
      {children}
    </div>
  );
}

// =============================================================================
// BOTTOM SHEET
// =============================================================================

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  snapPoints?: number[];
  className?: string;
}

export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoints = [0.5, 1],
  className = '',
}: BottomSheetProps) {
  const [currentSnap, setCurrentSnap] = useState(0);
  const sheetRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.y;
    const offset = info.offset.y;

    if (velocity > 500 || offset > 100) {
      if (currentSnap === 0) {
        onClose();
      } else {
        setCurrentSnap(Math.max(0, currentSnap - 1));
      }
    } else if (velocity < -500 || offset < -100) {
      setCurrentSnap(Math.min(snapPoints.length - 1, currentSnap + 1));
    }
  };

  const sheetHeight = typeof window !== 'undefined' ? window.innerHeight * snapPoints[currentSnap] : 400;

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
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: `calc(100% - ${sheetHeight}px)` }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className={`
              fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-50
              ${className}
            `}
            style={{ height: sheetHeight, maxHeight: '90vh' }}
          >
            {/* Handle */}
            <div className="flex justify-center py-3">
              <div className="w-10 h-1 bg-neutral-300 rounded-full" />
            </div>

            {/* Title */}
            {title && (
              <div className="px-4 pb-3 border-b border-neutral-200">
                <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
              </div>
            )}

            {/* Content */}
            <div className="overflow-y-auto" style={{ height: `calc(100% - ${title ? 80 : 40}px)` }}>
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// HAPTIC FEEDBACK (for supported devices)
// =============================================================================

export function useHapticFeedback() {
  const vibrate = useCallback((pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }, []);

  return {
    light: () => vibrate(10),
    medium: () => vibrate(25),
    heavy: () => vibrate(50),
    success: () => vibrate([10, 50, 10]),
    warning: () => vibrate([50, 30, 50]),
    error: () => vibrate([100, 50, 100]),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export type {
  DeviceType,
  Orientation,
  ConnectionType,
  DeviceInfo,
  NetworkInfo,
  OfflineQueueItem,
  MobileContextValue,
  TouchTargetProps,
  SwipeableListItemProps,
  PullToRefreshProps,
  NetworkStatusBannerProps,
  ResponsiveContainerProps,
  BottomSheetProps,
};

export { BREAKPOINTS };

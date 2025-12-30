'use client';

import * as React from 'react';
import { cn } from './utils';

/**
 * Tooltip Component
 * 
 * Lightweight tooltip for contextual help.
 * Uses CSS for positioning to avoid JS overhead.
 */

export interface TooltipProps {
  /** Tooltip content */
  content: React.ReactNode;
  /** Side to display tooltip */
  side?: 'top' | 'bottom' | 'left' | 'right';
  /** Alignment */
  align?: 'start' | 'center' | 'end';
  /** Delay before showing (ms) */
  delayMs?: number;
  /** Trigger element */
  children: React.ReactElement;
  /** Custom class for tooltip */
  className?: string;
  /** Disable tooltip */
  disabled?: boolean;
}

const sideStyles = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

const alignStyles = {
  top: {
    start: 'left-0 translate-x-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0 translate-x-0',
  },
  bottom: {
    start: 'left-0 translate-x-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0 translate-x-0',
  },
  left: {
    start: 'top-0 translate-y-0',
    center: 'top-1/2 -translate-y-1/2',
    end: 'bottom-0 translate-y-0',
  },
  right: {
    start: 'top-0 translate-y-0',
    center: 'top-1/2 -translate-y-1/2',
    end: 'bottom-0 translate-y-0',
  },
};

const arrowStyles = {
  top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-transparent',
  bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-transparent',
  left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-r-transparent',
  right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-l-transparent',
};

export function Tooltip({
  content,
  side = 'top',
  align = 'center',
  delayMs = 200,
  children,
  className,
  disabled = false,
}: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const timeoutRef = React.useRef<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setIsVisible(true), delayMs);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (disabled) {
    return children;
  }

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {children}

      <div
        role="tooltip"
        className={cn(
          'absolute z-tooltip pointer-events-none',
          'px-2.5 py-1.5 text-xs font-medium',
          'bg-neutral-900 text-white rounded-md shadow-lg',
          'dark:bg-neutral-100 dark:text-neutral-900',
          'whitespace-nowrap',
          'transition-opacity duration-fast',
          isVisible ? 'opacity-100' : 'opacity-0',
          side === 'top' || side === 'bottom'
            ? alignStyles[side][align]
            : sideStyles[side],
          side === 'top' && 'bottom-full mb-2',
          side === 'bottom' && 'top-full mt-2',
          className
        )}
      >
        {content}
        {/* Arrow */}
        <span
          className={cn(
            'absolute w-0 h-0',
            'border-4 border-neutral-900',
            'dark:border-neutral-100',
            arrowStyles[side]
          )}
        />
      </div>
    </div>
  );
}

/**
 * TooltipInfo Component
 * 
 * Info icon with tooltip for inline help.
 */

export interface TooltipInfoProps extends Omit<TooltipProps, 'children'> {
  /** Icon size */
  iconSize?: 'sm' | 'md' | 'lg';
}

const iconSizes = {
  sm: 'w-3.5 h-3.5',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function TooltipInfo({
  iconSize = 'md',
  ...props
}: TooltipInfoProps) {
  return (
    <Tooltip {...props}>
      <button
        type="button"
        className={cn(
          'inline-flex items-center justify-center rounded-full',
          'text-content-tertiary hover:text-content-secondary',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-500',
          'transition-colors duration-fast',
          iconSizes[iconSize]
        )}
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-full h-full"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.94 6.94a.75.75 0 11-1.061-1.061 .75.75 0 011.06 1.06zm.94 7.56V11a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0zm.06-6.5a1 1 0 11-2 0 1 1 0 012 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className="sr-only">More information</span>
      </button>
    </Tooltip>
  );
}

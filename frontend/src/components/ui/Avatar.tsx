'use client';

import * as React from 'react';
import Image from 'next/image';
import { cn } from './utils';

/**
 * Avatar Component
 * 
 * Display user avatars with fallback initials.
 * Supports multiple sizes, statuses, and grouping.
 */

export interface AvatarProps {
  /** Image source URL */
  src?: string | null;
  /** Alt text for image */
  alt?: string;
  /** Fallback name for initials */
  name?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  /** Shape variant */
  shape?: 'circle' | 'square';
  /** Status indicator */
  status?: 'online' | 'offline' | 'busy' | 'away';
  /** Custom class */
  className?: string;
}

const sizeStyles = {
  xs: 'w-6 h-6 text-2xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-14 h-14 text-lg',
  '2xl': 'w-16 h-16 text-xl',
};

const sizePx = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
  '2xl': 64,
};

const statusStyles = {
  online: 'bg-status-success-text',
  offline: 'bg-content-tertiary',
  busy: 'bg-status-error-text',
  away: 'bg-status-warning-text',
};

const statusSizes = {
  xs: 'w-1.5 h-1.5 border',
  sm: 'w-2 h-2 border',
  md: 'w-2.5 h-2.5 border-2',
  lg: 'w-3 h-3 border-2',
  xl: 'w-3.5 h-3.5 border-2',
  '2xl': 'w-4 h-4 border-2',
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Generate consistent color from name
function getColorFromName(name: string): string {
  const colors = [
    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  shape = 'circle',
  status,
  className,
}: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);
  const showFallback = !src || imgError;

  const initials = name ? getInitials(name) : '?';
  const fallbackColor = name ? getColorFromName(name) : 'bg-surface-secondary text-content-secondary';
  const pixelSize = sizePx[size];

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center flex-shrink-0',
        'font-medium select-none overflow-hidden',
        sizeStyles[size],
        shape === 'circle' ? 'rounded-full' : 'rounded-md',
        className
      )}
    >
      {showFallback ? (
        <div
          className={cn(
            'w-full h-full flex items-center justify-center',
            fallbackColor
          )}
        >
          {initials}
        </div>
      ) : (
        <Image
          src={src!}
          alt={alt || name || 'Avatar'}
          width={pixelSize}
          height={pixelSize}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
          unoptimized
        />
      )}

      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-surface',
            statusStyles[status],
            statusSizes[size]
          )}
        />
      )}
    </div>
  );
}

/**
 * AvatarGroup Component
 * 
 * Display a stack of avatars with overflow count.
 */

export interface AvatarGroupProps {
  /** Maximum avatars to show */
  max?: number;
  /** Size for all avatars */
  size?: AvatarProps['size'];
  /** Children (Avatar components) */
  children: React.ReactNode;
  /** Custom class */
  className?: string;
}

const overlapStyles = {
  xs: '-ml-2',
  sm: '-ml-2.5',
  md: '-ml-3',
  lg: '-ml-3.5',
  xl: '-ml-4',
  '2xl': '-ml-5',
};

export function AvatarGroup({
  max = 4,
  size = 'md',
  children,
  className,
}: AvatarGroupProps) {
  const avatars = React.Children.toArray(children);
  const displayAvatars = avatars.slice(0, max);
  const overflow = avatars.length - max;

  return (
    <div className={cn('flex items-center', className)}>
      {displayAvatars.map((avatar, index) => (
        <div
          key={index}
          className={cn(
            'ring-2 ring-surface rounded-full',
            index > 0 && overlapStyles[size]
          )}
        >
          {React.isValidElement(avatar)
            ? React.cloneElement(avatar as React.ReactElement<AvatarProps>, { size })
            : avatar}
        </div>
      ))}

      {overflow > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full',
            'bg-surface-secondary text-content-secondary font-medium',
            'ring-2 ring-surface',
            sizeStyles[size],
            overlapStyles[size]
          )}
        >
          +{overflow}
        </div>
      )}
    </div>
  );
}

/**
 * AvatarWithName Component
 * 
 * Avatar paired with name and optional subtitle.
 */

export interface AvatarWithNameProps extends AvatarProps {
  /** Subtitle/description */
  subtitle?: string;
  /** Show name on right side */
  namePosition?: 'right' | 'bottom';
  /** Truncate text */
  truncate?: boolean;
  /** Container class */
  containerClassName?: string;
}

export function AvatarWithName({
  subtitle,
  namePosition = 'right',
  truncate = true,
  containerClassName,
  name,
  ...avatarProps
}: AvatarWithNameProps) {
  return (
    <div
      className={cn(
        'flex items-center',
        namePosition === 'bottom' ? 'flex-col text-center' : 'gap-3',
        containerClassName
      )}
    >
      <Avatar name={name} {...avatarProps} />

      <div
        className={cn(
          'flex flex-col min-w-0',
          namePosition === 'bottom' && 'mt-2'
        )}
      >
        {name && (
          <span
            className={cn(
              'text-sm font-medium text-content-primary',
              truncate && 'truncate'
            )}
          >
            {name}
          </span>
        )}
        {subtitle && (
          <span
            className={cn(
              'text-xs text-content-tertiary',
              truncate && 'truncate'
            )}
          >
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}
